"use client";

import { useMemo } from "react";
import type { Intensity } from "./RainEffect";

interface SnowEffectProps {
  intensity?: Intensity;
}

const PARTICLE_COUNTS: Record<Intensity, number> = {
  light: 25,
  moderate: 50,
  heavy: 80,
};

interface Snowflake {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  drift: number;
}

/**
 * SnowEffect renders animated snowflakes drifting down with gentle horizontal movement.
 * Uses CSS animations with GPU acceleration for smooth performance.
 */
export function SnowEffect({ intensity = "moderate" }: SnowEffectProps) {
  const snowflakes = useMemo(() => {
    const count = PARTICLE_COUNTS[intensity] || PARTICLE_COUNTS.moderate;
    const flakes: Snowflake[] = [];

    for (let i = 0; i < count; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 4 + Math.random() * 4,
        size: 3 + Math.random() * 5,
        opacity: 0.4 + Math.random() * 0.4,
        drift: -20 + Math.random() * 40,
      });
    }

    return flakes;
  }, [intensity]);

  return (
    <div
      className="snow-effect"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 5,
      }}
      aria-hidden="true"
    >
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            position: "absolute",
            left: `${flake.left}%`,
            top: "-10px",
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            background: `rgba(255, 255, 255, ${flake.opacity})`,
            borderRadius: "50%",
            boxShadow: `0 0 ${flake.size}px rgba(255, 255, 255, 0.3)`,
            animation: `snow-fall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
            willChange: "transform",
            ["--drift" as string]: `${flake.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export default SnowEffect;
