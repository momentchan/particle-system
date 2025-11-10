'use client';

import { forwardRef, useImperativeHandle, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { ParticleSystemConfig } from './config';
import { ParticleBehavior, DefaultBehavior } from './behaviors';
import { useParticleGPGPU } from './hooks/useParticleGPGPU';
import { useParticleGeometry } from './hooks/useParticleGeometry';
import { useParticleMaterial } from './hooks/useParticleMaterial';
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
    // Optional material properties (if not using customMaterial)
    size?: number;
    opacity?: number;
    transparent?: boolean;
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
    size = 0.1,
    opacity = 0.8,
    transparent = true,
}, ref) => {
    const pointsRef = useRef<THREE.Points>(null);
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const gpgpuInitializedRef = useRef(false);

    const finalBehavior = useMemo(() => behavior || new DefaultBehavior(), [behavior]);
    
    const finalPositionShader = useMemo(() => {
        return positionShader || finalBehavior.getPositionShader();
    }, [positionShader, finalBehavior]);
    
    const finalVelocityShader = useMemo(() => {
        return velocityShader || finalBehavior.getVelocityShader();
    }, [velocityShader, finalBehavior]);

    const {
        gpgpu,
        timeRef,
        updateUniforms,
        reset: resetGPGPU,
        getParticleTexture,
        getVelocityTexture
    } = useParticleGPGPU({
        count,
        config,
        behavior: finalBehavior,
        positionShader: finalPositionShader,
        velocityShader: finalVelocityShader
    });

    const { pointsGeometry, instancedGeo } = useParticleGeometry({
        count,
        config,
        meshType,
        instanceGeometry
    });

    const material = useParticleMaterial({
        meshType,
        count,
        size,
        opacity,
        transparent
    });


    useEffect(() => {
        // Reset initialization flag when GPGPU changes
        gpgpuInitializedRef.current = false;
        
        // Initialize GPGPU and set textures immediately
        if (gpgpu && update) {
            // Use requestAnimationFrame to ensure WebGL context is ready
            const frameId = requestAnimationFrame(() => {
                if (gpgpu.getVariable('positionTex') && gpgpu.getVariable('velocityTex')) {
                    // Set initial uniforms
                    gpgpu.setUniform('positionTex', 'time', 0);
                    gpgpu.setUniform('velocityTex', 'time', 0);
                    gpgpu.setUniform('positionTex', 'delta', 0);
                    gpgpu.setUniform('velocityTex', 'delta', 0);
                    
                    const positionUniforms = finalBehavior.getPositionUniforms();
                    const velocityUniforms = finalBehavior.getVelocityUniforms();
                    
                    updateUniforms(positionUniforms, 'positionTex', 'position');
                    updateUniforms(velocityUniforms, 'velocityTex', 'velocity');
                    
                    // Get textures immediately (init() already rendered initial data)
                    const positionTex = gpgpu.getCurrentRenderTarget('positionTex');
                    const velocityTex = gpgpu.getCurrentRenderTarget('velocityTex');
                    
                    if (positionTex && velocityTex) {
                        const currentMaterial = customMaterial || material;
                        if (currentMaterial && 'uniforms' in currentMaterial && currentMaterial.uniforms) {
                            const uniforms = currentMaterial.uniforms as Record<string, { value: any }>;
                            if (uniforms.positionTex) uniforms.positionTex.value = positionTex;
                            if (uniforms.velocityTex) uniforms.velocityTex.value = velocityTex;
                        }
                    }
                    
                    gpgpuInitializedRef.current = true;
                }
            });
            
            return () => {
                cancelAnimationFrame(frameId);
            };
        }
        
        return () => {
            gpgpu?.dispose();
            pointsGeometry?.dispose();
            instancedGeo?.dispose();
            material?.dispose();
        };
    }, [gpgpu, pointsGeometry, instancedGeo, material, customMaterial, update, finalBehavior, updateUniforms]);

    useFrame((state, delta) => {
        if (!gpgpu || !update) return;

        // Check if GPGPU variables are initialized
        const positionVar = gpgpu.getVariable('positionTex');
        const velocityVar = gpgpu.getVariable('velocityTex');
        
        if (!positionVar || !velocityVar) {
            return;
        }
        
        // Ensure textures are set on first frame
        if (!gpgpuInitializedRef.current) {
            const positionTex = gpgpu.getCurrentRenderTarget('positionTex');
            const velocityTex = gpgpu.getCurrentRenderTarget('velocityTex');
            
            if (positionTex && velocityTex) {
                const currentMaterial = customMaterial || material;
                if (currentMaterial && 'uniforms' in currentMaterial && currentMaterial.uniforms) {
                    const uniforms = currentMaterial.uniforms as Record<string, { value: any }>;
                    if (uniforms.positionTex) uniforms.positionTex.value = positionTex;
                    if (uniforms.velocityTex) uniforms.velocityTex.value = velocityTex;
                }
                gpgpuInitializedRef.current = true;
            }
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
            // Check if material has uniforms property (works for ShaderMaterial and CSM)
            if (currentMaterial && 'uniforms' in currentMaterial && currentMaterial.uniforms) {
                const uniforms = currentMaterial.uniforms as Record<string, { value: any }>;
                if (uniforms.positionTex) uniforms.positionTex.value = positionTex;
                if (uniforms.velocityTex) uniforms.velocityTex.value = velocityTex;
                if (uniforms.time) uniforms.time.value = state.clock.elapsedTime;
                if (meshType === 'instanced' && uniforms.instanceCount) {
                    uniforms.instanceCount.value = count;
                }
            }
        }
    });

    useImperativeHandle(ref, () => ({
        getParticleTexture,
        getVelocityTexture,
        reset: resetGPGPU
    }), [getParticleTexture, getVelocityTexture]);

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
