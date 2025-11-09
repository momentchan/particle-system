import { ParticleVelocityConfig } from '../base';

export class ZeroVelocityConfig extends ParticleVelocityConfig {
    generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number] {
        return [0, 0, 0, 0];
    }
}

