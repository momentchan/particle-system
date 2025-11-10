'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
    ParticleSystem,
    ParticleBehavior,
    RandomBoxPositionConfig,
    ZeroVelocityConfig,
    GradientColorConfig,
    UniformSizeConfig,
    SwirlBehavior
} from '../index';
import type { ParticleSystemRef } from '../ParticleSystem';

// Custom behavior with dynamic uniforms
class CustomUniformBehavior extends ParticleBehavior {
    public uniforms: Record<string, any>;

    constructor(
        private waveSpeed: number = 1.0,
        private waveAmplitude: number = 0.5,
        private colorShift: number = 0.0
    ) {
        super();
        
        this.uniforms = {
            waveSpeed: { value: this.waveSpeed },
            waveAmplitude: { value: this.waveAmplitude },
            colorShift: { value: this.colorShift }
        };
    }

    getName(): string {
        return 'Custom Uniform';
    }

    protected getBoundaryConfig() {
        return {
            type: 'wrap' as const,
            min: [-5.0, -5.0, -5.0] as [number, number, number],
            max: [5.0, 5.0, 5.0] as [number, number, number]
        };
    }

    getVelocityUniforms(): Record<string, any> {
        return this.uniforms;
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            float wave = sin(pos.x * waveSpeed + time) * waveAmplitude;
            vel.y = wave;
            vel.x = sin(time * 0.5 + colorShift) * 0.1;
            vel.z = cos(pos.y * 0.5 + time * 0.3) * 0.05;
            vel.xyz *= 0.98;
        `;
    }
}

export default function AdvancedExamples() {
    const customUniformBehaviorRef = useRef<CustomUniformBehavior>(new CustomUniformBehavior(1.5, 0.8, 0.0));

    const customUniformConfig = useMemo(() => ({
        position: new RandomBoxPositionConfig({ x: [-4, 4], y: [-4, 4], z: [-2, 2] }),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([0.2, 0.5, 1], [1, 0.3, 0.5]),
        size: new UniformSizeConfig(1)
    }), []);

    const customMaterialConfig = useMemo(() => ({
        position: new RandomBoxPositionConfig({ x: [-4, 4], y: [-4, 4], z: [-2, 2] }),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([0.2, 0.5, 1], [1, 0.3, 0.5]),
        size: new UniformSizeConfig(1.5)
    }), []);

    const swirlBehavior = useMemo(() => new SwirlBehavior(0.8, 1.2), []);

    // Custom material with glow effect
    const customMaterial = useMemo(() => {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                positionTex: { value: null },
                velocityTex: { value: null },
                time: { value: 0.0 },
                sizeMultiplier: { value: 1.0 },
                glowIntensity: { value: 2.0 },
                glowColor: { value: new THREE.Color(0.5, 0.8, 1.0) }
            },
            vertexShader: /*glsl*/ `
                uniform sampler2D positionTex;
                uniform sampler2D velocityTex;
                uniform float time;
                uniform float sizeMultiplier;
                
                attribute float size;
                
                varying vec3 vColor;
                varying float vAge;
                varying vec3 vVelocity;
                
                void main() {
                    vec4 pos = texture2D(positionTex, uv);
                    vec4 vel = texture2D(velocityTex, uv);
                    
                    vColor = color;
                    vAge = pos.w;
                    vVelocity = vel.xyz;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
                    gl_PointSize = size * sizeMultiplier * (300.0 / -mvPosition.z) * (1.0 + length(vel.xyz) * 2.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: /*glsl*/ `
                uniform float time;
                uniform float glowIntensity;
                uniform vec3 glowColor;
                
                varying vec3 vColor;
                varying float vAge;
                varying vec3 vVelocity;
                
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    float velocityGlow = length(vVelocity) * 0.5;
                    float pulse = sin(vAge * 3.14159 * 2.0 + time * 2.0) * 0.3 + 0.7;
                    
                    vec3 finalColor = mix(vColor, glowColor, velocityGlow * glowIntensity);
                    alpha *= pulse;
                    
                    float outerGlow = 1.0 - smoothstep(0.3, 0.7, dist);
                    finalColor += glowColor * outerGlow * 0.5 * glowIntensity;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });
        
        return material;
    }, []);

    const customMaterialSystemRef = useRef<ParticleSystemRef>(null);

    useFrame((state) => {
        // Update custom uniforms dynamically
        if (customUniformBehaviorRef.current) {
            const time = state.clock.elapsedTime;
            customUniformBehaviorRef.current.uniforms.colorShift.value = Math.sin(time * 0.5) * 2.0;
        }

        // Update custom material uniforms
        if (customMaterial && customMaterialSystemRef.current) {
            const positionTex = customMaterialSystemRef.current.getParticleTexture();
            const velocityTex = customMaterialSystemRef.current.getVelocityTexture();
            
            if (positionTex) {
                customMaterial.uniforms.positionTex.value = positionTex;
            }
            if (velocityTex) {
                customMaterial.uniforms.velocityTex.value = velocityTex;
            }
            customMaterial.uniforms.time.value = state.clock.elapsedTime;
            customMaterial.uniforms.glowIntensity.value = 1.5 + Math.sin(state.clock.elapsedTime * 0.8) * 0.5;
        }
    });

    return (
        <>
            {/* Example 1: Custom behavior with dynamic uniforms */}
            <ParticleSystem
                count={256}
                config={customUniformConfig}
                behavior={customUniformBehaviorRef.current}
            />

            {/* Example 2: Custom material with glow effect */}
            <ParticleSystem
                ref={customMaterialSystemRef}
                count={512}
                config={customMaterialConfig}
                behavior={swirlBehavior}
                customMaterial={customMaterial}
            />

            {/* Example 3: Instanced mesh particles */}
            <InstancedMeshExample />
        </>
    );
}

// Instanced mesh particles example
function InstancedMeshExample() {
    const instancedConfig = useMemo(() => ({
        position: new RandomBoxPositionConfig({ x: [-3, 3], y: [-3, 3], z: [-2, 2] }),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([0.5, 0.8, 1], [1, 0.5, 0.8]),
        size: new UniformSizeConfig(1)
    }), []);

    const instancedBehavior = useMemo(() => new SwirlBehavior(0.5, 0.8), []);

    const instanceGeometry = useMemo(() => {
        return new THREE.BoxGeometry(0.1, 0.1, 0.1);
    }, []);

    return (
        <ParticleSystem
            count={256}
            config={instancedConfig}
            behavior={instancedBehavior}
            meshType="instanced"
            instanceGeometry={instanceGeometry}
        />
    );
}
