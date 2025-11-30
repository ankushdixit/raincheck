"use client";

import { useMemo } from "react";

export type Intensity = "light" | "moderate" | "heavy";

interface RainEffectProps {
  intensity?: Intensity;
}

const PARTICLE_COUNTS: Record<Intensity, number> = {
  light: 30,
  moderate: 60,
  heavy: 100,
};

interface RainDrop {
  id: number;
  left: number;
  delay: number;
  duration: number;
  opacity: number;
}

/**
 * RainEffect renders animated diagonal rain streaks falling across the screen.
 * Uses CSS animations with GPU acceleration for smooth 60fps performance.
 */
export function RainEffect({ intensity = "moderate" }: RainEffectProps) {
  const drops = useMemo(() => {
    const count = PARTICLE_COUNTS[intensity] || PARTICLE_COUNTS.moderate;
    const rainDrops: RainDrop[] = [];

    for (let i = 0; i < count; i++) {
      rainDrops.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.5 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.4,
      });
    }

    return rainDrops;
  }, [intensity]);

  return (
    <div
      className="rain-effect"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 5,
      }}
      aria-hidden="true"
    >
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="rain-drop"
          style={{
            position: "absolute",
            left: `${drop.left}%`,
            top: "-20px",
            width: "2px",
            height: "20px",
            background: `linear-gradient(to bottom, transparent, rgba(174, 194, 224, ${drop.opacity}))`,
            transform: "rotate(15deg)",
            animation: `rain-fall ${drop.duration}s linear infinite`,
            animationDelay: `${drop.delay}s`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}

export default RainEffect;
