import { ParticleBehavior } from './base';

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

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Generate 3D noise field
            float noiseX = sin(pos.x * noiseScale + time * timeScale) * cos(pos.y * noiseScale + time * timeScale * 0.7);
            float noiseY = sin(pos.y * noiseScale + time * timeScale * 1.3) * cos(pos.z * noiseScale + time * timeScale * 0.5);
            float noiseZ = sin(pos.z * noiseScale + time * timeScale * 0.9) * cos(pos.x * noiseScale + time * timeScale * 1.1);
            
            vel.xyz += vec3(noiseX, noiseY, noiseZ) * noiseStrength * delta;
            
            // Apply damping
            vel.xyz *= damping;
        `;
    }
}

