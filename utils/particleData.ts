import {
    ParticlePositionConfig,
    ParticleVelocityConfig,
    ParticleColorConfig,
    ParticleSizeConfig,
    GridPositionConfig,
    ZeroVelocityConfig,
    UniformColorConfig,
    UniformSizeConfig
} from '../config';

export function generateInitialPositions(
    count: number,
    config?: ParticlePositionConfig
): Float32Array {
    const size = Math.floor(Math.sqrt(count));
    const data = new Float32Array(size * size * 4);
    const positionConfig = config || new GridPositionConfig();

    for (let i = 0; i < size * size; i++) {
        const [x, y, z, age] = positionConfig.generatePosition(i, count, size);
        const index = i * 4;
        data[index] = x;
        data[index + 1] = y;
        data[index + 2] = z;
        data[index + 3] = age;
    }

    return data;
}

export function generateInitialVelocities(
    count: number,
    config?: ParticleVelocityConfig
): Float32Array {
    const size = Math.floor(Math.sqrt(count));
    const data = new Float32Array(size * size * 4);
    const velocityConfig = config || new ZeroVelocityConfig();

    for (let i = 0; i < size * size; i++) {
        const [vx, vy, vz, unused] = velocityConfig.generateVelocity(i, count, size);
        const index = i * 4;
        data[index] = vx;
        data[index + 1] = vy;
        data[index + 2] = vz;
        data[index + 3] = unused;
    }

    return data;
}

export function generateInitialColors(
    count: number,
    config?: ParticleColorConfig
): Float32Array {
    const data = new Float32Array(count * 3);
    const colorConfig = config || new UniformColorConfig();

    for (let i = 0; i < count; i++) {
        const [r, g, b] = colorConfig.generateColor(i, count);
        data[i * 3] = r;
        data[i * 3 + 1] = g;
        data[i * 3 + 2] = b;
    }

    return data;
}

export function generateInitialSizes(
    count: number,
    config?: ParticleSizeConfig
): Float32Array {
    const data = new Float32Array(count);
    const sizeConfig = config || new UniformSizeConfig();

    for (let i = 0; i < count; i++) {
        data[i] = sizeConfig.generateSize(i, count);
    }

    return data;
}

