# Particle System Library

A comprehensive, modular particle system library for React Three Fiber that allows easy customization of both initial data and behaviors through a class-based architecture.

## Features

- **Modular Architecture**: Well-organized modules for configurations and behaviors with custom hooks
- **Class-Based Customization**: Extend base classes to create custom particle configurations and behaviors
- **Built-in Patterns**: Pre-built configurations and behaviors for common particle patterns
- **Shader Composition**: Easy custom shader logic without writing full shaders
- **TypeScript Support**: Full type safety and IntelliSense support
- **Performance Optimized**: GPU-based particle simulation using WebGL
- **Easy Integration**: Simple API that works seamlessly with React Three Fiber
- **Custom Hooks**: Reusable hooks for GPGPU, geometry, and material management
- **Flexible Rendering**: Support for both point-based and instanced mesh rendering

## Quick Start

```tsx
import { 
  ParticleSystem, 
  SpherePositionConfig, 
  RadialVelocityConfig, 
  GradientColorConfig,
  UniformSizeConfig,
  GravityBehavior
} from './particle-system';

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

**Creating Custom Behavior:**

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

You can provide uniforms in two ways:

**Option 1: Auto-detection (easiest)** - Types are automatically detected from values:
```tsx
import { ParticleBehavior } from './particle-system';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

class WaveBehavior extends ParticleBehavior {
  public uniforms: Record<string, any>;

