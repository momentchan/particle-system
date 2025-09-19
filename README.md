# Particle System Library

A comprehensive, modular particle system library for React Three Fiber that allows easy customization of both initial data and behaviors through a class-based architecture.

## Features

- **Modular Architecture**: Well-organized modules for configurations, behaviors, and shaders
- **Class-Based Customization**: Extend base classes to create custom particle configurations and behaviors
- **Built-in Patterns**: Pre-built configurations for common particle patterns
- **Custom Shaders**: Support for custom GLSL shaders with utility functions
- **TypeScript Support**: Full type safety and IntelliSense support
- **Performance Optimized**: GPU-based particle simulation using WebGL
- **Easy Integration**: Simple API that works seamlessly with React Three Fiber

## Quick Start

```tsx
import { ParticleSystem, SpherePositionConfig, RadialVelocityConfig, GradientColorConfig } from './particle-system';

function MyScene() {
  return (
    <ParticleSystem
      count={256}
      config={{
        position: new SpherePositionConfig(2.0, [0, 0, 0]),
        velocity: new RadialVelocityConfig(0.2),
        color: new GradientColorConfig([1, 0, 0], [0, 1, 0]),
        size: new UniformSizeConfig(0.1)
      }}
      behavior={new GravityBehavior()}
    />
  );
}
```

## Architecture

### Core Modules

1. **Configuration Module** (`./config/`): Handles initial particle data
2. **Behavior Module** (`./behaviors/`): Defines particle movement and interaction
3. **Shader Module** (`./shaders/`): Provides shader utilities and templates
4. **Main Component** (`ParticleSystem.tsx`): The main React component

### Configuration Classes

#### Position Configurations
- `GridPositionConfig`: Arranges particles in a grid pattern
- `RandomPositionConfig`: Randomly distributes particles within bounds
- `SpherePositionConfig`: Positions particles on a sphere surface
- `CubePositionConfig`: Randomly distributes particles within a cube

#### Velocity Configurations
- `ZeroVelocityConfig`: No initial velocity
- `RandomVelocityConfig`: Random velocities with specified magnitude
- `RadialVelocityConfig`: Velocities pointing outward from center
- `TangentialVelocityConfig`: Velocities perpendicular to radial direction

#### Color Configurations
- `UniformColorConfig`: Single color for all particles
- `RandomColorConfig`: Random colors within specified ranges
- `GradientColorConfig`: Smooth color transition across particles

#### Size Configurations
- `UniformSizeConfig`: Same size for all particles
- `RandomSizeConfig`: Random sizes within specified range

### Behavior Classes

#### Built-in Behaviors
- `DefaultBehavior`: Simple movement with damping
- `GravityBehavior`: Gravity simulation with bouncing boundaries
- `SwirlBehavior`: Swirling motion around center
- `AttractorBehavior`: Particles attracted to a specific point
- `WaveBehavior`: Wave-like motion
- `ExplosionBehavior`: Explosion-like outward force

## Creating Custom Configurations

### Custom Position Configuration

```tsx
class SpiralPositionConfig extends ParticlePositionConfig {
  constructor(
    private radius: number = 2.0,
    private height: number = 1.0,
    private turns: number = 3.0
  ) {
    super();
  }

  generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
    const t = index / totalCount;
    const angle = t * this.turns * Math.PI * 2;
    const r = t * this.radius;
    const x = Math.cos(angle) * r;
    const y = t * this.height - this.height / 2;
    const z = Math.sin(angle) * r;
    return [x, y, z, 0.0];
  }
}
```

### Custom Behavior

