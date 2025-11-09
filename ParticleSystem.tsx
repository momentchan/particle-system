'use client';

import { forwardRef, useImperativeHandle, useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';
import GPGPU from './lib/GPGPU';

import { ParticleSystemConfig } from './config';
import { ParticleBehavior, DefaultBehavior } from './behaviors';
import {
    generateInitialPositions,
    generateInitialVelocities,
    generateInitialColors,
    generateInitialSizes
} from './utils/particleData';
import { DEFAULT_VERTEX_SHADER, DEFAULT_FRAGMENT_SHADER } from './utils/shaders';
import { INSTANCED_VERTEX_SHADER, INSTANCED_FRAGMENT_SHADER } from './utils/instancedShaders';
import { DEFAULT_PARTICLE_COUNT, MAX_DELTA_TIME } from './utils/constants';

export type ParticleMeshType = 'points' | 'instanced';

export interface ParticleSystemProps {
    count?: number;
    config?: ParticleSystemConfig;
    behavior?: ParticleBehavior;
    customMaterial?: THREE.Material | null;
    positionShader?: string;
    velocityShader?: string;
    update?: boolean;
    meshType?: ParticleMeshType;
    instanceGeometry?: THREE.BufferGeometry | null;
}

export interface ParticleSystemRef {
    getParticleTexture: () => THREE.Texture | null;
    getVelocityTexture: () => THREE.Texture | null;
    reset: () => void;
}

const ParticleSystem = forwardRef<ParticleSystemRef, ParticleSystemProps>(({
    count = DEFAULT_PARTICLE_COUNT,
    config,
    behavior,
    customMaterial,
    positionShader,
    velocityShader,
    update = true,
    meshType = 'points',
    instanceGeometry,
}, ref) => {
    const { gl } = useThree();
    const pointsRef = useRef<THREE.Points>(null);
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const timeRef = useRef(0);
    const prevUniformsRef = useRef<{
        position: Record<string, any>;
        velocity: Record<string, any>;
    }>({ position: {}, velocity: {} });

    const particleParams = useControls('Particle System', {
        size: { value: 0.1, min: 0.001, max: 0.5, step: 0.001 },
        opacity: { value: 0.8, min: 0.0, max: 1.0, step: 0.01 },
        transparent: true,
    });

    const finalBehavior = useMemo(() => behavior || new DefaultBehavior(), [behavior]);
    
    const finalPositionShader = useMemo(() => {
        return positionShader || finalBehavior.getPositionShader();
    }, [positionShader, finalBehavior]);
    
    const finalVelocityShader = useMemo(() => {
        return velocityShader || finalBehavior.getVelocityShader();
    }, [velocityShader, finalBehavior]);

    const gpgpu = useMemo(() => {
        const textureSize = Math.floor(Math.sqrt(count));
        const gpgpuInstance = new GPGPU(gl, textureSize, textureSize);

        const positionData = generateInitialPositions(count, config?.position);
        const velocityData = generateInitialVelocities(count, config?.velocity);

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

        gpgpuInstance.addVariable('positionTex', positionData, positionMaterial);
        gpgpuInstance.addVariable('velocityTex', velocityData, velocityMaterial);

        gpgpuInstance.setVariableDependencies('positionTex', ['positionTex', 'velocityTex']);
        gpgpuInstance.setVariableDependencies('velocityTex', ['positionTex', 'velocityTex']);

        gpgpuInstance.init();

        return gpgpuInstance;
    }, [gl, count, config?.position, config?.velocity, finalBehavior, finalPositionShader, finalVelocityShader]);

    // Geometry for points (needs UVs for texture sampling)
    const pointsGeometry = useMemo(() => {
        const textureSize = Math.sqrt(Math.floor(count));
        const geometryInstance = new THREE.BufferGeometry();

        const uvs = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
            const x = (i % textureSize) / textureSize;
            const y = Math.floor(i / textureSize) / textureSize;
            uvs[i * 2] = x;
            uvs[i * 2 + 1] = y;
        }

        geometryInstance.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        const positions = new Float32Array(count * 3);
        geometryInstance.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const colors = generateInitialColors(count, config?.color);
        geometryInstance.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const sizes = generateInitialSizes(count, config?.size);
        geometryInstance.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        return geometryInstance;
    }, [count, config?.color, config?.size]);

    // Instance geometry (for instanced mesh mode)
    const instancedGeo = useMemo(() => {
        if (meshType === 'instanced') {
            const geo = instanceGeometry || new THREE.BoxGeometry(0.1, 0.1, 0.1);
            // Add color attribute to instance geometry if not present
            if (!geo.attributes.color) {
                const colors = generateInitialColors(count, config?.color);
                geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            }
            return geo;
        }
        return null;
    }, [meshType, instanceGeometry, count, config?.color]);


    const material = useMemo(() => {
        const isInstanced = meshType === 'instanced';
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                positionTex: { value: null },
                velocityTex: { value: null },
                time: { value: 0.0 },
                sizeMultiplier: { value: particleParams.size },
                opacity: { value: particleParams.opacity },
                ...(isInstanced ? { instanceCount: { value: count } } : {})
            },
            vertexShader: isInstanced ? INSTANCED_VERTEX_SHADER : DEFAULT_VERTEX_SHADER,
            fragmentShader: isInstanced ? INSTANCED_FRAGMENT_SHADER : DEFAULT_FRAGMENT_SHADER,
            transparent: true, // Will be updated via useEffect
            vertexColors: true
        });
        
        return mat;
    }, [meshType, count]);

    useEffect(() => {
        if (material) {
            material.transparent = particleParams.transparent;
            material.uniforms.sizeMultiplier.value = particleParams.size;
            material.uniforms.opacity.value = particleParams.opacity;
        }
    }, [material, particleParams.transparent, particleParams.size, particleParams.opacity]);


    useEffect(() => {
        return () => {
            gpgpu?.dispose();
            pointsGeometry?.dispose();
            instancedGeo?.dispose();
            material?.dispose();
        };
    }, [gpgpu, pointsGeometry, instancedGeo, material]);

    const updateUniforms = useCallback((uniforms: Record<string, any>, variableName: string, cacheKey: 'position' | 'velocity') => {
        Object.entries(uniforms).forEach(([name, uniform]) => {
            const prevValue = prevUniformsRef.current[cacheKey][name];
            if (prevValue !== uniform.value) {
                gpgpu?.setUniform(variableName, name, uniform.value);
                prevUniformsRef.current[cacheKey][name] = uniform.value;
            }
        });
    }, [gpgpu]);

    useFrame((state, delta) => {
        if (!gpgpu || !update) return;

        // Check if GPGPU variables are initialized
        if (!gpgpu.getVariable('positionTex') || !gpgpu.getVariable('velocityTex')) {
            return;
        }

        const dt = Math.min(delta, MAX_DELTA_TIME);
        const t = timeRef.current;
        timeRef.current += dt;

        gpgpu.setUniform('positionTex', 'time', t);
        gpgpu.setUniform('velocityTex', 'time', t);
        gpgpu.setUniform('positionTex', 'delta', dt);
        gpgpu.setUniform('velocityTex', 'delta', dt);

        const positionUniforms = finalBehavior.getPositionUniforms();
        const velocityUniforms = finalBehavior.getVelocityUniforms();

        updateUniforms(positionUniforms, 'positionTex', 'position');
        updateUniforms(velocityUniforms, 'velocityTex', 'velocity');

        gpgpu.compute();

        const positionTex = gpgpu.getCurrentRenderTarget('positionTex');
        const velocityTex = gpgpu.getCurrentRenderTarget('velocityTex');

        if (positionTex && velocityTex) {
            const currentMaterial = customMaterial || material;
            if (currentMaterial instanceof THREE.ShaderMaterial) {
                currentMaterial.uniforms.positionTex.value = positionTex;
                currentMaterial.uniforms.velocityTex.value = velocityTex;
                currentMaterial.uniforms.time.value = state.clock.elapsedTime;
                if (meshType === 'instanced' && 'instanceCount' in currentMaterial.uniforms) {
                    currentMaterial.uniforms.instanceCount.value = count;
                }
            }
        }
    });

    const handleReset = useCallback(() => {
        if (!gpgpu) return;

        const positionData = generateInitialPositions(count, config?.position);
        const velocityData = generateInitialVelocities(count, config?.velocity);

        gpgpu.resetVariable('positionTex', positionData);
        gpgpu.resetVariable('velocityTex', velocityData);

        timeRef.current = 0;
        prevUniformsRef.current.position = {};
        prevUniformsRef.current.velocity = {};
    }, [gpgpu, count, config?.position, config?.velocity]);

    useImperativeHandle(ref, () => ({
        getParticleTexture: () => gpgpu?.getCurrentRenderTarget('positionTex') || null,
        getVelocityTexture: () => gpgpu?.getCurrentRenderTarget('velocityTex') || null,
        reset: handleReset
    }), [gpgpu, handleReset]);

    // Initialize instance matrices to identity (Three.js creates instanceMatrix automatically)
    useEffect(() => {
        if (meshType === 'instanced' && instancedMeshRef.current) {
            const instancedMesh = instancedMeshRef.current;
            // Three.js automatically creates instanceMatrix, we just initialize all to identity
            // Positions come from texture in shader, so identity matrices are fine
            const matrix = new THREE.Matrix4();
            for (let i = 0; i < count; i++) {
                matrix.identity();
                instancedMesh.setMatrixAt(i, matrix);
            }
            instancedMesh.instanceMatrix.needsUpdate = true;
        }
    }, [meshType, count]);

    // Render points or instanced mesh based on meshType
    if (meshType === 'instanced' && instancedGeo) {
        return (
            <instancedMesh
                ref={instancedMeshRef}
                args={[instancedGeo, customMaterial || material, count]}
                frustumCulled={false}
            />
        );
    }

    return (
        <points
            ref={pointsRef}
            geometry={pointsGeometry}
            material={customMaterial || material}
            frustumCulled={false}
        />
    );
});

ParticleSystem.displayName = 'ParticleSystem';

export default ParticleSystem;
