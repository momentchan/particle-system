import { ParticlePositionConfig } from '../base';

export class GridPositionConfig extends ParticlePositionConfig {
    constructor(
        private bounds: { x: [number, number]; y: [number, number]; z: [number, number] } = { x: [-1, 1], y: [-1, 1], z: [0, 0] }
    ) {
        super();
    }

    generatePosition(index: number, _totalCount: number, size: number): [number, number, number, number] {
        const i = Math.floor(index / size);
        const j = index % size;
        const x = (i / size - 0.5) * (this.bounds.x[1] - this.bounds.x[0]) + (this.bounds.x[0] + this.bounds.x[1]) / 2;
        const y = (j / size - 0.5) * (this.bounds.y[1] - this.bounds.y[0]) + (this.bounds.y[0] + this.bounds.y[1]) / 2;
        const z = this.bounds.z[0];
        return [x, y, z, 0.0];
    }
}

