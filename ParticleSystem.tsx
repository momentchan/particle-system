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
import { DEFAULT_PARTICLE_COUNT, MAX_DELTA_TIME } from './utils/constants';

export interface ParticleSystemProps {
    count?: number;
    config?: ParticleSystemConfig;
    behavior?: ParticleBehavior;
    customMaterial?: THREE.Material | null;
    positionShader?: string;
    velocityShader?: string;
    update?: boolean;
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
}, ref) => {
    const { gl } = useThree();
    const meshRef = useRef<THREE.Points>(null);
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

    const geometry = useMemo(() => {
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

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                positionTex: { value: null },
                velocityTex: { value: null },
                time: { value: 0.0 },
                sizeMultiplier: { value: particleParams.size },
                opacity: { value: particleParams.opacity }
            },
            vertexShader: DEFAULT_VERTEX_SHADER,
            fragmentShader: DEFAULT_FRAGMENT_SHADER,
            transparent: particleParams.transparent,
            vertexColors: true
        });
    }, [particleParams.transparent]);

    useEffect(() => {
        if (material) {
            material.uniforms.sizeMultiplier.value = particleParams.size;
            material.uniforms.opacity.value = particleParams.opacity;
        }
    }, [material, particleParams.size, particleParams.opacity]);


    useEffect(() => {
        return () => {
            gpgpu?.dispose();
            geometry?.dispose();
            material?.dispose();
        };
    }, [gpgpu, geometry, material]);

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

        material.uniforms.positionTex.value = positionTex;
        material.uniforms.velocityTex.value = velocityTex;
        material.uniforms.time.value = state.clock.elapsedTime;
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

    return (
        <points
            ref={meshRef} geometry={geometry} material={customMaterial || material} frustumCulled={false} />
    );
});

ParticleSystem.displayName = 'ParticleSystem';

export default ParticleSystem;
