import { ParticleVelocityConfig } from '../base';

export class RandomVelocityConfig extends ParticleVelocityConfig {
    constructor(private magnitude: number = 0.1) {
        super();
    }

    generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number] {
        const vx = (Math.random() - 0.5) * this.magnitude * 2;
        const vy = (Math.random() - 0.5) * this.magnitude * 2;
        const vz = (Math.random() - 0.5) * this.magnitude * 2;
        return [vx, vy, vz, 0];
    }
}

