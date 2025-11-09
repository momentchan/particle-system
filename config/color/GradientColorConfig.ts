import { ParticleColorConfig } from '../base';

export class GradientColorConfig extends ParticleColorConfig {
    constructor(
        private startColor: [number, number, number] = [1, 0, 0],
        private endColor: [number, number, number] = [0, 0, 1]
    ) {
        super();
    }

    generateColor(index: number, totalCount: number): [number, number, number] {
        const t = index / totalCount;
        const r = this.startColor[0] + t * (this.endColor[0] - this.startColor[0]);
        const g = this.startColor[1] + t * (this.endColor[1] - this.startColor[1]);
        const b = this.startColor[2] + t * (this.endColor[2] - this.startColor[2]);
        return [r, g, b];
    }
}

