import { ParticleColorConfig } from '../base';

export class RandomColorConfig extends ParticleColorConfig {
    constructor(
        private colorRange: { r: [number, number]; g: [number, number]; b: [number, number] } = {
            r: [0, 1], g: [0, 1], b: [0, 1]
        }
    ) {
        super();
    }

    generateColor(index: number, totalCount: number): [number, number, number] {
        const r = this.colorRange.r[0] + Math.random() * (this.colorRange.r[1] - this.colorRange.r[0]);
        const g = this.colorRange.g[0] + Math.random() * (this.colorRange.g[1] - this.colorRange.g[0]);
        const b = this.colorRange.b[0] + Math.random() * (this.colorRange.b[1] - this.colorRange.b[0]);
        return [r, g, b];
    }
}

