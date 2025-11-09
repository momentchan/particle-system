import { ParticleBehavior } from './base';

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

    getVelocityUniforms(): Record<string, any> {
        return {
            amplitude: { value: this.amplitude },
            frequency: { value: this.frequency },
            speed: { value: this.speed }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Create wave motion
            float wave = sin(pos.x * frequency + time * speed) * amplitude;
            vel.y = wave;
            
            // Add some damping
            vel.xyz *= 0.99;
        `;
    }
}

