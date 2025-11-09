'use client';

import { forwardRef, useImperativeHandle, useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';
import GPGPU from './lib/GPGPU';

import { ParticleSystemConfig, GridPositionConfig, ZeroVelocityConfig, UniformColorConfig, UniformSizeConfig } from './config';
import { ParticleBehavior } from './behaviors';
import { DefaultBehavior } from './behaviors';

// Helper functions for generating initial data using class-based approach
const generateInitialPositions = (
    count: number,
    config: any
): Float32Array => {
    const size = Math.floor(Math.sqrt(count));
    const data = new Float32Array(size * size * 4);

    // Use default grid configuration if none provided
    const positionConfig = config || new GridPositionConfig();

    for (let i = 0; i < size * size; i++) {
        const [x, y, z, age] = positionConfig.generatePosition(i, count, size);
        const index = i * 4;
        data[index] = x;
        data[index + 1] = y;
        data[index + 2] = z;
        data[index + 3] = age;
    }

    return data;
};

const generateInitialVelocities = (
    count: number,
    config: any
): Float32Array => {
    const size = Math.floor(Math.sqrt(count));
    const data = new Float32Array(size * size * 4);

    // Use default zero velocity if none provided
    const velocityConfig = config || new ZeroVelocityConfig();

    for (let i = 0; i < size * size; i++) {
        const [vx, vy, vz, unused] = velocityConfig.generateVelocity(i, count, size);
        const index = i * 4;
        data[index] = vx;
        data[index + 1] = vy;
        data[index + 2] = vz;
        data[index + 3] = unused;
    }

    return data;
};

const generateInitialColors = (
    count: number,
    config: any
): Float32Array => {
    const data = new Float32Array(count * 3);

    // Use default white color if none provided
    const colorConfig = config || new UniformColorConfig();

    for (let i = 0; i < count; i++) {
        const [r, g, b] = colorConfig.generateColor(i, count);
        data[i * 3] = r;
        data[i * 3 + 1] = g;
        data[i * 3 + 2] = b;
    }

    return data;
};

const generateInitialSizes = (
    count: number,
    config: any
): Float32Array => {
    const data = new Float32Array(count);

    // Use default uniform size if none provided
    const sizeConfig = config || new UniformSizeConfig();

    for (let i = 0; i < count; i++) {
        data[i] = sizeConfig.generateSize(i, count);
    }

    return data;
};

interface ParticleSystemProps {
    count?: number;
    config?: ParticleSystemConfig;
    behavior?: ParticleBehavior;
    customMaterial?: THREE.Material | null;
    // Legacy support
    positionShader?: string;
    velocityShader?: string;
    update?: boolean;
}

const ParticleSystem = forwardRef<{
    getParticleTexture: () => THREE.Texture | null;
    getVelocityTexture: () => THREE.Texture | null;
    reset: () => void;
}, ParticleSystemProps>(({
    count = 1024,
    config,
    behavior,
    customMaterial,
    // Legacy support
    positionShader,
    velocityShader,
    update = true,
}, ref) => {
    const { gl } = useThree();
    const meshRef = useRef<THREE.Points>(null);
    const timeRef = useRef(0);
    const prevUniformsRef = useRef<{
        position: Record<string, any>;
        velocity: Record<string, any>;
    }>({ position: {}, velocity: {} });
    // Leva controls (count is controlled by parent component)
    const particleParams = useControls('Particle System', {
        size: { value: 0.1, min: 0.001, max: 0.5, step: 0.001 },
        opacity: { value: 0.8, min: 0.0, max: 1.0, step: 0.01 },
        transparent: true,
    });

    // Determine which shaders to use (memoized to prevent recreation)
    const finalBehavior = useMemo(() => behavior || new DefaultBehavior(), [behavior]);
    const finalPositionShader = useMemo(() =>
        positionShader || finalBehavior.getPositionShader(),
        [positionShader, finalBehavior]
    );
    const finalVelocityShader = useMemo(() =>
        velocityShader || finalBehavior.getVelocityShader(),
        [velocityShader, finalBehavior]
    );

    // Initialize GPGPU with useMemo
    const gpgpu = useMemo(() => {
        const size = Math.floor(Math.sqrt(count));

        const gpgpu = new GPGPU(gl, size, size);

        // Generate initial data using class-based configuration
        const positionData = generateInitialPositions(count, config?.position);
        const velocityData = generateInitialVelocities(count, config?.velocity);

        // Create shader materials with custom uniforms from behavior
        const baseUniforms = {
            time: { value: 0.0 },
            delta: { value: 0.0 },
            positionTex: { value: null },
            velocityTex: { value: null }
        };

        const positionMaterial = new THREE.ShaderMaterial({
            uniforms: {
                ...baseUniforms,
                ...finalBehavior.getPositionUniforms()
            },
            fragmentShader: finalPositionShader,
        });

        const velocityMaterial = new THREE.ShaderMaterial({
            uniforms: {
                ...baseUniforms,
                ...finalBehavior.getVelocityUniforms()
            },
            fragmentShader: finalVelocityShader,
        });

        // Add variables to GPGPU
        gpgpu.addVariable('positionTex', positionData, positionMaterial);
        gpgpu.addVariable('velocityTex', velocityData, velocityMaterial);

        // Set dependencies
        gpgpu.setVariableDependencies('positionTex', ['positionTex', 'velocityTex']);
        gpgpu.setVariableDependencies('velocityTex', ['positionTex', 'velocityTex']);

        // Initialize
        gpgpu.init();

        return gpgpu;
    }, [gl, count, finalPositionShader, finalVelocityShader]);

    // Create particle geometry (stable, only recreates when count changes)
    const geometry = useMemo(() => {
        const size = Math.sqrt(Math.floor(count));
        const geometry = new THREE.BufferGeometry();

        // Create UV coordinates for texture sampling
        const uvs = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
            const x = (i % size) / size;
            const y = Math.floor(i / size) / size;
            uvs[i * 2] = x;
            uvs[i * 2 + 1] = y;
        }

        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        // Create dummy positions (will be updated in vertex shader)
        const positions = new Float32Array(count * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Generate initial colors using class-based configuration
        const colors = generateInitialColors(count, config?.color);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Generate initial sizes using class-based configuration
        const sizes = generateInitialSizes(count, config?.size);
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        return geometry;
    }, [count, config?.color, config?.size]);

    // Create particle material (stable shader, only uniforms change)
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                positionTex: { value: null },
                velocityTex: { value: null },
                time: { value: 0.0 },
                sizeMultiplier: { value: particleParams.size },
                opacity: { value: particleParams.opacity }
            },
            vertexShader: /*glsl*/ `
        uniform sampler2D positionTex;
        uniform float time;
        uniform float sizeMultiplier;
        
        attribute float size;
        
        varying vec3 vColor;
        varying float vAge;
        
        void main() {
          vec4 pos = texture2D(positionTex, uv);
          vColor = color;
          vAge = pos.w;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
          gl_PointSize = size * sizeMultiplier * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
            fragmentShader: /*glsl*/ `
        uniform float opacity;
        varying vec3 vColor;
        varying float vAge;
        
        void main() {
          // Create circular particles
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          gl_FragColor = vec4(vColor, opacity);
        }
      `,
            transparent: particleParams.transparent,
            vertexColors: true
        });
    }, [particleParams.transparent]);

    // Update material uniforms when particleParams change (without recreating material)
    useEffect(() => {
        if (material) {
            material.uniforms.sizeMultiplier.value = particleParams.size;
            material.uniforms.opacity.value = particleParams.opacity;
        }
    }, [material, particleParams.size, particleParams.opacity]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (gpgpu) {
                gpgpu.dispose();
            }
            if (geometry) {
                geometry.dispose();
            }
            if (material) {
                material.dispose();
            }
        };
    }, [gpgpu, geometry, material]);

    // Animation loop
    useFrame((state, delta) => {
        if (gpgpu && update) {
            const dt = Math.min(delta, 1 / 30);
            const t = timeRef.current;
            timeRef.current += dt;

            // Update time uniforms
            gpgpu.setUniform('positionTex', 'time', t);
            gpgpu.setUniform('velocityTex', 'time', t);
            gpgpu.setUniform('positionTex', 'delta', dt);
            gpgpu.setUniform('velocityTex', 'delta', dt);

            // Update custom uniforms from behavior (only if changed)
            const positionUniforms = finalBehavior.getPositionUniforms();
            const velocityUniforms = finalBehavior.getVelocityUniforms();

            Object.entries(positionUniforms).forEach(([name, uniform]) => {
                const prevValue = prevUniformsRef.current.position[name];
                if (prevValue !== uniform.value) {
                    gpgpu.setUniform('positionTex', name, uniform.value);
                    prevUniformsRef.current.position[name] = uniform.value;
                }
            });

            Object.entries(velocityUniforms).forEach(([name, uniform]) => {
                const prevValue = prevUniformsRef.current.velocity[name];
                if (prevValue !== uniform.value) {
                    gpgpu.setUniform('velocityTex', name, uniform.value);
                    prevUniformsRef.current.velocity[name] = uniform.value;
                }
            });

            // Compute particle simulation
            gpgpu.compute();

            // Update material textures
            const positionTex = gpgpu.getCurrentRenderTarget('positionTex');
            const velocityTex = gpgpu.getCurrentRenderTarget('velocityTex');

            material.uniforms.positionTex.value = positionTex;
            material.uniforms.velocityTex.value = velocityTex;
            material.uniforms.time.value = state.clock.elapsedTime;
        }
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        getParticleTexture: () => {
            if (gpgpu) {
                return gpgpu.getCurrentRenderTarget('positionTex');
            }
            return null;
        },
        getVelocityTexture: () => {
            if (gpgpu) {
                return gpgpu.getCurrentRenderTarget('velocityTex');
            }
            return null;
        },

        getMeshRef: () => {
            return meshRef.current;
        },
        reset: () => {
            // Reset particles to initial state
            if (gpgpu) {
                // Generate fresh initial data using class-based configuration
                const positionData = generateInitialPositions(count, config?.position);
                const velocityData = generateInitialVelocities(count, config?.velocity);

                // Reset variables to initial state
                gpgpu.resetVariable('positionTex', positionData);
                gpgpu.resetVariable('velocityTex', velocityData);

                // Reset time
                timeRef.current = 0;

                // Clear uniform cache
                prevUniformsRef.current.position = {};
                prevUniformsRef.current.velocity = {};
            }
        }
    }));

    return (
        <points
            ref={meshRef} geometry={geometry} material={customMaterial || material} frustumCulled={false} />
    );
});

ParticleSystem.displayName = 'ParticleSystem';

export default ParticleSystem;
