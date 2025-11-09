'use client';

import { useMemo } from 'react';
import {
    ParticleSystem,
    GridPositionConfig,
    RandomPositionConfig,
    ZeroVelocityConfig,
    UniformColorConfig,
    GradientColorConfig,
    UniformSizeConfig,
    RandomSizeConfig,
    GravityBehavior,
    SwirlBehavior
} from '../index';

export default function BasicExamples() {
    // Memoize config objects to prevent recreation on every render
    const gravityConfig = useMemo(() => ({
        position: new GridPositionConfig({ x: [-2, 2], y: [-2, 2], z: [0, 0] }),
        velocity: new ZeroVelocityConfig(),
        color: new UniformColorConfig([1, 1, 1]),
        size: new UniformSizeConfig(1)
    }), []);

    const swirlConfig = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-3, 3], y: [-3, 3], z: [-1, 1] }),
        velocity: new ZeroVelocityConfig(),
        color: new GradientColorConfig([0, 1, 1], [1, 0, 1]),
        size: new RandomSizeConfig([0.5, 2])
    }), []);

    // Memoize behavior objects to prevent recreation on every render
    const gravityBehavior = useMemo(() => new GravityBehavior(-0.1, 0.995, 0.05), []);
    const swirlBehavior = useMemo(() => new SwirlBehavior(0.5, 1.0), []);

    return (
        <>
            {/* Example 1: Gravity behavior with grid positioning */}
            <ParticleSystem
                count={256}
                config={gravityConfig}
                behavior={gravityBehavior}
            />

            {/* Example 2: Swirl behavior with random positioning */}
            <ParticleSystem
                count={256}
                config={swirlConfig}
                behavior={swirlBehavior}
            />
        </>
    );
}
