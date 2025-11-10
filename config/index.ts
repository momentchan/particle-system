// Re-export base classes
export * from './base';

// Import base classes for type usage
import type {
    ParticlePositionConfig,
    ParticleVelocityConfig,
    ParticleColorConfig,
    ParticleSizeConfig,
    ParticleAgeConfig
} from './base';

// Main configuration interface
export interface ParticleSystemConfig {
    position?: ParticlePositionConfig;
    velocity?: ParticleVelocityConfig;
    color?: ParticleColorConfig;
    size?: ParticleSizeConfig;
    age?: ParticleAgeConfig;
}

// Re-export position configs
export { GridPositionConfig } from './position/GridPositionConfig';
export { RandomBoxPositionConfig } from './position/RandomBoxPositionConfig';
export { SpherePositionConfig } from './position/SpherePositionConfig';
export { RandomSpherePositionConfig } from './position/RandomSpherePositionConfig';
export { CubePositionConfig } from './position/CubePositionConfig';

// Re-export velocity configs
export { ZeroVelocityConfig } from './velocity/ZeroVelocityConfig';
export { RandomVelocityConfig } from './velocity/RandomVelocityConfig';
export { RadialVelocityConfig } from './velocity/RadialVelocityConfig';
export { RadialVelocityConfig3D } from './velocity/RadialVelocityConfig3D';
export { TangentialVelocityConfig } from './velocity/TangentialVelocityConfig';

// Re-export color configs
export { UniformColorConfig } from './color/UniformColorConfig';
export { RandomColorConfig } from './color/RandomColorConfig';
export { GradientColorConfig } from './color/GradientColorConfig';

// Re-export size configs
export { UniformSizeConfig } from './size/UniformSizeConfig';
export { RandomSizeConfig } from './size/RandomSizeConfig';

// Re-export age configs
export { ZeroAgeConfig } from './age/ZeroAgeConfig';
export { RandomAgeConfig } from './age/RandomAgeConfig';
