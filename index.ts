// Main exports for the Particle System Library

// Core component
export { default as ParticleSystem } from './ParticleSystem';

// Configuration classes
export * from './config';

// Behavior classes
export * from './behaviors';

// Shader utilities
export * from './shaders';

// Re-export commonly used classes for convenience
export {
    // Position configs
    GridPositionConfig,
    RandomPositionConfig,
    SpherePositionConfig,
    CubePositionConfig,
    
    // Velocity configs
    ZeroVelocityConfig,
    RandomVelocityConfig,
    RadialVelocityConfig,
    TangentialVelocityConfig,
    
    // Color configs
    UniformColorConfig,
    RandomColorConfig,
    GradientColorConfig,
    
    // Size configs
    UniformSizeConfig,
    RandomSizeConfig,
    
    // Age configs
    ZeroAgeConfig,
    RandomAgeConfig
} from './config';

// Export types separately
export type { ParticleSystemConfig } from './config';

export {
    // Behaviors
    DefaultBehavior,
    GravityBehavior,
    SwirlBehavior,
    AttractorBehavior,
    WaveBehavior,
    ExplosionBehavior
} from './behaviors';

export {
    // Shader utilities
    ShaderBuilder,
    ShaderTemplates,
    ShaderUtils
} from './shaders';
