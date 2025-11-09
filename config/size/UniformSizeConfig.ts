import { ParticleSizeConfig } from '../base';

export class UniformSizeConfig extends ParticleSizeConfig {
    constructor(private size: number = 0.1) {
        super();
    }

    generateSize(index: number, totalCount: number): number {
        return this.size;
    }
}

