import { ParticleSizeConfig } from '../base';

export class RandomSizeConfig extends ParticleSizeConfig {
    constructor(private sizeRange: [number, number] = [0.05, 0.2]) {
        super();
    }

    generateSize(index: number, totalCount: number): number {
        return this.sizeRange[0] + Math.random() * (this.sizeRange[1] - this.sizeRange[0]);
    }
}

