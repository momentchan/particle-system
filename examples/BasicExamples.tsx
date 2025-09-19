'use client';

import React from 'react';
import {
    ParticleSystem,
    GridPositionConfig,
    RandomPositionConfig,
    SpherePositionConfig,
    ZeroVelocityConfig,
    RandomVelocityConfig,
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
    return (
        <>
            {/* Example 1: Default particles */}
            <ParticleSystem count={512} />

            {/* Example 2: Grid positioned particles with gravity */}
            <ParticleSystem
                count={256}
                config={{
                    position: new GridPositionConfig({ x: [-2, 2], y: [-2, 2], z: [0, 0] }),
                    velocity: new ZeroVelocityConfig(),
                    color: new UniformColorConfig([1, 1, 1]),
                    size: new UniformSizeConfig(1)
                }}
                behavior={new GravityBehavior(-0.1, 0.995, 0.05)}
            />

            {/* Example 3: Random positioned particles with swirling motion */}
            <ParticleSystem
                count={256}
                config={{
                    position: new RandomPositionConfig({ x: [-3, 3], y: [-3, 3], z: [-1, 1] }),
                    velocity: new ZeroVelocityConfig(),
                    color: new RandomColorConfig({
                        r: [0.5, 1],
                        g: [0.2, 0.8],
                        b: [0.8, 1]
                    }),
                    size: new RandomSizeConfig([0.5, 2])
                }}
                behavior={new SwirlBehavior(0.5, 1.0)}
            />

            {/* Example 4: Sphere particles with radial velocities */}
            <ParticleSystem
                count={256}
                config={{
                    position: new SpherePositionConfig(2.0, [0, 0, 0]),
                    velocity: new RadialVelocityConfig(0.2),
                    color: new GradientColorConfig([1, 0, 0], [0, 1, 0]),
                    size: new RandomSizeConfig([0.5, 2])
                }}
                behavior={new DefaultBehavior()}
            />

            {/* Example 5: Attractor behavior with random initial positions */}
            <ParticleSystem
                count={256}
                config={{
                    position: new RandomPositionConfig({ x: [-4, 4], y: [-4, 4], z: [-4, 4] }),
                    velocity: new ZeroVelocityConfig(),
                    color: new GradientColorConfig([0, 1, 1], [1, 0, 1]),
                    size: new RandomSizeConfig([1, 3])
                }}
                behavior={new AttractorBehavior([0, 0, 0], 0.1, 0.99)}
            />
        </>
    );
}
