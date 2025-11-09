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

1. **Configuration Module** (`./config/`): Handles initial particle data (position, velocity, color, size)
2. **Behavior Module** (`./behaviors/`): Defines particle movement and interaction using shader composition
3. **Main Component** (`ParticleSystem.tsx`): The main React component that orchestrates everything

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

## Building a Particle System - Workflow

### Step 1: Choose or Create Configurations

Configurations define the **initial state** of particles (where they start, initial velocity, colors, sizes).

**Using Built-in Configs:**
```tsx
import { 
  RandomPositionConfig, 
  ZeroVelocityConfig, 
  GradientColorConfig,
  UniformSizeConfig 
} from './particle-system';

const config = {
  position: new RandomPositionConfig({ x: [-5, 5], y: [-5, 5], z: [-2, 2] }),
  velocity: new ZeroVelocityConfig(),
  color: new GradientColorConfig([1, 0, 0], [0, 1, 0]),
  size: new UniformSizeConfig(1.0)
};
```

**Creating Custom Config:**
```tsx
import { ParticlePositionConfig } from './particle-system';

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

### Step 2: Choose or Create a Behavior

Behaviors define **how particles move** over time using shader composition (much easier than writing full shaders!).

**Using Built-in Behaviors:**
```tsx
import { GravityBehavior, SwirlBehavior } from './particle-system';

const behavior = new GravityBehavior(-0.1, 0.995, 0.05);
// Parameters: gravity, damping, turbulence
```

**Creating Custom Behavior (Modern Way - Recommended):**

```tsx
import { ParticleBehavior } from './particle-system';

class FireBehavior extends ParticleBehavior {
  getName(): string {
    return 'Fire';
  }

  // Override position update logic (optional - only if you need custom position behavior)
  protected getPositionUpdateLogic(): string {
    return /*glsl*/ `
      pos.xyz += vel.xyz * delta;
      
      // Reset particles that go too high
      if (pos.y > 5.0) {
        pos.y = -5.0;
        pos.x = (uv.x - 0.5) * 2.0;
        pos.z = (uv.y - 0.5) * 2.0;
      }
    `;
  }

  // Override velocity update logic (required for custom motion)
  protected getVelocityUpdateLogic(): string {
    return /*glsl*/ `
      // Fire-like upward motion with turbulence
      vel.y += 0.1 * delta;
      
      // Add turbulence
      float noise1 = sin(pos.x * 0.1 + time) * 0.05;
      float noise2 = cos(pos.z * 0.1 + time * 0.7) * 0.05;
      vel.x += noise1;
      vel.z += noise2;
      
      // Damping
      vel.xyz *= 0.98;
    `;
  }
}
```

**Creating Behavior with Custom Uniforms:**

```tsx
import { ParticleBehavior } from './particle-system';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

class WaveBehavior extends ParticleBehavior {
  public uniforms: Record<string, any>;

  constructor(
    private waveSpeed: number = 1.0,
    private waveAmplitude: number = 0.5
  ) {
    super();
    
    // Store uniforms for dynamic updates
    this.uniforms = {
      waveSpeed: { value: this.waveSpeed },
      waveAmplitude: { value: this.waveAmplitude }
    };
  }

  getName(): string {
    return 'Wave';
  }

  // Provide uniforms (automatically declared in shader)
  getVelocityUniforms(): Record<string, any> {
    return this.uniforms;
  }

  // Use uniforms in your logic
  protected getVelocityUpdateLogic(): string {
    return /*glsl*/ `
      // Use custom uniforms - they're automatically declared!
      float wave = sin(pos.x * waveSpeed + time) * waveAmplitude;
      vel.y = wave;
      vel.xyz *= 0.98;
    `;
  }
}

// Usage with dynamic uniform updates
function MyComponent() {
  const behaviorRef = useRef(new WaveBehavior(1.5, 0.8));

  useFrame((state) => {
    // Update uniforms dynamically
    behaviorRef.current.uniforms.waveAmplitude.value = 
      Math.sin(state.clock.elapsedTime) * 0.5 + 0.5;
  });

  return (
    <ParticleSystem 
      count={256} 
      behavior={behaviorRef.current}
    />
  );
}
```

### Step 3: Combine Everything

```tsx
import { ParticleSystem } from './particle-system';
import { useMemo } from 'react';

