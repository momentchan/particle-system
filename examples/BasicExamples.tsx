'use client';

import { useMemo } from 'react';
import {
    ParticleSystem,
    GridPositionConfig,
    RandomPositionConfig,
    SpherePositionConfig,
    ZeroVelocityConfig,
    RadialVelocityConfig,
    UniformColorConfig,
    RandomColorConfig,
    GradientColorConfig,
    UniformSizeConfig,
    RandomSizeConfig,
    DefaultBehavior,
    GravityBehavior,
    SwirlBehavior,
    AttractorBehavior
} from '../index';

export default function BasicExamples() {
    // Memoize config objects to prevent recreation on every render
    const gridConfig = useMemo(() => ({
        position: new GridPositionConfig({ x: [-2, 2], y: [-2, 2], z: [0, 0] }),
        velocity: new ZeroVelocityConfig(),
        color: new UniformColorConfig([1, 1, 1]),
        size: new UniformSizeConfig(1)
    }), []);

    const swirlConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-3, 3], y: [-3, 3], z: [-1, 1] }),
        velocity: new ZeroVelocityConfig(),
        color: new RandomColorConfig({
            r: [0.5, 1],
            g: [0.2, 0.8],
            b: [0.8, 1]
        }),
        size: new RandomSizeConfig([0.5, 2])
    }), []);

    const sphereConfig = useMemo(() => ({
        position: new SpherePositionConfig(2.0, [0, 0, 0]),
        velocity: new RadialVelocityConfig(0.2),
        color: new GradientColorConfig([1, 0, 0], [0, 1, 0]),
        size: new RandomSizeConfig([0.5, 2])
    }), []);

    const attractorConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-4, 4], y: [-4, 4], z: [-4, 4] }),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([0, 1, 1], [1, 0, 1]),
        size: new RandomSizeConfig([1, 3])
    }), []);

    // Memoize behavior objects to prevent recreation on every render
    const gravityBehavior = useMemo(() => new GravityBehavior(-0.1, 0.995, 0.05), []);
    const swirlBehavior = useMemo(() => new SwirlBehavior(0.5, 1.0), []);
    const defaultBehavior = useMemo(() => new DefaultBehavior(), []);
    const attractorBehavior = useMemo(() => new AttractorBehavior([0, 0, 0], 0.1, 0.99), []);

    return (
        <>
            {/* Example 1: Default particles */}
            <ParticleSystem count={512} />

            {/* Example 2: Grid positioned particles with gravity */}
            <ParticleSystem
                count={256}
                config={gridConfig}
                behavior={gravityBehavior}
            />

            {/* Example 3: Random positioned particles with swirling motion */}
            <ParticleSystem
                count={256}
                config={swirlConfig}
                behavior={swirlBehavior}
            />

            {/* Example 4: Sphere particles with radial velocities */}
            <ParticleSystem
                count={256}
                config={sphereConfig}
                behavior={defaultBehavior}
            />

            {/* Example 5: Attractor behavior with random initial positions */}
            <ParticleSystem
                count={256}
                config={attractorConfig}
                behavior={attractorBehavior}
            />
        </>
    );
}
