// Base behavior classes for particle system behaviors
export abstract class ParticleBehavior {
    abstract getPositionShader(): string;
    abstract getVelocityShader(): string;
    abstract getName(): string;
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
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Apply gravity
                vel.y += ${this.gravity} * delta;
                
                // Apply damping
                vel.xyz *= ${this.damping};
                
                // Add some turbulence
                float noise = sin(pos.x * 0.1 + time) * cos(pos.z * 0.1 + time * 0.7) * ${this.turbulence};
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
                
                // Create swirling motion
                float dist = length(pos.xy);
                float angle = atan(pos.y, pos.x) + time * ${this.speed};
                
                vel.x = cos(angle) * ${this.radius.toFixed(1)};
                vel.y = sin(angle) * ${this.radius.toFixed(1)};
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
