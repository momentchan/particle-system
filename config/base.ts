// Base configuration classes with override functions
export abstract class ParticlePositionConfig {
    abstract generatePosition(index: number, totalCount: number, size: number): [number, number, number, number]; // [x, y, z, age]
}

export abstract class ParticleVelocityConfig {
    abstract generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number]; // [vx, vy, vz, unused]
}

export abstract class ParticleColorConfig {
    abstract generateColor(index: number, totalCount: number): [number, number, number]; // [r, g, b]
}

export abstract class ParticleSizeConfig {
    abstract generateSize(index: number, totalCount: number): number;
}

export abstract class ParticleAgeConfig {
    abstract generateAge(index: number, totalCount: number): number;
}

