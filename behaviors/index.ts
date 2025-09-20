import * as THREE from 'three';

// Base behavior classes for particle system behaviors
export abstract class ParticleBehavior {
    abstract getPositionShader(): string;
    abstract getVelocityShader(): string;
    abstract getName(): string;
    
    // Override this method to provide custom uniforms
    getCustomUniforms(): Record<string, any> {
        return {};
    }
    
    // Override this method to provide custom uniforms for position shader
    getPositionUniforms(): Record<string, any> {
        return {};
    }
    
    // Override this method to provide custom uniforms for velocity shader
    getVelocityUniforms(): Record<string, any> {
        return {};
    }
}

// Built-in behaviors
export class GravityBehavior extends ParticleBehavior {
    constructor(
        private gravity: number = -0.1,
        private damping: number = 0.995,
        private turbulence: number = 0.05
    ) {
        super();
    }

    getName(): string {
        return 'Gravity';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            gravity: { value: this.gravity },
            damping: { value: this.damping },
            turbulence: { value: this.turbulence }
        };
    }

    getPositionShader(): string {
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                // Update position with velocity
                pos.xyz += vel.xyz * delta;
                
                // Boundary conditions - bounce
                if (pos.x > 10.0) { pos.x = 10.0; vel.x *= -0.8; }
                if (pos.x < -10.0) { pos.x = -10.0; vel.x *= -0.8; }
                if (pos.y > 10.0) { pos.y = 10.0; vel.y *= -0.8; }
                if (pos.y < -10.0) { pos.y = -10.0; vel.y *= -0.8; }
                if (pos.z > 10.0) { pos.z = 10.0; vel.z *= -0.8; }
                if (pos.z < -10.0) { pos.z = -10.0; vel.z *= -0.8; }
                
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `;
    }

    getVelocityShader(): string {
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform float gravity;
            uniform float damping;
            uniform float turbulence;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Apply gravity
                vel.y += gravity * delta;
                
                // Apply damping
                vel.xyz *= damping;
                
                // Add some turbulence
                float noise = sin(pos.x * 0.1 + time) * cos(pos.z * 0.1 + time * 0.7) * turbulence;
                vel.x += noise;
                vel.z += noise;
                
                gl_FragColor = vel;
            }
        `;
    }
}

export class SwirlBehavior extends ParticleBehavior {
    constructor(
        private speed: number = 0.5,
        private radius: number = 1.0
    ) {
        super();
    }

    getName(): string {
        return 'Swirl';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            speed: { value: this.speed },
            radius: { value: this.radius }
        };
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
                
                // Wrap around boundaries
                if (pos.x > 10.0) pos.x = -10.0;
                if (pos.x < -10.0) pos.x = 10.0;
                if (pos.y > 10.0) pos.y = -10.0;
                if (pos.y < -10.0) pos.y = 10.0;
                if (pos.z > 10.0) pos.z = -10.0;
                if (pos.z < -10.0) pos.z = 10.0;
                
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `;
    }

    getVelocityShader(): string {
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform float speed;
            uniform float radius;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Create swirling motion
                float dist = length(pos.xy);
                float angle = atan(pos.y, pos.x) + time * speed;
                
                vel.x = cos(angle) * radius;
                vel.y = sin(angle) * radius;
                vel.z = sin(dist * 0.1 + time) * 0.05;
                
                // Add some damping
                vel.xyz *= 0.98;
                
                gl_FragColor = vel;
            }
        `;
    }
}

export class AttractorBehavior extends ParticleBehavior {
    constructor(
        private attractorPosition: [number, number, number] = [0, 0, 0],
        private strength: number = 0.1,
        private damping: number = 0.99
    ) {
        super();
    }

