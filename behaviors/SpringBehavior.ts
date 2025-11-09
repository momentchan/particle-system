import * as THREE from 'three';
import { ParticleBehavior, BoundaryConfig } from './base';

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

