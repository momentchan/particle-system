import { ParticlePositionConfig } from '../base';

export class CubePositionConfig extends ParticlePositionConfig {
    constructor(
        private bounds: { x: [number, number]; y: [number, number]; z: [number, number] } = { x: [-1, 1], y: [-1, 1], z: [-1, 1] }
    ) {
        super();
    }

    generatePosition(_index: number, _totalCount: number, _size: number): [number, number, number, number] {
        const x = this.bounds.x[0] + Math.random() * (this.bounds.x[1] - this.bounds.x[0]);
        const y = this.bounds.y[0] + Math.random() * (this.bounds.y[1] - this.bounds.y[0]);
        const z = this.bounds.z[0] + Math.random() * (this.bounds.z[1] - this.bounds.z[0]);
        return [x, y, z, 0.0];
    }
}

