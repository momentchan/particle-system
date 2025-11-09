// Boundary handling types
export type BoundaryType = 'wrap' | 'bounce' | 'none';
export interface BoundaryConfig {
    type: BoundaryType;
    min: [number, number, number];
    max: [number, number, number];
    bounceFactor?: number; // Only used for bounce type
}

// Base behavior classes for particle system behaviors
export abstract class ParticleBehavior {
    abstract getName(): string;
    
    // Boundary configuration - override to customize
    protected getBoundaryConfig(): BoundaryConfig {
        return {
            type: 'wrap',
            min: [-10.0, -10.0, -10.0],
            max: [10.0, 10.0, 10.0],
            bounceFactor: 0.8
        };
    }
    
    // Override this to provide custom position update logic
    // Default: pos.xyz += vel.xyz * delta;
    protected getPositionUpdateLogic(): string {
        return 'pos.xyz += vel.xyz * delta;';
    }
    
    // Override this to provide custom velocity update logic
    // Default: vel.xyz *= 0.99; (damping)
    protected getVelocityUpdateLogic(): string {
        return 'vel.xyz *= 0.99;';
    }
    
    // Override this method to provide custom uniforms for position shader
    getPositionUniforms(): Record<string, any> {
        return {};
    }
    
    // Override this method to provide custom uniforms for velocity shader
    getVelocityUniforms(): Record<string, any> {
        return {};
    }
    
    // Generate uniform declarations from uniforms object
    private generateUniformDeclarations(uniforms: Record<string, any>): string {
        const declarations: string[] = [];
        
        for (const [name, uniform] of Object.entries(uniforms)) {
            const value = uniform.value;
            
            if (typeof value === 'number') {
                declarations.push(`uniform float ${name};`);
            } else if (value && typeof value === 'object') {
                // Check for THREE.Vector3
                if (value.isVector3 || (typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number')) {
                    declarations.push(`uniform vec3 ${name};`);
                }
                // Check for THREE.Vector2
                else if (value.isVector2 || (typeof value.x === 'number' && typeof value.y === 'number' && !('z' in value))) {
                    declarations.push(`uniform vec2 ${name};`);
                }
                // Check for THREE.Color
                else if (value.isColor || (typeof value.r === 'number' && typeof value.g === 'number' && typeof value.b === 'number')) {
                    declarations.push(`uniform vec3 ${name};`);
                }
                // Check for arrays
                else if (Array.isArray(value)) {
                    if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
                        declarations.push(`uniform vec2 ${name};`);
                    } else if (value.length === 3 && typeof value[0] === 'number' && typeof value[1] === 'number' && typeof value[2] === 'number') {
                        declarations.push(`uniform vec3 ${name};`);
                    } else if (value.length === 4 && typeof value[0] === 'number' && typeof value[1] === 'number' && typeof value[2] === 'number' && typeof value[3] === 'number') {
                        declarations.push(`uniform vec4 ${name};`);
                    }
                }
            }
        }
        
        return declarations.join('\n');
    }
    
    // Generate boundary shader code
    private getBoundaryShader(): string {
        const boundary = this.getBoundaryConfig();
        
        if (boundary.type === 'none') {
            return '';
        }
        
        // Format numbers as floats for GLSL
        const formatFloat = (n: number): string => {
            return n.toFixed(1);
        };
        
        const minX = formatFloat(boundary.min[0]);
        const minY = formatFloat(boundary.min[1]);
        const minZ = formatFloat(boundary.min[2]);
        const maxX = formatFloat(boundary.max[0]);
        const maxY = formatFloat(boundary.max[1]);
        const maxZ = formatFloat(boundary.max[2]);
        
        if (boundary.type === 'wrap') {
            return /*glsl*/ `
                // Wrap around boundaries
                if (pos.x > ${maxX}) pos.x = ${minX};
                if (pos.x < ${minX}) pos.x = ${maxX};
                if (pos.y > ${maxY}) pos.y = ${minY};
                if (pos.y < ${minY}) pos.y = ${maxY};
                if (pos.z > ${maxZ}) pos.z = ${minZ};
                if (pos.z < ${minZ}) pos.z = ${maxZ};
            `;
        }
        
        // Bounce type
        const bounceFactor = formatFloat(boundary.bounceFactor || 0.8);
        return /*glsl*/ `
            // Boundary conditions - bounce
            if (pos.x > ${maxX}) { pos.x = ${maxX}; vel.x *= -${bounceFactor}; }
            if (pos.x < ${minX}) { pos.x = ${minX}; vel.x *= -${bounceFactor}; }
            if (pos.y > ${maxY}) { pos.y = ${maxY}; vel.y *= -${bounceFactor}; }
            if (pos.y < ${minY}) { pos.y = ${minY}; vel.y *= -${bounceFactor}; }
            if (pos.z > ${maxZ}) { pos.z = ${maxZ}; vel.z *= -${bounceFactor}; }
            if (pos.z < ${minZ}) { pos.z = ${minZ}; vel.z *= -${bounceFactor}; }
        `;
    }
    
    // Base position shader template with composition
    getPositionShader(): string {
        const positionUniforms = this.getPositionUniforms();
        const uniformDeclarations = this.generateUniformDeclarations(positionUniforms);
        
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
${uniformDeclarations ? '            ' + uniformDeclarations.split('\n').join('\n            ') + '\n' : ''}
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                // Position update logic (injected by behavior)
                ${this.getPositionUpdateLogic()}
                
                // Boundary handling (injected by behavior)
                ${this.getBoundaryShader()}
                
                // Update age
                pos.w = mod(pos.w + delta, 1.0);
                
                gl_FragColor = pos;
            }
        `;
    }
    
    // Base velocity shader template with composition
    getVelocityShader(): string {
        const velocityUniforms = this.getVelocityUniforms();
        const uniformDeclarations = this.generateUniformDeclarations(velocityUniforms);
        
        return /*glsl*/ `
            uniform float time;
            uniform float delta;
${uniformDeclarations ? '            ' + uniformDeclarations.split('\n').join('\n            ') + '\n' : ''}
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 vel = texture2D(velocityTex, uv);
                vec4 pos = texture2D(positionTex, uv);
                
                // Velocity update logic (injected by behavior)
                ${this.getVelocityUpdateLogic()}
                
                gl_FragColor = vel;
            }
        `;
    }
}