  constructor(
    private waveSpeed: number = 1.0,
    private waveAmplitude: number = 0.5
  ) {
    super();
    
    // Types are auto-detected: number → float, Vector3 → vec3, Texture → sampler2D
    this.uniforms = {
      waveSpeed: { value: this.waveSpeed },           // auto: float
      waveAmplitude: { value: this.waveAmplitude },  // auto: float
      position: { value: new THREE.Vector3(0, 0, 0) } // auto: vec3
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

**Using Textures as Uniforms:**

```tsx
import { ParticleBehavior } from './particle-system';
import * as THREE from 'three';
import { useLoader } from '@react-three/drei';
import { useMemo } from 'react';

class TextureBasedBehavior extends ParticleBehavior {
  public uniforms: Record<string, any>;

  constructor(texture: THREE.Texture) {
    super();
    this.uniforms = {
      noiseTexture: { value: texture },
      noiseStrength: { value: 0.5 }
    };
  }

  getName(): string {
    return 'Texture Based';
  }

  getVelocityUniforms(): Record<string, any> {
    return this.uniforms;
  }

  protected getVelocityUpdateLogic(): string {
    return /*glsl*/ `
      // Sample noise texture
      vec4 noise = texture2D(noiseTexture, pos.xy * 0.1 + time * 0.1);
      vec3 noiseForce = (noise.xyz - 0.5) * noiseStrength;
      
      vel.xyz += noiseForce * delta;
      vel.xyz *= 0.98;
    `;
  }
}

// Usage
function MyParticles() {
  const texture = useLoader(THREE.TextureLoader, '/noise.png');
  const behavior = useMemo(() => new TextureBasedBehavior(texture), [texture]);
  
  return <ParticleSystem behavior={behavior} count={256} />;
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

### Step 4: Advanced Features

#### Using Custom Material

You can provide your own `THREE.ShaderMaterial` for complete control over rendering:

```tsx
import { ParticleSystem, ParticleSystemRef } from './particle-system';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function CustomMaterialExample() {
  const systemRef = useRef<ParticleSystemRef>(null);

  // Create custom material with glow effect
  const customMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        positionTex: { value: null },
        velocityTex: { value: null },
        time: { value: 0.0 },
        glowIntensity: { value: 2.0 }
      },
      vertexShader: /*glsl*/ `
        uniform sampler2D positionTex;
        uniform sampler2D velocityTex;
        uniform float time;
        
        attribute float size;
        
        varying vec3 vColor;
        varying vec3 vVelocity;
        
        void main() {
          vec4 pos = texture2D(positionTex, uv);
          vec4 vel = texture2D(velocityTex, uv);
          
          vColor = color;
          vVelocity = vel.xyz;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + length(vel.xyz));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /*glsl*/ `
        uniform float time;
        uniform float glowIntensity;
        
        varying vec3 vColor;
        varying vec3 vVelocity;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          
          // Add glow effect based on velocity
          float glow = length(vVelocity) * glowIntensity;
          vec3 finalColor = vColor + vec3(glow);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });
  }, []);

  // Update material uniforms with particle textures
  useFrame((state) => {
    if (systemRef.current && customMaterial) {
      const positionTex = systemRef.current.getParticleTexture();
      const velocityTex = systemRef.current.getVelocityTexture();
      
      if (positionTex) customMaterial.uniforms.positionTex.value = positionTex;
      if (velocityTex) customMaterial.uniforms.velocityTex.value = velocityTex;
      customMaterial.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <ParticleSystem
      ref={systemRef}
      count={512}
      config={myConfig}
      behavior={myBehavior}
      customMaterial={customMaterial}
    />
  );
}
```

**Important**: When using `customMaterial`, you must:
- Declare `positionTex` and `velocityTex` as `sampler2D` uniforms
- Sample these textures in your vertex shader using `texture2D(positionTex, uv)`
- Update these uniforms manually using the `ParticleSystemRef` (see example above)
- The `size`, `opacity`, and `transparent` props are ignored when using `customMaterial`

#### Using Instanced Mesh

Render particles as instanced meshes instead of points for more complex shapes:

```tsx
import { ParticleSystem } from './particle-system';
import { useMemo } from 'react';
import * as THREE from 'three';

function InstancedMeshExample() {
  // Create geometry for each instance
  const instanceGeometry = useMemo(() => {
    return new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // Or use any other geometry:
    // return new THREE.SphereGeometry(0.05, 8, 8);
    // return new THREE.TorusGeometry(0.05, 0.02, 8, 16);
  }, []);

  const config = useMemo(() => ({
    position: new RandomPositionConfig({ x: [-3, 3], y: [-3, 3], z: [-2, 2] }),
    velocity: new ZeroVelocityConfig(),
    color: new GradientColorConfig([0.5, 0.8, 1], [1, 0.5, 0.8]),
    size: new UniformSizeConfig(1)
  }), []);

  return (
    <ParticleSystem
      count={256}
      config={config}
      behavior={new SwirlBehavior(0.5, 0.8)}
      meshType="instanced"
      instanceGeometry={instanceGeometry}
    />
  );
}
```

**Key Points**:
- Set `meshType="instanced"` to enable instanced rendering
- Provide `instanceGeometry` with the shape you want for each particle
- Positions are automatically applied per-instance via the shader
- The instanced shader uses `gl_InstanceID` to sample particle data from textures

### Complete Example: Interactive Particles

```tsx
import { ParticleBehavior, ParticleSystem, RandomPositionConfig, ZeroVelocityConfig, GradientColorConfig, UniformSizeConfig } from './particle-system';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

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

## Built-in Components

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

- `DefaultBehavior`: Simple movement with damping
- `GravityBehavior`: Gravity simulation with bouncing boundaries
- `SwirlBehavior`: Swirling motion around center
- `AttractorBehavior`: Particles attracted to a specific point
- `WaveBehavior`: Wave-like motion
- `ExplosionBehavior`: Explosion-like outward force
- `MagneticFieldBehavior`: Magnetic field simulation
- `SpringBehavior`: Spring physics simulation
- `NoiseFieldBehavior`: Noise-based field motion

## Examples

See the `examples/` directory for complete working examples:
- `BasicExamples.tsx`: Simple examples with built-in behaviors
- `AdvancedExamples.tsx`: Advanced examples with custom behaviors and dynamic uniforms

```tsx
import BasicExamples from './examples/BasicExamples';
import AdvancedExamples from './examples/AdvancedExamples';

function App() {
  return (
    <>
      <BasicExamples />
      {/* or */}
      <AdvancedExamples />
    </>
  );
}
```

## API Reference

### ParticleSystem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | `number` | `1024` | Number of particles |
| `config` | `ParticleSystemConfig` | `undefined` | Initial data configuration |
| `behavior` | `ParticleBehavior` | `DefaultBehavior` | Particle behavior |
| `customMaterial` | `THREE.Material \| null` | `undefined` | Custom material for rendering (overrides default) |
| `positionShader` | `string` | `undefined` | Custom position shader (overrides behavior shader) |
| `velocityShader` | `string` | `undefined` | Custom velocity shader (overrides behavior shader) |
| `update` | `boolean` | `true` | Whether to update particles each frame |
| `meshType` | `'points' \| 'instanced'` | `'points'` | Rendering mode: points or instanced mesh |
| `instanceGeometry` | `THREE.BufferGeometry \| null` | `undefined` | Geometry for instanced mesh (required if `meshType='instanced'`) |
| `size` | `number` | `0.1` | Particle size multiplier (only used if not using `customMaterial`) |
| `opacity` | `number` | `0.8` | Particle opacity (only used if not using `customMaterial`) |
| `transparent` | `boolean` | `true` | Whether material is transparent (only used if not using `customMaterial`) |

**Note**: The `size`, `opacity`, and `transparent` props are only used when not providing a `customMaterial`. If you use `customMaterial`, you should manage these properties yourself.

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
  
  // Override for custom boundaries (optional - defaults to 'none')
  protected getBoundaryConfig(): BoundaryConfig;
  
  // These are automatically generated (don't override)
  getPositionShader(): string;  // Complete position shader
  getVelocityShader(): string;   // Complete velocity shader
}
```

**Key Methods:**
- `getVelocityUpdateLogic()`: Override to provide custom velocity update logic (GLSL code snippet)
- `getPositionUpdateLogic()`: Override to provide custom position update logic (GLSL code snippet)
- `getVelocityUniforms()`: Return uniforms object for velocity shader
- `getPositionUniforms()`: Return uniforms object for position shader
- `getBoundaryConfig()`: Define boundary behavior (optional - defaults to `none`)

**Boundary Configuration:**
Boundaries control what happens when particles reach the edges of a 3D box. Useful for keeping particles visible or creating specific effects:

```tsx
protected getBoundaryConfig(): BoundaryConfig {
  return {
    type: 'bounce',  // 'wrap' | 'bounce' | 'none' (default: 'none')
    min: [-10.0, -10.0, -10.0],
    max: [10.0, 10.0, 10.0],
    bounceFactor: 0.8  // Only used for 'bounce' type
  };
}
```

- **`wrap`**: Particles teleport to opposite side (like Pac-Man)
- **`bounce`**: Particles bounce off boundaries with velocity reversal (useful for gravity/ground effects)
- **`none`**: No boundary handling (default - particles move freely)

**Available Variables in GLSL:**
- `pos` - Current particle position (vec4: x, y, z, age)
- `vel` - Current particle velocity (vec4)
- `delta` - Time delta since last frame (float)
- `time` - Total elapsed time (float)
- `uv` - Texture coordinates (vec2)

**Supported Uniform Types:**
- `number` → `float`
- `THREE.Vector2` or `[number, number]` → `vec2`
- `THREE.Vector3` or `[number, number, number]` → `vec3`
- `THREE.Color` or `{r, g, b}` → `vec3`
- `THREE.Texture` (any texture type) → `sampler2D`

## Custom Hooks

The library provides custom hooks for advanced use cases:

### `useParticleGPGPU`

Manages GPGPU computation for particle simulation.

```tsx
import { useParticleGPGPU } from './particle-system/hooks';