function MyScene() {
  // Memoize config to prevent recreation
  const config = useMemo(() => ({
    position: new SpiralPositionConfig(2.0, 1.0, 3.0),
    velocity: new ZeroVelocityConfig(),
    color: new GradientColorConfig([1, 0, 0], [0, 1, 0]),
    size: new UniformSizeConfig(1.0)
  }), []);

  // Memoize behavior
  const behavior = useMemo(() => new FireBehavior(), []);

  return (
    <ParticleSystem
      count={256}
      config={config}
      behavior={behavior}
    />
  );
}
```

## Complete Example: Custom Behavior with Dynamic Uniforms

```tsx
import { ParticleBehavior } from './particle-system';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ParticleSystem, RandomPositionConfig, ZeroVelocityConfig, GradientColorConfig, UniformSizeConfig } from './particle-system';

// Custom behavior with dynamic uniforms
class InteractiveBehavior extends ParticleBehavior {
  public uniforms: Record<string, any>;

  constructor() {
    super();
    this.uniforms = {
      mouseX: { value: 0.0 },
      mouseY: { value: 0.0 },
      attractionStrength: { value: 0.1 }
    };
  }

  getName(): string {
    return 'Interactive';
  }

  getVelocityUniforms(): Record<string, any> {
    return this.uniforms;
  }

  protected getVelocityUpdateLogic(): string {
    return /*glsl*/ `
      // Attract particles to mouse position
      vec2 mousePos = vec2(mouseX, mouseY) * 10.0;
      vec2 force = mousePos - pos.xy;
      float dist = length(force);
      
      if (dist > 0.1) {
        force = normalize(force) * attractionStrength / (dist + 0.1);
        vel.xy += force * delta;
      }
      
      vel.xyz *= 0.99;
    `;
  }
}

function InteractiveParticles() {
  const behaviorRef = useRef(new InteractiveBehavior());
  const config = useMemo(() => ({
    position: new RandomPositionConfig({ x: [-5, 5], y: [-5, 5], z: [-2, 2] }),
    velocity: new ZeroVelocityConfig(),
    color: new GradientColorConfig([0, 1, 1], [1, 0, 1]),
    size: new UniformSizeConfig(1.0)
  }), []);

  // Update mouse position from R3F state
  useFrame((state) => {
    const x = (state.mouse.x + 1) / 2;
    const y = (state.mouse.y + 1) / 2;
    behaviorRef.current.uniforms.mouseX.value = x;
    behaviorRef.current.uniforms.mouseY.value = y;
  });

  return (
    <ParticleSystem
      count={256}
      config={config}
      behavior={behaviorRef.current}
    />
  );
}
```

## Examples

### Basic Usage

```tsx
import { BasicExamples } from './examples/BasicExamples';

function App() {
  return <BasicExamples />;
}
```

### Advanced Examples

```tsx
import AdvancedExamples from './examples/AdvancedExamples';

function App() {
  return <AdvancedExamples />;
}
```

### Advanced Features

```tsx
import AdvancedExamples from './examples/AdvancedExamples';

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
  abstract getName(): string;
  
  // Override these methods to customize behavior
  protected getPositionUpdateLogic(): string;  // Returns GLSL code for position updates
  protected getVelocityUpdateLogic(): string; // Returns GLSL code for velocity updates
  
  // Override for custom uniforms
  getPositionUniforms(): Record<string, any>;
  getVelocityUniforms(): Record<string, any>;
  
  // Override for custom boundaries
  protected getBoundaryConfig(): BoundaryConfig;
  
  // These are automatically generated (don't override)
  getPositionShader(): string;  // Complete position shader
  getVelocityShader(): string; // Complete velocity shader
}
```

**Key Methods:**
- `getVelocityUpdateLogic()`: Override to provide custom velocity update logic (GLSL code snippet)
- `getPositionUpdateLogic()`: Override to provide custom position update logic (GLSL code snippet)
- `getVelocityUniforms()`: Return uniforms object for velocity shader
- `getPositionUniforms()`: Return uniforms object for position shader
- `getBoundaryConfig()`: Define boundary behavior (wrap, bounce, none)

**Available Variables in GLSL:**
- `pos` - Current particle position (vec4: x, y, z, age)
- `vel` - Current particle velocity (vec4)
- `delta` - Time delta since last frame (float)
- `time` - Total elapsed time (float)
- `uv` - Texture coordinates (vec2)

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
