# Particle System Examples

This directory contains various examples demonstrating different features of the particle system.

## Examples Overview

### BasicExamples.tsx
Simple examples showing basic particle configurations and behaviors:
- Grid positioned particles with gravity
- Random positioned particles with swirling motion
- Sphere particles with radial velocities
- Attractor behavior

### AdvancedExamples.tsx
Advanced examples with dynamic behaviors:
- Interactive particles that follow mouse position
- Morphing behavior that changes over time
- Custom color configurations

### CustomExamples.tsx
Examples using custom configuration classes:
- Spiral position configurations
- Wave velocity configurations
- Rainbow color configurations
- Custom shader behaviors

### CustomUniformExamples.tsx
Examples demonstrating custom uniform usage:
- How to define custom uniforms in behaviors
- Dynamic uniform updates using useFrame
- Multiple custom uniforms working together

## Custom Uniforms Usage

Custom uniforms allow you to pass dynamic values to your shaders. Here's how to use them:

### 1. Define Custom Uniforms in Your Behavior

```typescript
class MyCustomBehavior extends ParticleBehavior {
    constructor(private myValue: number = 1.0) {
        super();
    }

    // Override this method to provide custom uniforms
    getVelocityUniforms(): Record<string, any> {
        return {
            myValue: { value: this.myValue },
            anotherUniform: { value: 2.0 }
        };
    }

    getVelocityShader(): string {
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform float myValue;        // Your custom uniform
            uniform float anotherUniform; // Another custom uniform
            
            void main() {
                // Use your custom uniforms in the shader
                // ... shader code ...
            }
        `;
    }
}
```

### 2. Update Uniforms Dynamically

```typescript
const behaviorRef = useRef<MyCustomBehavior>(new MyCustomBehavior());

useFrame((state) => {
    if (behaviorRef.current) {
        // Update uniform values dynamically
        behaviorRef.current.getVelocityUniforms().myValue.value = Math.sin(state.clock.elapsedTime);
    }
});
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
