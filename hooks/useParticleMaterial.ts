import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { DEFAULT_VERTEX_SHADER, DEFAULT_FRAGMENT_SHADER } from '../utils/shaders';
import { INSTANCED_VERTEX_SHADER, INSTANCED_FRAGMENT_SHADER } from '../utils/instancedShaders';

export interface UseParticleMaterialOptions {
    meshType: 'points' | 'instanced';
    count: number;
    size?: number;
    opacity?: number;
    transparent?: boolean;
}

export function useParticleMaterial({
    meshType,
    count,
    size = 0.1,
    opacity = 0.8,
    transparent = true
}: UseParticleMaterialOptions) {
    const isInstanced = meshType === 'instanced';

    const material = useMemo(() => {
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                positionTex: { value: null },
                velocityTex: { value: null },
                time: { value: 0.0 },
                sizeMultiplier: { value: size },
                opacity: { value: opacity },
                ...(isInstanced ? { instanceCount: { value: count } } : {})
            },
            vertexShader: isInstanced ? INSTANCED_VERTEX_SHADER : DEFAULT_VERTEX_SHADER,
            fragmentShader: isInstanced ? INSTANCED_FRAGMENT_SHADER : DEFAULT_FRAGMENT_SHADER,
            transparent: transparent,
            vertexColors: true
        });
        
        return mat;
    }, [meshType, count, isInstanced]);

    useEffect(() => {
        if (material) {
            material.transparent = transparent;
            material.uniforms.sizeMultiplier.value = size;
            material.uniforms.opacity.value = opacity;
        }
    }, [material, transparent, size, opacity]);

    return material;
}

