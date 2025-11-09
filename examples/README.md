# Particle System Examples

This directory contains examples demonstrating different features of the particle system.

## Examples Overview

### BasicExamples.tsx
Simple examples showing built-in behaviors and configurations:
- **Gravity behavior** - Particles with gravity and bouncing boundaries
- **Swirl behavior** - Swirling motion with random positioning

### AdvancedExamples.tsx
Advanced examples demonstrating custom features:
- **Interactive behavior** - Particles that follow mouse position (dynamic uniforms)
- **Custom config** - Spiral positioning example
- **Custom behavior with uniforms** - Dynamic uniform updates
- **Fire behavior** - Custom position logic (particle reset)
- **Morphing behavior** - Behavior that changes over time

## Custom Uniforms Usage

Custom uniforms allow you to pass dynamic values to your shaders. Here's how to use them:

### 1. Define Custom Uniforms in Your Behavior (Using New Composition System)

```typescript
class MyCustomBehavior extends ParticleBehavior {
    public uniforms: Record<string, any>;

    constructor(private myValue: number = 1.0) {
        super();
        
        // Store uniforms for dynamic updates
        this.uniforms = {
            myValue: { value: this.myValue },
            anotherUniform: { value: 2.0 }
        };
    }

    // Return uniforms (automatically declared in shader)
    getVelocityUniforms(): Record<string, any> {
        return this.uniforms;
    }

    // Override velocity logic (uniforms are auto-declared)
    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Use your custom uniforms - they're automatically declared!
            vel.x += myValue * delta;
            vel.y += anotherUniform * 0.1;
            
            // Damping
            vel.xyz *= 0.99;
        `;
    }
}
```

### 2. Update Uniforms Dynamically

```typescript
const behaviorRef = useRef<MyCustomBehavior>(new MyCustomBehavior());

useFrame((state) => {
    if (behaviorRef.current) {
        // Update uniform values directly via the uniforms object
        behaviorRef.current.uniforms.myValue.value = Math.sin(state.clock.elapsedTime);
        behaviorRef.current.uniforms.anotherUniform.value = Math.cos(state.clock.elapsedTime);
    }
});

<ParticleSystem behavior={behaviorRef.current} />
```

### 3. Available Uniform Methods

- `getCustomUniforms()` - General custom uniforms
- `getPositionUniforms()` - Uniforms for position shader
- `getVelocityUniforms()` - Uniforms for velocity shader

### 4. Uniform Types Supported

- `float` - Single floating point values
- `vec2` - 2D vectors
- `vec3` - 3D vectors
- `vec4` - 4D vectors
- `sampler2D` - Texture samplers

## Performance Tips

- Use `useMemo` for static config objects
- Use `useRef` for behavior objects that need dynamic updates
- Minimize uniform updates in useFrame for better performance
- Prefer simple uniform types (float, vec2) over complex ones when possible
