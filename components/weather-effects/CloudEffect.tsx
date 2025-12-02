"use client";

import { useMemo } from "react";
import type { Intensity } from "./RainEffect";

interface CloudEffectProps {
  intensity?: Intensity;
  /** Multiplier for particle count (0-1), used for mobile optimization */
  particleMultiplier?: number;
}

const CLOUD_COUNTS: Record<Intensity, number> = {
  light: 3,
  moderate: 5,
  heavy: 8,
};

interface Cloud {
  id: number;
  top: number;
  left: number;
  width: number;
  height: number;
  opacity: number;
  duration: number;
  delay: number;
}

/**
 * CloudEffect renders drifting cloud shapes across the top of the screen.
 * Uses CSS animations with GPU acceleration for smooth performance.
 */
export function CloudEffect({ intensity = "moderate", particleMultiplier = 1 }: CloudEffectProps) {
  const clouds = useMemo(() => {
    const baseCount = CLOUD_COUNTS[intensity] || CLOUD_COUNTS.moderate;
    const count = Math.max(1, Math.round(baseCount * Math.max(0, Math.min(1, particleMultiplier))));
    const cloudList: Cloud[] = [];

    for (let i = 0; i < count; i++) {
      cloudList.push({
        id: i,
        top: 5 + Math.random() * 25,
        left: -30 + Math.random() * 130,
        width: 100 + Math.random() * 150,
        height: 40 + Math.random() * 40,
        opacity: 0.4 + Math.random() * 0.3,
        duration: 30 + Math.random() * 30,
        delay: Math.random() * 20,
      });
    }

    return cloudList;
  }, [intensity, particleMultiplier]);

  return (
    <div
      className="cloud-effect"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 5,
      }}
      aria-hidden="true"
    >
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="cloud"
          style={{
            position: "absolute",
            top: `${cloud.top}%`,
            left: `${cloud.left}%`,
            width: `${cloud.width}px`,
            height: `${cloud.height}px`,
            animation: `cloud-drift ${cloud.duration}s linear infinite`,
            animationDelay: `${cloud.delay}s`,
            willChange: "transform",
          }}
        >
          {/* Cloud body made of multiple circles */}
          <div
            className="cloud-body"
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "10%",
                top: "30%",
                width: "50%",
                height: "70%",
                background: `rgba(255, 255, 255, ${cloud.opacity})`,
                borderRadius: "50%",
                filter: "blur(8px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "30%",
                top: "10%",
                width: "45%",
                height: "80%",
                background: `rgba(255, 255, 255, ${cloud.opacity * 0.9})`,
                borderRadius: "50%",
                filter: "blur(8px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "25%",
                width: "40%",
                height: "65%",
                background: `rgba(255, 255, 255, ${cloud.opacity * 0.8})`,
                borderRadius: "50%",
                filter: "blur(8px)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default CloudEffect;
