'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    ParticleSystem,
    RandomPositionConfig,
    ZeroVelocityConfig,
    GradientColorConfig,
    UniformSizeConfig,
    ParticleBehavior
} from '../index';

// Custom behavior that demonstrates custom uniform usage
// Now uses the new shader composition system!
class CustomUniformBehavior extends ParticleBehavior {
    public uniforms: Record<string, any>;

    constructor(
        private waveSpeed: number = 1.0,
        private waveAmplitude: number = 0.5,
        private colorShift: number = 0.0
    ) {
        super();
        
        // Create uniforms once and store them
        this.uniforms = {
            waveSpeed: { value: this.waveSpeed },
            waveAmplitude: { value: this.waveAmplitude },
            colorShift: { value: this.colorShift }
        };
    }

    getName(): string {
        return 'Custom Uniform';
    }

    // Override boundary config for custom boundaries
    protected getBoundaryConfig() {
        return {
            type: 'wrap' as const,
            min: [-5.0, -5.0, -5.0] as [number, number, number],
            max: [5.0, 5.0, 5.0] as [number, number, number]
        };
    }

    // Provide custom uniforms for the velocity shader
    getVelocityUniforms(): Record<string, any> {
        return this.uniforms;
    }

    // Use the new composition system - just override the velocity logic!
    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Use custom uniforms to create wave motion
            float wave = sin(pos.x * waveSpeed + time) * waveAmplitude;
            vel.y = wave;
            
            // Use colorShift uniform to affect horizontal movement
            vel.x = sin(time * 0.5 + colorShift) * 0.1;
            
            // Add some vertical oscillation
            vel.z = cos(pos.y * 0.5 + time * 0.3) * 0.05;
            
            // Damping
            vel.xyz *= 0.98;
        `;
    }
}

// Behavior with multiple custom uniforms
// Now uses the new shader composition system!
class MultiUniformBehavior extends ParticleBehavior {
    public uniforms: Record<string, any>;

    constructor(
        private spiralSpeed: number = 1.0,
        private spiralRadius: number = 2.0,
        private noiseStrength: number = 0.1,
        private centerX: number = 0.0,
        private centerY: number = 0.0
    ) {
        super();
        
        // Create uniforms once and store them
        this.uniforms = {
            spiralSpeed: { value: this.spiralSpeed },
            spiralRadius: { value: this.spiralRadius },
            noiseStrength: { value: this.noiseStrength },
            centerX: { value: this.centerX },
            centerY: { value: this.centerY }
        };
    }

    getName(): string {
        return 'Multi Uniform';
    }

    // Override boundary config for custom boundaries
    protected getBoundaryConfig() {
        return {
            type: 'wrap' as const,
            min: [-8.0, -8.0, -8.0] as [number, number, number],
            max: [8.0, 8.0, 8.0] as [number, number, number]
        };
    }

    getVelocityUniforms(): Record<string, any> {
        return this.uniforms;
    }

    // Use the new composition system - just override the velocity logic!
    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Calculate distance from center
            float dx = pos.x - centerX;
            float dy = pos.y - centerY;
            float dist = sqrt(dx * dx + dy * dy);
            
            // Create spiral motion using custom uniforms
            float angle = atan(dy, dx) + time * spiralSpeed;
            float spiralForce = spiralRadius / (dist + 0.1);
            
            vel.x = cos(angle) * spiralForce * 0.1;
            vel.y = sin(angle) * spiralForce * 0.1;
            
            // Add noise using custom uniform
            float noise = sin(pos.x * 0.1 + time) * cos(pos.z * 0.1 + time * 0.7);
            vel.x += noise * noiseStrength;
            vel.z += noise * noiseStrength * 0.5;
            
            // Damping
            vel.xyz *= 0.99;
        `;
    }
}

export default function CustomUniformExamples() {
    const behaviorRef1 = useRef<CustomUniformBehavior>(new CustomUniformBehavior(1.5, 0.8, 0.0));
    const behaviorRef2 = useRef<MultiUniformBehavior>(new MultiUniformBehavior(2.0, 3.0, 0.15, 0.0, 0.0));

    // Memoize config objects to prevent recreation on every render
    const waveConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-4, 4], y: [-4, 4], z: [-2, 2] }),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([0, 1, 1], [1, 0, 1]),
        size: new UniformSizeConfig(1.2)
    }), []);

    const spiralConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-6, 6], y: [-6, 6], z: [-3, 3] }),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([1, 0.5, 0], [0, 1, 0.5]),
        size: new UniformSizeConfig(0.8)
    }), []);

    // Animate custom uniforms over time
    useFrame((state) => {
        if (behaviorRef1.current) {
            // Update custom uniforms dynamically
            const time = state.clock.elapsedTime;
            behaviorRef1.current.uniforms.colorShift.value = Math.sin(time * 0.5) * 2.0;
        }

        if (behaviorRef2.current) {
            // Update center position for spiral effect
            const time = state.clock.elapsedTime;
            behaviorRef2.current.uniforms.centerX.value = Math.sin(time * 0.3) * 2.0;
            behaviorRef2.current.uniforms.centerY.value = Math.cos(time * 0.3) * 2.0;
        }
    });

    return (
        <>
            {/* Example 1: Simple custom uniforms - wave motion */}
            <ParticleSystem
                count={256}
                config={waveConfig}
                behavior={behaviorRef1.current}
            />

            {/* Example 2: Multiple custom uniforms - spiral motion */}
            <ParticleSystem
                count={256}
                config={spiralConfig}
                behavior={behaviorRef2.current}
            />
        </>
    );
}
