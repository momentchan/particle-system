import * as THREE from 'three';
import { ParticleBehavior } from './base';

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