const {
  gpgpu,
  timeRef,
  updateUniforms,
  reset,
  getParticleTexture,
  getVelocityTexture
} = useParticleGPGPU({
  count: 256,
  config: myConfig,
  behavior: myBehavior,
  positionShader: customPositionShader,
  velocityShader: customVelocityShader
});
```

### `useParticleGeometry`

Manages geometry creation for points and instanced meshes.

```tsx
import { useParticleGeometry } from './particle-system/hooks';

const { pointsGeometry, instancedGeo } = useParticleGeometry({
  count: 256,
  config: myConfig,
  meshType: 'points',
  instanceGeometry: customGeometry
});
```

### `useParticleMaterial`

Creates and manages the default shader material.

```tsx
import { useParticleMaterial } from './particle-system/hooks';

const material = useParticleMaterial({
  meshType: 'points',
  count: 256,
  size: 0.1,
  opacity: 0.8,
  transparent: true
});
```

## Performance Considerations

- **Particle Count**: Higher particle counts require more GPU memory and processing power
- **Shader Complexity**: Complex shaders can impact performance
- **Update Frequency**: The system updates at 60fps by default
- **Memory Usage**: Each particle uses 4 floats for position and 4 floats for velocity
- **Hook Optimization**: Custom hooks are memoized to prevent unnecessary recalculations

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
