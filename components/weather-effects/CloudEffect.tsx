"use client";

import { useMemo } from "react";
import type { Intensity } from "./RainEffect";

interface CloudEffectProps {
  intensity?: Intensity;
  /** Multiplier for particle count (0-1), used for mobile optimization */
  particleMultiplier?: number;
}

const CLOUD_COUNTS: Record<Intensity, number> = {
  light: 2,
  moderate: 4,
  heavy: 6,
};

interface Cloud {
  id: number;
  top: number;
  left: number;
  scale: number;
  opacity: number;
  duration: number;
  delay: number;
}

/** Puff configuration for building fluffy clouds */
interface CloudPuff {
  left: string;
  top: string;
  width: string;
  height: string;
  opacityMult: number;
}

/** Base puffs that make up a fluffy cloud shape */
const CLOUD_PUFFS: CloudPuff[] = [
  // Bottom layer - wide base
  { left: "5%", top: "55%", width: "35%", height: "50%", opacityMult: 0.7 },
  { left: "25%", top: "50%", width: "40%", height: "55%", opacityMult: 0.8 },
  { left: "50%", top: "55%", width: "35%", height: "50%", opacityMult: 0.7 },
  { left: "70%", top: "60%", width: "25%", height: "40%", opacityMult: 0.6 },
  // Middle layer - main body
  { left: "10%", top: "35%", width: "30%", height: "50%", opacityMult: 0.85 },
  { left: "30%", top: "25%", width: "35%", height: "60%", opacityMult: 0.9 },
  { left: "55%", top: "30%", width: "30%", height: "55%", opacityMult: 0.85 },
  // Top layer - fluffy peaks
  { left: "20%", top: "15%", width: "25%", height: "45%", opacityMult: 1 },
  { left: "40%", top: "10%", width: "28%", height: "50%", opacityMult: 1 },
  { left: "60%", top: "20%", width: "22%", height: "40%", opacityMult: 0.95 },
];

/**
 * CloudEffect renders large, fluffy drifting clouds across the screen.
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
        top: -5 + Math.random() * 35, // Spread across upper portion
        left: -40 + Math.random() * 140, // Start off-screen for seamless loop
        scale: 0.8 + Math.random() * 0.6, // Vary sizes (0.8x to 1.4x)
        opacity: 0.5 + Math.random() * 0.35, // 0.5 to 0.85 opacity
        duration: 60 + Math.random() * 40, // Slower drift (60-100s)
        delay: Math.random() * 30,
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
            width: "400px", // Large base size
            height: "200px",
            transform: `scale(${cloud.scale})`,
            animation: `cloud-drift ${cloud.duration}s linear infinite`,
            animationDelay: `${cloud.delay}s`,
            willChange: "transform",
          }}
        >
          {/* Cloud body made of multiple overlapping puffs */}
          <div
            className="cloud-body"
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            {CLOUD_PUFFS.map((puff, idx) => (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  left: puff.left,
                  top: puff.top,
                  width: puff.width,
                  height: puff.height,
                  background: `rgba(255, 255, 255, ${cloud.opacity * puff.opacityMult})`,
                  borderRadius: "50%",
                  filter: "blur(20px)",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CloudEffect;
