import { ParticlePositionConfig } from '../base';

export class RandomSpherePositionConfig extends ParticlePositionConfig {
    constructor(
        private radius: number = 1.0,
        private center: [number, number, number] = [0, 0, 0]
    ) {
        super();
    }

    generatePosition(_index: number, _totalCount: number, _size: number): [number, number, number, number] {
        // Uniform distribution within sphere volume
        // Use cube root of random to account for volume distribution
        const r = this.radius * Math.cbrt(Math.random());
        
        // Uniform distribution of angles
        const theta = Math.random() * Math.PI * 2; // Azimuthal angle [0, 2π]
        const phi = Math.acos(2 * Math.random() - 1); // Polar angle [0, π] (uniform in cos(phi))
        
        // Convert spherical to Cartesian coordinates
        const x = this.center[0] + r * Math.sin(phi) * Math.cos(theta);
        const y = this.center[1] + r * Math.sin(phi) * Math.sin(theta);
        const z = this.center[2] + r * Math.cos(phi);
        
        return [x, y, z, 0.0];
    }
}

