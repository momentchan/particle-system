import { ParticleBehavior, BoundaryConfig } from './base';

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

    protected getBoundaryConfig(): BoundaryConfig {
        return {
            type: 'bounce',
            min: [-10.0, -10.0, -10.0],
            max: [10.0, 10.0, 10.0],
            bounceFactor: 0.8
        };
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            gravity: { value: this.gravity },
            damping: { value: this.damping },
            turbulence: { value: this.turbulence }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Apply gravity
            vel.y += gravity * delta;
            
            // Apply damping
            vel.xyz *= damping;
            
            // Add some turbulence
            float noise = sin(pos.x * 0.1 + time) * cos(pos.z * 0.1 + time * 0.7) * turbulence;
            vel.x += noise;
            vel.z += noise;
        `;
    }
}

