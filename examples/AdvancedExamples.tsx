'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
    ParticleSystem,
    ParticleColorConfig,
    ParticleBehavior,
    RandomPositionConfig,
    ZeroVelocityConfig,
    GradientColorConfig,
    UniformSizeConfig
} from '../index';

// Interactive behavior that responds to mouse position using the new composition system
class InteractiveBehavior extends ParticleBehavior {
    public uniforms: Record<string, any>;

    constructor(
        private mousePosition: [number, number] = [0, 0],
        private attractionStrength: number = 0.1
    ) {
        super();
        
        // Create uniforms for dynamic updates
        this.uniforms = {
            mousePosition: { value: new THREE.Vector2(...this.mousePosition) },
            attractionStrength: { value: this.attractionStrength }
        };
    }

    updateMousePosition(x: number, y: number): void {
        this.mousePosition = [x, y];
        // Update uniform value
        if (this.uniforms.mousePosition.value) {
            this.uniforms.mousePosition.value.set(x, y);
        }
    }

    getName(): string {
        return 'Interactive';
    }

    getVelocityUniforms(): Record<string, any> {
        return this.uniforms;
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Attract particles to mouse position
            vec2 mousePos = mousePosition * 10.0; // Scale to world coordinates
            vec2 force = mousePos - pos.xy;
            float dist = length(force);
            
            if (dist > 0.1) {
                force = normalize(force) * attractionStrength / (dist + 0.1);
                vel.xy += force * delta;
            }
            
            // Add some noise for organic movement
            float noise = sin(pos.x * 0.1 + time) * cos(pos.z * 0.1 + time * 0.7) * 0.02;
            vel.x += noise;
            vel.z += noise;
            
            // Damping
            vel.xyz *= 0.99;
        `;
    }
}

// Particle system that changes behavior over time using the new composition system
class MorphingBehavior extends ParticleBehavior {
    constructor(
        private morphSpeed: number = 0.5
    ) {
        super();
    }

    getName(): string {
        return 'Morphing';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            morphSpeed: { value: this.morphSpeed }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Morph between different behaviors over time
            float morphTime = sin(time * morphSpeed) * 0.5 + 0.5;
            
            // Behavior 1: Swirling motion
            float dist1 = length(pos.xy);
            float angle1 = atan(pos.y, pos.x) + time * 0.5;
            vec2 swirlVel = vec2(cos(angle1), sin(angle1)) * 0.1;
            
            // Behavior 2: Radial motion
            vec2 radialVel = normalize(pos.xy) * 0.1;
            
            // Interpolate between behaviors
            vec2 finalVel = mix(swirlVel, radialVel, morphTime);
            vel.xy = finalVel;
            vel.z = sin(dist1 * 0.1 + time) * 0.05;
            
            // Damping
            vel.xyz *= 0.98;
        `;
    }
}

// Color configuration that changes over time
class TimeBasedColorConfig extends ParticleColorConfig {
    constructor(
        private color1: [number, number, number] = [1, 0, 0],
        private color2: [number, number, number] = [0, 0, 1],
        private color3: [number, number, number] = [0, 1, 0]
    ) {
        super();
    }

    generateColor(_index: number, _totalCount: number): [number, number, number] {
        const time = Date.now() * 0.001; // Convert to seconds
        
        // Cycle through colors based on time
        const cycle = (time * 0.5) % 3;
        let r, g, b;
        
        if (cycle < 1) {
            const localT = cycle;
            r = this.color1[0] + (this.color2[0] - this.color1[0]) * localT;
            g = this.color1[1] + (this.color2[1] - this.color1[1]) * localT;
            b = this.color1[2] + (this.color2[2] - this.color1[2]) * localT;
        } else if (cycle < 2) {
            const localT = cycle - 1;
            r = this.color2[0] + (this.color3[0] - this.color2[0]) * localT;
            g = this.color2[1] + (this.color3[1] - this.color2[1]) * localT;
            b = this.color2[2] + (this.color3[2] - this.color2[2]) * localT;
        } else {
            const localT = cycle - 2;
            r = this.color3[0] + (this.color1[0] - this.color3[0]) * localT;
            g = this.color3[1] + (this.color1[1] - this.color3[1]) * localT;
            b = this.color3[2] + (this.color1[2] - this.color3[2]) * localT;
        }
        
        return [r, g, b];
    }
}

export default function AdvancedExamples() {
    const interactiveBehaviorRef = useRef<InteractiveBehavior>(new InteractiveBehavior());

    // Memoize config objects to prevent recreation on every render
    const interactiveConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-5, 5], y: [-5, 5], z: [-2, 2] }),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([0, 1, 1], [1, 0, 1]),
        size: new UniformSizeConfig(1)
    }), []);

    const morphingConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-3, 3], y: [-3, 3], z: [-1, 1] }),
        velocity: new ZeroVelocityConfig(),
        color: new TimeBasedColorConfig([1, 0, 0], [0, 1, 0], [0, 0, 1]),
        size: new UniformSizeConfig(0.8)
    }), []);

    // Memoize behavior objects to prevent recreation on every render
    const morphingBehavior = useMemo(() => new MorphingBehavior(0.3), []);

    // Update mouse position for interactive behavior
    useFrame((state) => {
        if (interactiveBehaviorRef.current) {
            // Convert mouse position to normalized coordinates
            const x = (state.mouse.x + 1) / 2;
            const y = (state.mouse.y + 1) / 2;
            interactiveBehaviorRef.current.updateMousePosition(x, y);
        }
    });

    return (
        <>
            {/* Example 1: Interactive particles that follow mouse */}
            <ParticleSystem
                count={256}
                config={interactiveConfig}
                behavior={interactiveBehaviorRef.current}
            />

            {/* Example 2: Morphing behavior that changes over time */}
            <ParticleSystem
                count={256}
                config={morphingConfig}
                behavior={morphingBehavior}
            />
        </>
    );
}
