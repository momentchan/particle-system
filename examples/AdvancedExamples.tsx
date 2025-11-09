'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
    ParticleSystem,
    ParticlePositionConfig,
    ParticleColorConfig,
    ParticleBehavior,
    RandomPositionConfig,
    ZeroVelocityConfig,
    GradientColorConfig,
    UniformSizeConfig,
    RandomVelocityConfig,
    SwirlBehavior
} from '../index';
import type { ParticleSystemRef } from '../ParticleSystem';

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

// Custom configuration: Spiral positioning
class SpiralPositionConfig extends ParticlePositionConfig {
    constructor(
        private radius: number = 2.0,
        private height: number = 1.0,
        private turns: number = 3.0
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number): [number, number, number, number] {
        const t = index / totalCount;
        const angle = t * this.turns * Math.PI * 2;
        const r = t * this.radius;
        const x = Math.cos(angle) * r;
        const y = t * this.height - this.height / 2;
        const z = Math.sin(angle) * r;
        return [x, y, z, 0.0];
    }
}

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

// Custom behavior with fire-like motion
class FireBehavior extends ParticleBehavior {
    getName(): string {
        return 'Fire';
    }

    protected getPositionUpdateLogic(): string {
        return /*glsl*/ `
            pos.xyz += vel.xyz * delta;
            
            // Reset particles that go too high
            if (pos.y > 5.0) {
                pos.y = -5.0;
                pos.x = (uv.x - 0.5) * 2.0;
                pos.z = (uv.y - 0.5) * 2.0;
            }
        `;
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Fire-like upward motion with turbulence
            vel.y += 0.1 * delta;
            
            // Add turbulence
            float noise1 = sin(pos.x * 0.1 + time) * 0.05;
            float noise2 = cos(pos.z * 0.1 + time * 0.7) * 0.05;
            vel.x += noise1;
            vel.z += noise2;
            
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
    const customUniformBehaviorRef = useRef<CustomUniformBehavior>(new CustomUniformBehavior(1.5, 0.8, 0.0));

    // Memoize config objects to prevent recreation on every render
    const interactiveConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-5, 5], y: [-5, 5], z: [-2, 2] }),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([0, 1, 1], [1, 0, 1]),
        size: new UniformSizeConfig(1)
    }), []);

    const spiralConfig = useMemo(() => ({
        position: new SpiralPositionConfig(2.0, 1.0, 3.0),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([1, 0, 0], [0, 1, 0]),
        size: new UniformSizeConfig(1)
    }), []);

    const fireConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-1, 1], y: [-5, -4], z: [-1, 1] }),
        velocity: new RandomVelocityConfig(0.1),
        color: new GradientColorConfig([1, 0, 0], [1, 1, 0]),
        size: new UniformSizeConfig(0.8)
    }), []);

    const morphingConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-3, 3], y: [-3, 3], z: [-1, 1] }),
        velocity: new ZeroVelocityConfig(),
        color: new TimeBasedColorConfig([1, 0, 0], [0, 1, 0], [0, 0, 1]),
        size: new UniformSizeConfig(0.8)
    }), []);

    const customMaterialConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-4, 4], y: [-4, 4], z: [-2, 2] }),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([0.2, 0.5, 1], [1, 0.3, 0.5]),
        size: new UniformSizeConfig(1.5)
    }), []);

    // Memoize behavior objects to prevent recreation on every render
    const morphingBehavior = useMemo(() => new MorphingBehavior(0.3), []);
    const fireBehavior = useMemo(() => new FireBehavior(), []);
    const swirlBehavior = useMemo(() => new SwirlBehavior(0.8, 1.2), []);

    // Create custom material with glow effect
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
                    
                    // Create soft circular particles with glow
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    // Add velocity-based glow
                    float velocityGlow = length(vVelocity) * 0.5;
                    
                    // Pulsing effect based on age
                    float pulse = sin(vAge * 3.14159 * 2.0 + time * 2.0) * 0.3 + 0.7;
                    
                    // Mix particle color with glow color based on velocity
                    vec3 finalColor = mix(vColor, glowColor, velocityGlow * glowIntensity);
                    
                    // Apply pulse to alpha
                    alpha *= pulse;
                    
                    // Add outer glow
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

    // Ref for custom material particle system to update uniforms
    const customMaterialSystemRef = useRef<ParticleSystemRef>(null);

    // Update uniforms dynamically
    useFrame((state) => {
        // Update mouse position for interactive behavior
        if (interactiveBehaviorRef.current) {
            const x = (state.mouse.x + 1) / 2;
            const y = (state.mouse.y + 1) / 2;
            interactiveBehaviorRef.current.updateMousePosition(x, y);
        }

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
            
            // Animate glow intensity
            customMaterial.uniforms.glowIntensity.value = 1.5 + Math.sin(state.clock.elapsedTime * 0.8) * 0.5;
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

            {/* Example 2: Custom config (spiral) with custom behavior (dynamic uniforms) */}
            <ParticleSystem
                count={256}
                config={spiralConfig}
                behavior={customUniformBehaviorRef.current}
            />

            {/* Example 3: Fire behavior with custom position logic */}
            <ParticleSystem
                count={512}
                config={fireConfig}
                behavior={fireBehavior}
            />

            {/* Example 4: Morphing behavior that changes over time */}
            <ParticleSystem
                count={256}
                config={morphingConfig}
                behavior={morphingBehavior}
            />

            {/* Example 5: Custom material with glow effect */}
            <ParticleSystem
                ref={customMaterialSystemRef}
                count={512}
                config={customMaterialConfig}
                behavior={swirlBehavior}
                customMaterial={customMaterial}
            />
        </>
    );
}
