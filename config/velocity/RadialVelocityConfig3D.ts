import { ParticleVelocityConfig } from '../base';

export class RadialVelocityConfig3D extends ParticleVelocityConfig {
    constructor(
        private magnitude: number = 0.1,
        private center: [number, number, number] = [0, 0, 0],
        private speedVariation: number = 0.0 // Random variation in speed (0-1)
    ) {
        super();
    }

    generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number] {
        // Get position from index (assuming particles are generated in order)
        // For explosion, we'll use random direction from center
        const angle1 = Math.random() * Math.PI * 2; // Azimuthal angle
        const angle2 = Math.acos(2 * Math.random() - 1); // Polar angle (uniform distribution)
        
        // Unit direction vector
        const dx = Math.sin(angle2) * Math.cos(angle1);
        const dy = Math.sin(angle2) * Math.sin(angle1);
        const dz = Math.cos(angle2);
        
        // Apply speed variation
        const speed = this.magnitude * (1.0 + (Math.random() - 0.5) * this.speedVariation * 2.0);
        
        return [dx * speed, dy * speed, dz * speed, 0];
    }
}

