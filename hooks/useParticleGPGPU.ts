import { useMemo, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GPGPU from '../lib/GPGPU';
import { ParticleSystemConfig } from '../config';
import { ParticleBehavior } from '../behaviors';
import {
    generateInitialPositions,
    generateInitialVelocities
} from '../utils/particleData';

export interface UseParticleGPGPUOptions {
    count: number;
    config?: ParticleSystemConfig;
    behavior: ParticleBehavior;
    positionShader: string;
    velocityShader: string;
}

export interface UseParticleGPGPUReturn {
    gpgpu: GPGPU | null;
    timeRef: React.MutableRefObject<number>;
    prevUniformsRef: React.MutableRefObject<{
        position: Record<string, any>;
        velocity: Record<string, any>;
    }>;
    updateUniforms: (uniforms: Record<string, any>, variableName: string, cacheKey: 'position' | 'velocity') => void;
    reset: () => void;
    getParticleTexture: () => THREE.Texture | null;
    getVelocityTexture: () => THREE.Texture | null;
}

export function useParticleGPGPU({
    count,
    config,
    behavior,
    positionShader,
    velocityShader
}: UseParticleGPGPUOptions): UseParticleGPGPUReturn {
    const { gl } = useThree();
    const timeRef = useRef(0);
    const prevUniformsRef = useRef<{
        position: Record<string, any>;
        velocity: Record<string, any>;
    }>({ position: {}, velocity: {} });

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
                ...behavior.getPositionUniforms()
            },
            fragmentShader: positionShader,
        });

        const velocityMaterial = new THREE.ShaderMaterial({
            uniforms: {
                ...baseUniforms,
                ...behavior.getVelocityUniforms()
            },
            fragmentShader: velocityShader,
        });

        gpgpuInstance.addVariable('positionTex', positionData, positionMaterial);
        gpgpuInstance.addVariable('velocityTex', velocityData, velocityMaterial);

        gpgpuInstance.setVariableDependencies('positionTex', ['positionTex', 'velocityTex']);
        gpgpuInstance.setVariableDependencies('velocityTex', ['positionTex', 'velocityTex']);

        gpgpuInstance.init();

        return gpgpuInstance;
    }, [gl, count, config?.position, config?.velocity, behavior, positionShader, velocityShader]);

    const updateUniforms = useCallback((uniforms: Record<string, any>, variableName: string, cacheKey: 'position' | 'velocity') => {
        Object.entries(uniforms).forEach(([name, uniform]) => {
            const prevValue = prevUniformsRef.current[cacheKey][name];
            if (prevValue !== uniform.value) {
                gpgpu?.setUniform(variableName, name, uniform.value);
                prevUniformsRef.current[cacheKey][name] = uniform.value;
            }
        });
    }, [gpgpu]);

    const reset = useCallback(() => {
        if (!gpgpu) return;

        const positionData = generateInitialPositions(count, config?.position);
        const velocityData = generateInitialVelocities(count, config?.velocity);

        gpgpu.resetVariable('positionTex', positionData);
        gpgpu.resetVariable('velocityTex', velocityData);

        timeRef.current = 0;
        prevUniformsRef.current.position = {};
        prevUniformsRef.current.velocity = {};
    }, [gpgpu, count, config?.position, config?.velocity]);

    const getParticleTexture = useCallback(() => {
        return gpgpu?.getCurrentRenderTarget('positionTex') || null;
    }, [gpgpu]);

    const getVelocityTexture = useCallback(() => {
        return gpgpu?.getCurrentRenderTarget('velocityTex') || null;
    }, [gpgpu]);

    return {
        gpgpu,
        timeRef,
        prevUniformsRef,
        updateUniforms,
        reset,
        getParticleTexture,
        getVelocityTexture
    };
}

