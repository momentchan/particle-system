import { ParticleVelocityConfig } from '../base';

export class TangentialVelocityConfig extends ParticleVelocityConfig {
    constructor(
        private magnitude: number = 0.1,
        private center: [number, number] = [0, 0]
    ) {
        super();
    }

    generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number] {
        const i = Math.floor(index / size);
        const j = index % size;
        const dx = (i / size - 0.5) - this.center[0];
        const dy = (j / size - 0.5) - this.center[1];
        const vx = -dy * this.magnitude;
        const vy = dx * this.magnitude;
        return [vx, vy, 0, 0];
    }
}