    getName(): string {
        return 'Attractor';
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
                
                // Wrap around boundaries
                if (pos.x > 10.0) pos.x = -10.0;
                if (pos.x < -10.0) pos.x = 10.0;
                if (pos.y > 10.0) pos.y = -10.0;
                if (pos.y < -10.0) pos.y = 10.0;
                if (pos.z > 10.0) pos.z = -10.0;
                if (pos.z < -10.0) pos.z = 10.0;
                
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
                
                // Create attractor at specified position
                vec3 attractor = vec3(${this.attractorPosition[0]}, ${this.attractorPosition[1]}, ${this.attractorPosition[2]});
                vec3 force = attractor - pos.xyz;
                float dist = length(force);
                
                if (dist > 0.1) {
                    force = normalize(force) * ${this.strength} / (dist * dist);
                }
                
                vel.xyz += force * delta;
                
                // Apply damping
                vel.xyz *= ${this.damping};
                
                gl_FragColor = vel;
            }
        `;
    }
}

export class WaveBehavior extends ParticleBehavior {
    constructor(
        private amplitude: number = 0.5,
        private frequency: number = 2.0,
        private speed: number = 1.0
    ) {
        super();
    }

    getName(): string {
        return 'Wave';
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
                
                // Wrap around boundaries
                if (pos.x > 10.0) pos.x = -10.0;
                if (pos.x < -10.0) pos.x = 10.0;
                if (pos.y > 10.0) pos.y = -10.0;
                if (pos.y < -10.0) pos.y = 10.0;
                if (pos.z > 10.0) pos.z = -10.0;
                if (pos.z < -10.0) pos.z = 10.0;
                
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
                
                // Create wave motion
                float wave = sin(pos.x * ${this.frequency} + time * ${this.speed}) * ${this.amplitude};
                vel.y = wave;
                
                // Add some damping
                vel.xyz *= 0.99;
                
                gl_FragColor = vel;
            }
        `;
    }
}

export class ExplosionBehavior extends ParticleBehavior {
    constructor(
        private explosionCenter: [number, number, number] = [0, 0, 0],
        private force: number = 1.0,
        private damping: number = 0.98
    ) {
        super();
    }

