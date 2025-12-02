"use client";

import type { Intensity } from "./RainEffect";

interface SunEffectProps {
  intensity?: Intensity;
  /** Multiplier for ray count (0-1), used for mobile optimization */
  particleMultiplier?: number;
}

const BRIGHTNESS_MAP: Record<Intensity, number> = {
  light: 0.3,
  moderate: 0.5,
  heavy: 0.7,
};

const RAY_COUNTS: Record<Intensity, number> = {
  light: 4,
  moderate: 6,
  heavy: 8,
};

/**
 * SunEffect renders warm light rays emanating from the top-right corner.
 * Creates a lens flare / sun ray effect with GPU-accelerated animations.
 */
export function SunEffect({ intensity = "moderate", particleMultiplier = 1 }: SunEffectProps) {
  const brightness = BRIGHTNESS_MAP[intensity] || BRIGHTNESS_MAP.moderate;
  const baseRayCount = RAY_COUNTS[intensity] || RAY_COUNTS.moderate;
  const rayCount = Math.max(
    2,
    Math.round(baseRayCount * Math.max(0, Math.min(1, particleMultiplier)))
  );

  return (
    <div
      className="sun-effect"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 5,
      }}
      aria-hidden="true"
    >
      {/* Sun glow */}
      <div
        className="sun-glow"
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "400px",
          height: "400px",
          background: `radial-gradient(
            circle,
            rgba(255, 236, 179, ${brightness}) 0%,
            rgba(255, 183, 77, ${brightness * 0.5}) 30%,
            transparent 70%
          )`,
          borderRadius: "50%",
          animation: "sun-pulse 4s ease-in-out infinite",
          willChange: "opacity, transform",
        }}
      />
      {/* Light rays */}
      {Array.from({ length: rayCount }).map((_, i) => {
        const angle = (i * 180) / rayCount - 45;
        const delay = i * 0.5;
        return (
          <div
            key={i}
            className="sun-ray"
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              width: "150%",
              height: "3px",
              background: `linear-gradient(
                to left,
                rgba(255, 236, 179, ${brightness * 0.6}) 0%,
                rgba(255, 213, 79, ${brightness * 0.3}) 30%,
                transparent 70%
              )`,
              transformOrigin: "top right",
              transform: `rotate(${angle}deg)`,
              animation: "ray-shimmer 3s ease-in-out infinite",
              animationDelay: `${delay}s`,
              willChange: "opacity",
            }}
          />
        );
      })}
      {/* Lens flare spots */}
      <div
        className="lens-flare lens-flare-1"
        style={{
          position: "absolute",
          top: "20%",
          right: "30%",
          width: "20px",
          height: "20px",
          background: `radial-gradient(
            circle,
            rgba(255, 236, 179, ${brightness * 0.4}) 0%,
            transparent 70%
          )`,
          borderRadius: "50%",
          animation: "flare-pulse 2s ease-in-out infinite",
          willChange: "opacity",
        }}
      />
      <div
        className="lens-flare lens-flare-2"
        style={{
          position: "absolute",
          top: "35%",
          right: "45%",
          width: "12px",
          height: "12px",
          background: `radial-gradient(
            circle,
            rgba(255, 213, 79, ${brightness * 0.3}) 0%,
            transparent 70%
          )`,
          borderRadius: "50%",
          animation: "flare-pulse 2s ease-in-out infinite",
          animationDelay: "0.5s",
          willChange: "opacity",
        }}
      />
    </div>
  );
}

export default SunEffect;
