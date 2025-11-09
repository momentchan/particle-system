import { ParticleAgeConfig } from '../base';

export class RandomAgeConfig extends ParticleAgeConfig {
    constructor(private ageRange: [number, number] = [0, 1]) {
        super();
    }

    generateAge(index: number, totalCount: number): number {
        return this.ageRange[0] + Math.random() * (this.ageRange[1] - this.ageRange[0]);
    }
}

