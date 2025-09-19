'use client';

import React from 'react';
import {
    ParticleSystem,
    ParticlePositionConfig,
    ParticleVelocityConfig,
    ParticleColorConfig,
    ParticleSizeConfig,
    ParticleBehavior,
    ShaderBuilder,
    ShaderTemplates,
    SpherePositionConfig,
    ZeroVelocityConfig,
    GradientColorConfig,
    UniformSizeConfig,
    RandomSizeConfig,
    RandomPositionConfig,
    RandomVelocityConfig
} from '../index';

// Custom configuration classes
class SpiralPositionConfig extends ParticlePositionConfig {
    constructor(
        private radius: number = 2.0,
        private height: number = 1.0,
        private turns: number = 3.0
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
        const t = index / totalCount;
        const angle = t * this.turns * Math.PI * 2;
        const r = t * this.radius;
        const x = Math.cos(angle) * r;
        const y = t * this.height - this.height / 2;
        const z = Math.sin(angle) * r;
        return [x, y, z, 0.0];
    }
}

class WaveVelocityConfig extends ParticleVelocityConfig {
    constructor(
        private amplitude: number = 0.5,
        private frequency: number = 2.0
    ) {
        super();
    }

    generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number] {
        const t = index / totalCount;
        const wave = Math.sin(t * this.frequency * Math.PI * 2) * this.amplitude;
        return [wave, 0, 0, 0];
    }
}

class RainbowColorConfig extends ParticleColorConfig {
    generateColor(index: number, totalCount: number): [number, number, number] {
        const t = index / totalCount;
        const hue = t * 360;
        // Convert HSV to RGB
        const c = 1;
        const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        const m = 0;
        
        let r, g, b;
        if (hue < 60) { r = c; g = x; b = 0; }
        else if (hue < 120) { r = x; g = c; b = 0; }
        else if (hue < 180) { r = 0; g = c; b = x; }
        else if (hue < 240) { r = 0; g = x; b = c; }
        else if (hue < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        
        return [r + m, g + m, b + m];
    }
}

class DistanceBasedSizeConfig extends ParticleSizeConfig {
    constructor(
        private minSize: number = 0.05,
        private maxSize: number = 0.3
    ) {
        super();
    }

    generateSize(index: number, totalCount: number): number {
        const t = index / totalCount;
        // Create a size that varies based on position in the array
        const size = this.minSize + (this.maxSize - this.minSize) * Math.sin(t * Math.PI);
        return size;
    }
}

// Custom behavior with custom shaders
class CustomWaveBehavior extends ParticleBehavior {
    constructor(
        private waveSpeed: number = 1.0,
        private waveAmplitude: number = 0.5
    ) {
        super();
    }

    getName(): string {
        return 'Custom Wave';
    }

    getPositionShader(): string {
        return new ShaderBuilder()
            .setPositionShader(ShaderTemplates.swirl.position)
            .build().positionShader;
    }

    getVelocityShader(): string {
        return new ShaderBuilder()
            .setVelocityShader(ShaderTemplates.swirl.velocity)
            .addUniform('waveSpeed', this.waveSpeed)
            .addUniform('waveAmplitude', this.waveAmplitude)
            .build().velocityShader;
    }
}

// Custom behavior with completely custom shaders
class FireBehavior extends ParticleBehavior {
    getName(): string {
        return 'Fire';
    }

    getPositionShader(): string {
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                pos.xyz += vel.xyz * delta;
                
                // Reset particles that go too high
                if (pos.y > 5.0) {
                    pos.y = -5.0;
                    pos.x = (uv.x - 0.5) * 2.0;
                    pos.z = (uv.y - 0.5) * 2.0;
                }
                
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `;
    }

    getVelocityShader(): string {
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Fire-like upward motion with turbulence
                vel.y += 0.1 * delta;
                
                // Add turbulence
                float noise1 = sin(pos.x * 0.1 + time) * 0.05;
                float noise2 = cos(pos.z * 0.1 + time * 0.7) * 0.05;
                vel.x += noise1;
                vel.z += noise2;
                
                // Damping
                vel.xyz *= 0.98;
                
                gl_FragColor = vel;
            }
        `;
    }
}

export default function CustomExamples() {
    return (
        <>
            {/* Example 1: Spiral particles with wave velocities and rainbow colors */}
            <ParticleSystem
                count={256}
                config={{
                    position: new SpiralPositionConfig(2.0, 1.0, 3.0),
                    velocity: new WaveVelocityConfig(0.5, 2.0),
                    color: new RainbowColorConfig(),
                    size: new DistanceBasedSizeConfig(0.5, 3)
                }}
                behavior={new CustomWaveBehavior(1.0, 0.5)}
            />

            {/* Example 2: Fire behavior with custom shaders */}
            <ParticleSystem
                count={512}
                config={{
                    position: new RandomPositionConfig({ x: [-1, 1], y: [-5, -4], z: [-1, 1] }),
                    velocity: new RandomVelocityConfig(0.1),
                    color: new GradientColorConfig([1, 0, 0], [1, 1, 0]),
                    size: new RandomSizeConfig([0.5, 1.5])
                }}
                behavior={new FireBehavior()}
            />

            {/* Example 3: Custom shader using ShaderBuilder */}
            <ParticleSystem
                count={256}
                config={{
                    position: new SpherePositionConfig(1.5, [0, 0, 0]),
                    velocity: new ZeroVelocityConfig(),
                    color: new GradientColorConfig([0, 0, 1], [1, 0, 1]),
                    size: new UniformSizeConfig(1)
                }}
                behavior={new CustomWaveBehavior(2.0, 0.8)}
            />
        </>
    );
}
