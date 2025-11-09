import * as THREE from 'three';
import { ParticleBehavior } from './base';

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