```tsx
class FireBehavior extends ParticleBehavior {
  getName(): string {
    return 'Fire';
  }

  getPositionShader(): string {
    return /*glsl*/ `
      uniform float time;
      uniform float delta;
      uniform sampler2D positionTex;
      uniform sampler2D velocityTex;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        vec4 pos = texture2D(positionTex, uv);
        vec4 vel = texture2D(velocityTex, uv);
        
        pos.xyz += vel.xyz * delta;
        
        // Reset particles that go too high
        if (pos.y > 5.0) {
          pos.y = -5.0;
          pos.x = (uv.x - 0.5) * 2.0;
          pos.z = (uv.y - 0.5) * 2.0;
        }
        
        pos.w = mod(pos.w + delta, 1.0);
        
        gl_FragColor = pos;
      }
    `;
  }

  getVelocityShader(): string {
    return /*glsl*/ `
      uniform float time;
      uniform float delta;
      uniform sampler2D positionTex;
      uniform sampler2D velocityTex;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        vec4 vel = texture2D(velocityTex, uv);
        vec4 pos = texture2D(positionTex, uv);
        
        // Fire-like upward motion with turbulence
        vel.y += 0.1 * delta;
        
        // Add turbulence
        float noise1 = sin(pos.x * 0.1 + time) * 0.05;
        float noise2 = cos(pos.z * 0.1 + time * 0.7) * 0.05;
        vel.x += noise1;
        vel.z += noise2;
        
        // Damping
        vel.xyz *= 0.98;
        
        gl_FragColor = vel;
      }
    `;
  }
}
```

## Shader Utilities

### Using ShaderBuilder

```tsx
import { ShaderBuilder, ShaderTemplates } from './particle-system';

const customShader = new ShaderBuilder()
  .setPositionShader(ShaderTemplates.gravity.position)
  .setVelocityShader(ShaderTemplates.gravity.velocity)
  .addUniform('gravity', -0.2)
  .addUniform('damping', 0.99)
  .build();
```

### Using Shader Templates

```tsx
import { ShaderTemplates, ShaderUtils } from './particle-system';

// Use built-in template with customizations
const customGravityShader = ShaderUtils.createCustomShader(
  ShaderTemplates.gravity.velocity,
  { gravity: -0.2, damping: 0.99 }
);
```

## Examples

### Basic Usage

```tsx
import { BasicExamples } from './examples/BasicExamples';

function App() {
  return <BasicExamples />;
}
```

### Custom Configurations

```tsx
import { CustomExamples } from './examples/CustomExamples';

function App() {
  return <CustomExamples />;
}
```

### Advanced Features

```tsx
import { AdvancedExamples } from './examples/AdvancedExamples';

function App() {
  return <AdvancedExamples />;
}
```

## API Reference

### ParticleSystem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | `number` | `1024` | Number of particles |
| `config` | `ParticleSystemConfig` | `undefined` | Initial data configuration |
| `behavior` | `ParticleBehavior` | `DefaultBehavior` | Particle behavior |
| `positionShader` | `string` | `undefined` | Custom position shader (legacy) |
| `velocityShader` | `string` | `undefined` | Custom velocity shader (legacy) |

### ParticleSystemConfig Interface

```tsx
interface ParticleSystemConfig {
  position?: ParticlePositionConfig;
  velocity?: ParticleVelocityConfig;
  color?: ParticleColorConfig;
  size?: ParticleSizeConfig;
  age?: ParticleAgeConfig;
}
```

### Base Classes

#### ParticlePositionConfig
```tsx
abstract class ParticlePositionConfig {
  abstract generatePosition(index: number, totalCount: number, size: number): [number, number, number, number];
}
```

#### ParticleVelocityConfig
```tsx
abstract class ParticleVelocityConfig {
  abstract generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number];
}
```

#### ParticleColorConfig
```tsx
abstract class ParticleColorConfig {
  abstract generateColor(index: number, totalCount: number): [number, number, number];
}
```

#### ParticleSizeConfig
```tsx
abstract class ParticleSizeConfig {
  abstract generateSize(index: number, totalCount: number): number;
}
```

#### ParticleBehavior
```tsx
abstract class ParticleBehavior {
  abstract getPositionShader(): string;
  abstract getVelocityShader(): string;
  abstract getName(): string;
}
```

## Performance Considerations

- **Particle Count**: Higher particle counts require more GPU memory and processing power
- **Shader Complexity**: Complex shaders can impact performance
- **Update Frequency**: The system updates at 60fps by default
- **Memory Usage**: Each particle uses 4 floats for position and 4 floats for velocity

## Browser Support

- WebGL 2.0 support required
- Modern browsers (Chrome 56+, Firefox 51+, Safari 15+)
- Mobile browsers with WebGL support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your custom configurations or behaviors
4. Write tests and documentation
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
