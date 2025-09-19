// Shader utilities and built-in shaders
export interface ShaderUniforms {
    [key: string]: any;
}

export class ShaderBuilder {
    private uniforms: ShaderUniforms = {};
    private positionShader: string = '';
    private velocityShader: string = '';

    constructor() {
        this.setDefaultShaders();
    }

    private setDefaultShaders(): void {
        this.positionShader = /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform sampler2D positionTex;
            uniform sampler2D velocityTex;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                pos.xyz += vel.xyz * delta;
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `;

        this.velocityShader = /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform sampler2D positionTex;
            uniform sampler2D velocityTex;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                
                // Simple damping
                vel.xyz *= 0.99;
                
                gl_FragColor = vel;
            }
        `;
    }

    setPositionShader(shader: string): ShaderBuilder {
        this.positionShader = shader;
        return this;
    }

    setVelocityShader(shader: string): ShaderBuilder {
        this.velocityShader = shader;
        return this;
    }

    addUniform(name: string, value: any): ShaderBuilder {
        this.uniforms[name] = value;
        return this;
    }

    build(): { positionShader: string; velocityShader: string; uniforms: ShaderUniforms } {
        return {
            positionShader: this.positionShader,
            velocityShader: this.velocityShader,
            uniforms: this.uniforms
        };
    }
}

// Built-in shader templates
export const ShaderTemplates = {
    // Basic movement with gravity
    gravity: {
        position: /*glsl*/ `
            uniform float time;
            uniform float delta;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                pos.xyz += vel.xyz * delta;
                
                // Boundary conditions
                if (pos.x > 10.0) { pos.x = 10.0; vel.x *= -0.8; }
                if (pos.x < -10.0) { pos.x = -10.0; vel.x *= -0.8; }
                if (pos.y > 10.0) { pos.y = 10.0; vel.y *= -0.8; }
                if (pos.y < -10.0) { pos.y = -10.0; vel.y *= -0.8; }
                if (pos.z > 10.0) { pos.z = 10.0; vel.z *= -0.8; }
                if (pos.z < -10.0) { pos.z = -10.0; vel.z *= -0.8; }
                
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `,
        velocity: /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform float gravity;
            uniform float damping;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Apply gravity
                vel.y += gravity * delta;
                
                // Apply damping
                vel.xyz *= damping;
                
                gl_FragColor = vel;
            }
        `
    },

    // Swirling motion
    swirl: {
        position: /*glsl*/ `
            uniform float time;
            uniform float delta;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                pos.xyz += vel.xyz * delta;
                
                // Wrap around boundaries
                if (pos.x > 10.0) pos.x = -10.0;
                if (pos.x < -10.0) pos.x = 10.0;
                if (pos.y > 10.0) pos.y = -10.0;
                if (pos.y < -10.0) pos.y = 10.0;
                if (pos.z > 10.0) pos.z = -10.0;
                if (pos.z < -10.0) pos.z = 10.0;
                
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `,
        velocity: /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform float speed;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Create swirling motion
                float dist = length(pos.xy);
                float angle = atan(pos.y, pos.x) + time * speed;
                
                vel.x = cos(angle) * 0.1;
                vel.y = sin(angle) * 0.1;
                vel.z = sin(dist * 0.1 + time) * 0.05;
                
                // Add some damping
                vel.xyz *= 0.98;
                
                gl_FragColor = vel;
            }
        `
    },

    // Attractor behavior
    attractor: {
        position: /*glsl*/ `
            uniform float time;
            uniform float delta;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                pos.xyz += vel.xyz * delta;
                
                // Wrap around boundaries
                if (pos.x > 10.0) pos.x = -10.0;
                if (pos.x < -10.0) pos.x = 10.0;
                if (pos.y > 10.0) pos.y = -10.0;
                if (pos.y < -10.0) pos.y = 10.0;
                if (pos.z > 10.0) pos.z = -10.0;
                if (pos.z < -10.0) pos.z = 10.0;
                
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `,
        velocity: /*glsl*/ `
            uniform float time;
            uniform float delta;
            uniform vec3 attractorPosition;
            uniform float strength;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Create attractor force
                vec3 force = attractorPosition - pos.xyz;
                float dist = length(force);
                
                if (dist > 0.1) {
                    force = normalize(force) * strength / (dist * dist);
                }
                
                vel.xyz += force * delta;
                
                // Apply damping
                vel.xyz *= 0.99;
                
                gl_FragColor = vel;
            }
        `
    }
};

// Utility functions for shader manipulation
export class ShaderUtils {
    static injectUniforms(shader: string, uniforms: ShaderUniforms): string {
        let modifiedShader = shader;
        
        Object.entries(uniforms).forEach(([name, value]) => {
            if (typeof value === 'number') {
                modifiedShader = modifiedShader.replace(new RegExp(`\\b${name}\\b`, 'g'), value.toString());
            }
        });
        
        return modifiedShader;
    }

    static addUniformDeclaration(shader: string, name: string, type: string, value: any): string {
        const uniformDeclaration = `uniform ${type} ${name};\n`;
        const mainFunctionIndex = shader.indexOf('void main()');
        
        if (mainFunctionIndex !== -1) {
            return shader.slice(0, mainFunctionIndex) + uniformDeclaration + shader.slice(mainFunctionIndex);
        }
        
        return shader;
    }

    static createCustomShader(template: string, customizations: Record<string, any>): string {
        let shader = template;
        
        Object.entries(customizations).forEach(([key, value]) => {
            shader = shader.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
        });
        
        return shader;
    }
}
