import { useMemo } from 'react';
import * as THREE from 'three';
import { ParticleSystemConfig } from '../config';
import {
    generateInitialColors,
    generateInitialSizes
} from '../utils/particleData';

export interface UseParticleGeometryOptions {
    count: number;
    config?: ParticleSystemConfig;
    meshType: 'points' | 'instanced';
    instanceGeometry?: THREE.BufferGeometry | null;
}

export interface UseParticleGeometryReturn {
    pointsGeometry: THREE.BufferGeometry;
    instancedGeo: THREE.BufferGeometry | null;
}

export function useParticleGeometry({
    count,
    config,
    meshType,
    instanceGeometry
}: UseParticleGeometryOptions): UseParticleGeometryReturn {
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

    return {
        pointsGeometry,
        instancedGeo
    };
}

