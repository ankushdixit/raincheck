"use client";

import { parseConditions } from "@/lib/weather-effects";
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
}

/**
 * WeatherEffectLayer orchestrates which weather effects to display based on
 * the current weather condition string. It parses weather conditions,
 * activates appropriate effect(s), and adjusts intensity based on
 * precipitation levels.
 *
 * Supports compound conditions like "Partly Cloudy" which shows both
 * cloud and sun effects.
 *
 * @example
 * ```tsx
 * <WeatherEffectLayer
 *   condition="Light Rain"
 *   weather={{ precipitation: 45, temperature: 15 }}
 * />
 * ```
 */
export function WeatherEffectLayer({ condition, weather }: WeatherEffectLayerProps) {
  // Parse the condition to get all applicable effects
  const effects = parseConditions(condition, weather?.precipitation);

  // If no effects match, render nothing
  if (effects.length === 0) {
    return null;
  }

  return (
    <>
      {effects.map((effect, index) => {
        switch (effect.type) {
          case "rain":
            return <RainEffect key={`rain-${index}`} intensity={effect.intensity} />;
          case "snow":
            return <SnowEffect key={`snow-${index}`} intensity={effect.intensity} />;
          case "fog":
            return <FogEffect key={`fog-${index}`} intensity={effect.intensity} />;
          case "sun":
            return <SunEffect key={`sun-${index}`} intensity={effect.intensity} />;
          case "cloud":
            return <CloudEffect key={`cloud-${index}`} intensity={effect.intensity} />;
          default:
            return null;
        }
      })}
    </>
  );
}

export default WeatherEffectLayer;
