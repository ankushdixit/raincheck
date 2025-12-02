"use client";

import { useCallback, useState } from "react";
import { parseConditions } from "@/lib/weather-effects";
import { useDeviceCapabilities, useFPSMonitor, useEffectsPreference } from "@/hooks";
import { RainEffect } from "./RainEffect";
import { SnowEffect } from "./SnowEffect";
import { FogEffect } from "./FogEffect";
import { SunEffect } from "./SunEffect";
import { CloudEffect } from "./CloudEffect";

/**
 * Weather data used for intensity calculations
 */
interface WeatherData {
  precipitation?: number;
  temperature?: number;
}

interface WeatherEffectLayerProps {
  /** Weather condition string (e.g., "Light Rain", "Heavy Snow", "Partly Cloudy") */
  condition: string;
  /** Optional weather data for intensity adjustments */
  weather?: WeatherData;
  /** Callback when effects are auto-disabled due to low FPS */
  onAutoDisable?: () => void;
}

/**
 * Get particle multiplier based on device tier
 * Desktop: 100%, Medium: 50%, Low: 25%
 */
function getParticleMultiplier(tier: "high" | "medium" | "low"): number {
  switch (tier) {
    case "high":
      return 1;
    case "medium":
      return 0.5;
    case "low":
      return 0.25;
    default:
      return 1;
  }
}

/**
 * WeatherEffectLayer orchestrates which weather effects to display based on
 * the current weather condition string. It parses weather conditions,
 * activates appropriate effect(s), and adjusts intensity based on
 * precipitation levels.
 *
 * Includes mobile performance optimization:
 * - Detects device capabilities and adjusts particle counts
 * - Monitors FPS and auto-disables effects if performance drops
 * - Respects user's reduced motion preference
 * - Integrates with user's effects preference toggle
 *
 * Supports compound conditions like "Partly Cloudy" which shows both
 * cloud and sun effects.
 *
 * @example
 * ```tsx
 * <WeatherEffectLayer
 *   condition="Light Rain"
 *   weather={{ precipitation: 45, temperature: 15 }}
 *   onAutoDisable={() => toast('Effects disabled for performance')}
 * />
 * ```
 */
export function WeatherEffectLayer({ condition, weather, onAutoDisable }: WeatherEffectLayerProps) {
  // Track if effects were auto-disabled due to low FPS
  const [autoDisabled, setAutoDisabled] = useState(false);

  // Get device capabilities for adaptive rendering
  const { tier, prefersReducedMotion, isLoading: isCapabilitiesLoading } = useDeviceCapabilities();

  // Get user's effects preference
  const {
    effectsEnabled,
    setEffectsEnabled,
    isLoaded: isPreferenceLoaded,
  } = useEffectsPreference();

  // Handle low FPS by disabling effects
  const handleLowFPS = useCallback(() => {
    setAutoDisabled(true);
    setEffectsEnabled(false);
    onAutoDisable?.();
  }, [setEffectsEnabled, onAutoDisable]);

  // Monitor FPS when effects are enabled
  useFPSMonitor(handleLowFPS, {
    threshold: 20,
    sustainedDuration: 3,
    enabled: effectsEnabled && !autoDisabled,
  });

  // Parse the condition to get all applicable effects
  const effects = parseConditions(condition, weather?.precipitation);

  // Don't render during loading to prevent flash
  if (isCapabilitiesLoading || !isPreferenceLoaded) {
    return null;
  }

  // Respect reduced motion preference
  if (prefersReducedMotion) {
    return null;
  }

  // Respect user's effects preference
  if (!effectsEnabled) {
    return null;
  }

  // If no effects match, render nothing
  if (effects.length === 0) {
    return null;
  }

  // Calculate particle multiplier based on device tier
  const particleMultiplier = getParticleMultiplier(tier);

  return (
    <>
      {effects.map((effect, index) => {
        switch (effect.type) {
          case "rain":
            return (
              <RainEffect
                key={`rain-${index}`}
                intensity={effect.intensity}
                particleMultiplier={particleMultiplier}
              />
            );
          case "snow":
            return (
              <SnowEffect
                key={`snow-${index}`}
                intensity={effect.intensity}
                particleMultiplier={particleMultiplier}
              />
            );
          case "fog":
            return <FogEffect key={`fog-${index}`} intensity={effect.intensity} />;
          case "sun":
            return (
              <SunEffect
                key={`sun-${index}`}
                intensity={effect.intensity}
                particleMultiplier={particleMultiplier}
              />
            );
          case "cloud":
            return (
              <CloudEffect
                key={`cloud-${index}`}
                intensity={effect.intensity}
                particleMultiplier={particleMultiplier}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}

export default WeatherEffectLayer;