    getName(): string {
        return 'Explosion';
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
                
                // Wrap around boundaries
                if (pos.x > 10.0) pos.x = -10.0;
                if (pos.x < -10.0) pos.x = 10.0;
                if (pos.y > 10.0) pos.y = -10.0;
                if (pos.y < -10.0) pos.y = 10.0;
                if (pos.z > 10.0) pos.z = -10.0;
                if (pos.z < -10.0) pos.z = 10.0;
                
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
                
                // Create explosion force from center
                vec3 center = vec3(${this.explosionCenter[0]}, ${this.explosionCenter[1]}, ${this.explosionCenter[2]});
                vec3 direction = pos.xyz - center;
                float dist = length(direction);
                
                if (dist > 0.01) {
                    direction = normalize(direction);
                    vel.xyz += direction * ${this.force} * delta / (dist + 0.1);
                }
                
                // Apply damping
                vel.xyz *= ${this.damping};
                
                gl_FragColor = vel;
            }
        `;
    }
}

// Advanced behaviors with custom uniforms
export class MagneticFieldBehavior extends ParticleBehavior {
    constructor(
        private fieldStrength: number = 0.5,
        private fieldDirection: [number, number, number] = [0, 1, 0],
        private turbulence: number = 0.1,
        private damping: number = 0.98
    ) {
        super();
    }

    getName(): string {
        return 'Magnetic Field';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            fieldStrength: { value: this.fieldStrength },
            fieldDirection: { value: new THREE.Vector3(...this.fieldDirection) },
            turbulence: { value: this.turbulence },
            damping: { value: this.damping }
        };
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
                
                // Wrap around boundaries
                if (pos.x > 10.0) pos.x = -10.0;
                if (pos.x < -10.0) pos.x = 10.0;
                if (pos.y > 10.0) pos.y = -10.0;
                if (pos.y < -10.0) pos.y = 10.0;
                if (pos.z > 10.0) pos.z = -10.0;
                if (pos.z < -10.0) pos.z = 10.0;
                
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `;
    }

    getVelocityShader(): string {
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform float fieldStrength;
            uniform vec3 fieldDirection;
            uniform float turbulence;
            uniform float damping;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Apply magnetic field force (Lorentz force)
                vec3 crossProduct = cross(vel.xyz, fieldDirection);
                vel.xyz += crossProduct * fieldStrength * delta;
                
                // Add turbulence
                float noise1 = sin(pos.x * 0.1 + time) * cos(pos.z * 0.1 + time * 0.7);
                float noise2 = sin(pos.y * 0.15 + time * 1.3) * cos(pos.x * 0.12 + time * 0.5);
                vel.xyz += vec3(noise1, noise2, noise1 * noise2) * turbulence * delta;
                
                // Apply damping
                vel.xyz *= damping;
                
                gl_FragColor = vel;
            }
        `;
    }
}

export class SpringBehavior extends ParticleBehavior {
    constructor(
        private springConstant: number = 0.5,
        private restLength: number = 1.0,
        private damping: number = 0.9,
        private center: [number, number, number] = [0, 0, 0]
    ) {
        super();
    }

    getName(): string {
        return 'Spring';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            springConstant: { value: this.springConstant },
            restLength: { value: this.restLength },
            damping: { value: this.damping },
            center: { value: new THREE.Vector3(...this.center) }
        };
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
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `;
    }

    getVelocityShader(): string {
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform float springConstant;
            uniform float restLength;
            uniform float damping;
            uniform vec3 center;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Calculate spring force
                vec3 displacement = pos.xyz - center;
                float distance = length(displacement);
                
                if (distance > 0.001) {
                    vec3 springForce = -normalize(displacement) * springConstant * (distance - restLength);
                    vel.xyz += springForce * delta;
                }
                
                // Apply damping
                vel.xyz *= damping;
                
                gl_FragColor = vel;
            }
        `;
    }
}

export class NoiseFieldBehavior extends ParticleBehavior {
    constructor(
        private noiseScale: number = 0.1,
        private noiseStrength: number = 0.5,
        private timeScale: number = 1.0,
        private damping: number = 0.95
    ) {
        super();
    }

    getName(): string {
        return 'Noise Field';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            noiseScale: { value: this.noiseScale },
            noiseStrength: { value: this.noiseStrength },
            timeScale: { value: this.timeScale },
            damping: { value: this.damping }
        };
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
                
                // Wrap around boundaries
                if (pos.x > 10.0) pos.x = -10.0;
                if (pos.x < -10.0) pos.x = 10.0;
                if (pos.y > 10.0) pos.y = -10.0;
                if (pos.y < -10.0) pos.y = 10.0;
                if (pos.z > 10.0) pos.z = -10.0;
                if (pos.z < -10.0) pos.z = 10.0;
                
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `;
    }

    getVelocityShader(): string {
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform float noiseScale;
            uniform float noiseStrength;
            uniform float timeScale;
            uniform float damping;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Generate 3D noise field
                float noiseX = sin(pos.x * noiseScale + time * timeScale) * cos(pos.y * noiseScale + time * timeScale * 0.7);
                float noiseY = sin(pos.y * noiseScale + time * timeScale * 1.3) * cos(pos.z * noiseScale + time * timeScale * 0.5);
                float noiseZ = sin(pos.z * noiseScale + time * timeScale * 0.9) * cos(pos.x * noiseScale + time * timeScale * 1.1);
                
                vel.xyz += vec3(noiseX, noiseY, noiseZ) * noiseStrength * delta;
                
                // Apply damping
                vel.xyz *= damping;
                
                gl_FragColor = vel;
            }
        `;
    }
}

// Default behavior (simple movement)
export class DefaultBehavior extends ParticleBehavior {
    getName(): string {
        return 'Default';
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
                
                // Simple damping
                vel.xyz *= 0.99;
                
                gl_FragColor = vel;
            }
        `;
    }
}
