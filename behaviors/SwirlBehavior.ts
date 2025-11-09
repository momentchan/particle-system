import { ParticleBehavior } from './base';

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

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Create swirling motion
            float dist = length(pos.xy);
            float angle = atan(pos.y, pos.x) + time * speed;
            
            vel.x = cos(angle) * radius;
            vel.y = sin(angle) * radius;
            vel.z = sin(dist * 0.1 + time) * 0.05;
            
            // Add some damping
            vel.xyz *= 0.98;
        `;
    }
}

