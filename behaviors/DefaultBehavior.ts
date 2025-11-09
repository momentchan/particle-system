import { ParticleBehavior, BoundaryConfig } from './base';

export class DefaultBehavior extends ParticleBehavior {
    getName(): string {
        return 'Default';
    }

    protected getBoundaryConfig(): BoundaryConfig {
        return {
            type: 'none',
            min: [0, 0, 0],
            max: [0, 0, 0]
        };
    }
}

