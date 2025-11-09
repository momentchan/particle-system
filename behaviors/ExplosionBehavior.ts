import * as THREE from 'three';
import { ParticleBehavior } from './base';

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

