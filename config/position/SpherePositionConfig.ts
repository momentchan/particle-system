import { ParticlePositionConfig } from '../base';

export class SpherePositionConfig extends ParticlePositionConfig {
    constructor(
        private radius: number = 1.0,
        private center: [number, number, number] = [0, 0, 0]
    ) {
        super();
    }

    generatePosition(index: number, _totalCount: number, size: number): [number, number, number, number] {
        const i = Math.floor(index / size);
        const j = index % size;
        const theta = (i / size) * Math.PI * 2;
        const phi = (j / size) * Math.PI;
        const x = this.center[0] + Math.sin(phi) * Math.cos(theta) * this.radius;
        const y = this.center[1] + Math.sin(phi) * Math.sin(theta) * this.radius;
        const z = this.center[2] + Math.cos(phi) * this.radius;
        return [x, y, z, 0.0];
    }
}

