import { ParticleColorConfig } from '../base';

export class UniformColorConfig extends ParticleColorConfig {
    constructor(private color: [number, number, number] = [1, 1, 1]) {
        super();
    }

    generateColor(index: number, totalCount: number): [number, number, number] {
        return [...this.color] as [number, number, number];
    }
}

