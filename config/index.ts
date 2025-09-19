// Base configuration classes with override functions
export abstract class ParticlePositionConfig {
    abstract generatePosition(index: number, totalCount: number, size: number): [number, number, number, number]; // [x, y, z, age]
}

export abstract class ParticleVelocityConfig {
    abstract generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number]; // [vx, vy, vz, unused]
}

export abstract class ParticleColorConfig {
    abstract generateColor(index: number, totalCount: number): [number, number, number]; // [r, g, b]
}

export abstract class ParticleSizeConfig {
    abstract generateSize(index: number, totalCount: number): number;
}

export abstract class ParticleAgeConfig {
    abstract generateAge(index: number, totalCount: number): number;
}

// Built-in position configurations
export class GridPositionConfig extends ParticlePositionConfig {
    constructor(
        private bounds: { x: [number, number]; y: [number, number]; z: [number, number] } = { x: [-1, 1], y: [-1, 1], z: [0, 0] }
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
        const i = Math.floor(index / size);
        const j = index % size;
        const x = (i / size - 0.5) * (this.bounds.x[1] - this.bounds.x[0]) + (this.bounds.x[0] + this.bounds.x[1]) / 2;
        const y = (j / size - 0.5) * (this.bounds.y[1] - this.bounds.y[0]) + (this.bounds.y[0] + this.bounds.y[1]) / 2;
        const z = this.bounds.z[0];
        return [x, y, z, 0.0];
    }
}

export class RandomPositionConfig extends ParticlePositionConfig {
    constructor(
        private bounds: { x: [number, number]; y: [number, number]; z: [number, number] } = { x: [-1, 1], y: [-1, 1], z: [0, 0] }
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
        const x = this.bounds.x[0] + Math.random() * (this.bounds.x[1] - this.bounds.x[0]);
        const y = this.bounds.y[0] + Math.random() * (this.bounds.y[1] - this.bounds.y[0]);
        const z = this.bounds.z[0] + Math.random() * (this.bounds.z[1] - this.bounds.z[0]);
        return [x, y, z, 0.0];
    }
}

export class SpherePositionConfig extends ParticlePositionConfig {
    constructor(
        private radius: number = 1.0,
        private center: [number, number, number] = [0, 0, 0]
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
        const i = Math.floor(index / size);
        const j = index % size;
        const theta = (i / size) * Math.PI * 2;
        const phi = (j / size) * Math.PI;
        const x = this.center[0] + Math.sin(phi) * Math.cos(theta) * this.radius;
        const y = this.center[1] + Math.sin(phi) * Math.sin(theta) * this.radius;
        const z = this.center[2] + Math.cos(phi) * this.radius;
        return [x, y, z, 0.0];
    }
}

export class CubePositionConfig extends ParticlePositionConfig {
    constructor(
        private bounds: { x: [number, number]; y: [number, number]; z: [number, number] } = { x: [-1, 1], y: [-1, 1], z: [-1, 1] }
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
        const x = this.bounds.x[0] + Math.random() * (this.bounds.x[1] - this.bounds.x[0]);
        const y = this.bounds.y[0] + Math.random() * (this.bounds.y[1] - this.bounds.y[0]);
        const z = this.bounds.z[0] + Math.random() * (this.bounds.z[1] - this.bounds.z[0]);
        return [x, y, z, 0.0];
    }
}

// Built-in velocity configurations
export class ZeroVelocityConfig extends ParticleVelocityConfig {
    generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number] {
        return [0, 0, 0, 0];
    }
}

export class RandomVelocityConfig extends ParticleVelocityConfig {
    constructor(private magnitude: number = 0.1) {
        super();
    }

    generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number] {
        const vx = (Math.random() - 0.5) * this.magnitude * 2;
        const vy = (Math.random() - 0.5) * this.magnitude * 2;
        const vz = (Math.random() - 0.5) * this.magnitude * 2;
        return [vx, vy, vz, 0];
    }
}

export class RadialVelocityConfig extends ParticleVelocityConfig {
    constructor(
        private magnitude: number = 0.1,
        private center: [number, number] = [0, 0]
    ) {
        super();
    }

    generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number] {
        const i = Math.floor(index / size);
        const j = index % size;
        const dx = (i / size - 0.5) - this.center[0];
        const dy = (j / size - 0.5) - this.center[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vx = dist > 0 ? (dx / dist) * this.magnitude : 0;
        const vy = dist > 0 ? (dy / dist) * this.magnitude : 0;
        return [vx, vy, 0, 0];
    }
}

export class TangentialVelocityConfig extends ParticleVelocityConfig {
    constructor(
        private magnitude: number = 0.1,
        private center: [number, number] = [0, 0]
    ) {
        super();
    }

    generateVelocity(index: number, totalCount: number, size: number): [number, number, number, number] {
        const i = Math.floor(index / size);
        const j = index % size;
        const dx = (i / size - 0.5) - this.center[0];
        const dy = (j / size - 0.5) - this.center[1];
        const vx = -dy * this.magnitude;
        const vy = dx * this.magnitude;
        return [vx, vy, 0, 0];
    }
}

// Built-in color configurations
export class UniformColorConfig extends ParticleColorConfig {
    constructor(private color: [number, number, number] = [1, 1, 1]) {
        super();
    }

    generateColor(index: number, totalCount: number): [number, number, number] {
        return [...this.color] as [number, number, number];
    }
}

export class RandomColorConfig extends ParticleColorConfig {
    constructor(
        private colorRange: { r: [number, number]; g: [number, number]; b: [number, number] } = {
            r: [0, 1], g: [0, 1], b: [0, 1]
        }
    ) {
        super();
    }

    generateColor(index: number, totalCount: number): [number, number, number] {
        const r = this.colorRange.r[0] + Math.random() * (this.colorRange.r[1] - this.colorRange.r[0]);
        const g = this.colorRange.g[0] + Math.random() * (this.colorRange.g[1] - this.colorRange.g[0]);
        const b = this.colorRange.b[0] + Math.random() * (this.colorRange.b[1] - this.colorRange.b[0]);
        return [r, g, b];
    }
}

export class GradientColorConfig extends ParticleColorConfig {
    constructor(
        private startColor: [number, number, number] = [1, 0, 0],
        private endColor: [number, number, number] = [0, 0, 1]
    ) {
        super();
    }

    generateColor(index: number, totalCount: number): [number, number, number] {
        const t = index / totalCount;
        const r = this.startColor[0] + t * (this.endColor[0] - this.startColor[0]);
        const g = this.startColor[1] + t * (this.endColor[1] - this.startColor[1]);
        const b = this.startColor[2] + t * (this.endColor[2] - this.startColor[2]);
        return [r, g, b];
    }
}

// Built-in size configurations
export class UniformSizeConfig extends ParticleSizeConfig {
    constructor(private size: number = 0.1) {
        super();
    }

    generateSize(index: number, totalCount: number): number {
        return this.size;
    }
}

export class RandomSizeConfig extends ParticleSizeConfig {
    constructor(private sizeRange: [number, number] = [0.05, 0.2]) {
        super();
    }

    generateSize(index: number, totalCount: number): number {
        return this.sizeRange[0] + Math.random() * (this.sizeRange[1] - this.sizeRange[0]);
    }
}

// Built-in age configurations
export class ZeroAgeConfig extends ParticleAgeConfig {
    generateAge(index: number, totalCount: number): number {
        return 0;
    }
}

export class RandomAgeConfig extends ParticleAgeConfig {
    constructor(private ageRange: [number, number] = [0, 1]) {
        super();
    }

    generateAge(index: number, totalCount: number): number {
        return this.ageRange[0] + Math.random() * (this.ageRange[1] - this.ageRange[0]);
    }
}

// Main configuration interface
export interface ParticleSystemConfig {
    position?: ParticlePositionConfig;
    velocity?: ParticleVelocityConfig;
    color?: ParticleColorConfig;
    size?: ParticleSizeConfig;
    age?: ParticleAgeConfig;
}
