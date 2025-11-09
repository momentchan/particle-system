import * as THREE from 'three';

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

// Built-in behaviors
export class GravityBehavior extends ParticleBehavior {
    constructor(
        private gravity: number = -0.1,
        private damping: number = 0.995,
        private turbulence: number = 0.05
    ) {
        super();
    }

    getName(): string {
        return 'Gravity';
    }

    protected getBoundaryConfig(): BoundaryConfig {
        return {
            type: 'bounce',
            min: [-10.0, -10.0, -10.0],
            max: [10.0, 10.0, 10.0],
            bounceFactor: 0.8
        };
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            gravity: { value: this.gravity },
            damping: { value: this.damping },
            turbulence: { value: this.turbulence }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Apply gravity
            vel.y += gravity * delta;
            
            // Apply damping
            vel.xyz *= damping;
            
            // Add some turbulence
            float noise = sin(pos.x * 0.1 + time) * cos(pos.z * 0.1 + time * 0.7) * turbulence;
            vel.x += noise;
            vel.z += noise;
        `;
    }
}

export class SwirlBehavior extends ParticleBehavior {
    constructor(
        private speed: number = 0.5,
        private radius: number = 1.0
    ) {
        super();
    }

    getName(): string {
        return 'Swirl';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            speed: { value: this.speed },
            radius: { value: this.radius }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Create swirling motion
            float dist = length(pos.xy);
            float angle = atan(pos.y, pos.x) + time * speed;
            
            vel.x = cos(angle) * radius;
            vel.y = sin(angle) * radius;
            vel.z = sin(dist * 0.1 + time) * 0.05;
            
            // Add some damping
            vel.xyz *= 0.98;
        `;
    }
}

export class AttractorBehavior extends ParticleBehavior {
    constructor(
        private attractorPosition: [number, number, number] = [0, 0, 0],
        private strength: number = 0.1,
        private damping: number = 0.99
    ) {
        super();
    }

    getName(): string {
        return 'Attractor';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            attractorPosition: { value: new THREE.Vector3(...this.attractorPosition) },
            strength: { value: this.strength },
            damping: { value: this.damping }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Create attractor at specified position
            vec3 force = attractorPosition - pos.xyz;
            float dist = length(force);
            
            if (dist > 0.1) {
                force = normalize(force) * strength / (dist * dist);
            }
            
            vel.xyz += force * delta;
            
            // Apply damping
            vel.xyz *= damping;
        `;
    }
}

export class WaveBehavior extends ParticleBehavior {
    constructor(
        private amplitude: number = 0.5,
        private frequency: number = 2.0,
        private speed: number = 1.0
    ) {
        super();
    }

    getName(): string {
        return 'Wave';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            amplitude: { value: this.amplitude },
            frequency: { value: this.frequency },
            speed: { value: this.speed }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Create wave motion
            float wave = sin(pos.x * frequency + time * speed) * amplitude;
            vel.y = wave;
            
            // Add some damping
            vel.xyz *= 0.99;
        `;
    }
}

export class ExplosionBehavior extends ParticleBehavior {
    constructor(
        private explosionCenter: [number, number, number] = [0, 0, 0],
        private force: number = 1.0,
        private damping: number = 0.98
    ) {
        super();
    }

    getName(): string {
        return 'Explosion';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            explosionCenter: { value: new THREE.Vector3(...this.explosionCenter) },
            force: { value: this.force },
            damping: { value: this.damping }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Create explosion force from center
            vec3 direction = pos.xyz - explosionCenter;
            float dist = length(direction);
            
            if (dist > 0.01) {
                direction = normalize(direction);
                vel.xyz += direction * force * delta / (dist + 0.1);
            }
            
            // Apply damping
            vel.xyz *= damping;
        `;
    }
}

// Advanced behaviors with custom uniforms
export class MagneticFieldBehavior extends ParticleBehavior {
    constructor(
        private fieldStrength: number = 0.5,
        private fieldDirection: [number, number, number] = [0, 1, 0],
        private turbulence: number = 0.1,
        private damping: number = 0.98
    ) {
        super();
    }

    getName(): string {
        return 'Magnetic Field';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            fieldStrength: { value: this.fieldStrength },
            fieldDirection: { value: new THREE.Vector3(...this.fieldDirection) },
            turbulence: { value: this.turbulence },
            damping: { value: this.damping }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Apply magnetic field force (Lorentz force)
            vec3 crossProduct = cross(vel.xyz, fieldDirection);
            vel.xyz += crossProduct * fieldStrength * delta;
            
            // Add turbulence
            float noise1 = sin(pos.x * 0.1 + time) * cos(pos.z * 0.1 + time * 0.7);
            float noise2 = sin(pos.y * 0.15 + time * 1.3) * cos(pos.x * 0.12 + time * 0.5);
            vel.xyz += vec3(noise1, noise2, noise1 * noise2) * turbulence * delta;
            
            // Apply damping
            vel.xyz *= damping;
        `;
    }
}

export class SpringBehavior extends ParticleBehavior {
    constructor(
        private springConstant: number = 0.5,
        private restLength: number = 1.0,
        private damping: number = 0.9,
        private center: [number, number, number] = [0, 0, 0]
    ) {
        super();
    }

    getName(): string {
        return 'Spring';
    }

    protected getBoundaryConfig(): BoundaryConfig {
        return {
            type: 'none',
            min: [0, 0, 0],
            max: [0, 0, 0]
        };
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            springConstant: { value: this.springConstant },
            restLength: { value: this.restLength },
            damping: { value: this.damping },
            center: { value: new THREE.Vector3(...this.center) }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Calculate spring force
            vec3 displacement = pos.xyz - center;
            float distance = length(displacement);
            
            if (distance > 0.001) {
                vec3 springForce = -normalize(displacement) * springConstant * (distance - restLength);
                vel.xyz += springForce * delta;
            }
            
            // Apply damping
            vel.xyz *= damping;
        `;
    }
}

export class NoiseFieldBehavior extends ParticleBehavior {
    constructor(
        private noiseScale: number = 0.1,
        private noiseStrength: number = 0.5,
        private timeScale: number = 1.0,
        private damping: number = 0.95
    ) {
        super();
    }

    getName(): string {
        return 'Noise Field';
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            noiseScale: { value: this.noiseScale },
            noiseStrength: { value: this.noiseStrength },
            timeScale: { value: this.timeScale },
            damping: { value: this.damping }
        };
    }

    protected getVelocityUpdateLogic(): string {
        return /*glsl*/ `
            // Generate 3D noise field
            float noiseX = sin(pos.x * noiseScale + time * timeScale) * cos(pos.y * noiseScale + time * timeScale * 0.7);
            float noiseY = sin(pos.y * noiseScale + time * timeScale * 1.3) * cos(pos.z * noiseScale + time * timeScale * 0.5);
            float noiseZ = sin(pos.z * noiseScale + time * timeScale * 0.9) * cos(pos.x * noiseScale + time * timeScale * 1.1);
            
            vel.xyz += vec3(noiseX, noiseY, noiseZ) * noiseStrength * delta;
            
            // Apply damping
            vel.xyz *= damping;
        `;
    }
}

// Default behavior (simple movement)
export class DefaultBehavior extends ParticleBehavior {
    getName(): string {
        return 'Default';
    }

    protected getBoundaryConfig(): BoundaryConfig {
        return {
            type: 'none',
            min: [0, 0, 0],
            max: [0, 0, 0]
        };
    }
}
