"use client";

import type { Intensity } from "./RainEffect";

interface FogEffectProps {
  intensity?: Intensity;
}

const OPACITY_MAP: Record<Intensity, number> = {
  light: 0.3,
  moderate: 0.5,
  heavy: 0.7,
};

/**
 * FogEffect renders a semi-transparent mist overlay with subtle animation.
 * Uses CSS animations with GPU acceleration for smooth performance.
 */
export function FogEffect({ intensity = "moderate" }: FogEffectProps) {
  const opacity = OPACITY_MAP[intensity] || OPACITY_MAP.moderate;

  return (
    <div
      className="fog-effect"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 5,
      }}
      aria-hidden="true"
    >
      {/* First fog layer - slow moving */}
      <div
        className="fog-layer fog-layer-1"
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(
            to right,
            transparent 0%,
            rgba(200, 200, 200, ${opacity * 0.4}) 20%,
            rgba(180, 180, 180, ${opacity * 0.6}) 50%,
            rgba(200, 200, 200, ${opacity * 0.4}) 80%,
            transparent 100%
          )`,
          animation: "fog-drift 20s ease-in-out infinite",
          willChange: "transform",
          opacity: 0.8,
        }}
      />
      {/* Second fog layer - medium speed, offset */}
      <div
        className="fog-layer fog-layer-2"
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(
            to right,
            transparent 10%,
            rgba(220, 220, 220, ${opacity * 0.3}) 30%,
            rgba(200, 200, 200, ${opacity * 0.5}) 60%,
            rgba(220, 220, 220, ${opacity * 0.3}) 90%,
            transparent 100%
          )`,
          animation: "fog-drift 15s ease-in-out infinite reverse",
          animationDelay: "-5s",
          willChange: "transform",
          opacity: 0.6,
        }}
      />
      {/* Third fog layer - faster, top area */}
      <div
        className="fog-layer fog-layer-3"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: `linear-gradient(
            to bottom,
            rgba(180, 180, 180, ${opacity * 0.5}) 0%,
            transparent 100%
          )`,
          animation: "fog-pulse 8s ease-in-out infinite",
          willChange: "opacity",
        }}
      />
    </div>
  );
}

export default FogEffect;
