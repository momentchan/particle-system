import { ParticleAgeConfig } from '../base';

export class ZeroAgeConfig extends ParticleAgeConfig {
    generateAge(index: number, totalCount: number): number {
        return 0;
    }
}

