/**
 * Weather Effects Utility Functions
 *
 * Provides condition parsing and intensity calculation for weather effects.
 */

import type { Intensity } from "@/components/weather-effects";

/**
 * Weather effect types that can be displayed
 */
export type WeatherType = "rain" | "snow" | "fog" | "sun" | "cloud" | "none";

/**
 * Parsed weather condition with type and intensity
 */
export interface ParsedCondition {
  type: WeatherType;
  intensity: Intensity;
}

/**
 * Multiple effects that can be displayed simultaneously
 */
export interface WeatherEffects {
  effects: ParsedCondition[];
}

/**
 * Gets intensity modifier from condition string
 * @param condition - Lowercase weather condition string
 * @returns Intensity level based on condition modifiers
 */
function getIntensityFromModifier(condition: string): Intensity | null {
  if (condition.includes("light") || condition.includes("drizzle")) {
    return "light";
  }
  if (condition.includes("heavy") || condition.includes("torrential")) {
    return "heavy";
  }
  if (condition.includes("moderate")) {
    return "moderate";
  }
  return null;
}

/**
 * Calculates intensity based on precipitation percentage
 * @param precipitation - Precipitation probability 0-100
 * @returns Intensity level based on precipitation
 */
export function getIntensityFromPrecipitation(precipitation: number): Intensity {
  if (precipitation <= 30) {
    return "light";
  }
  if (precipitation <= 60) {
    return "moderate";
  }
  return "heavy";
}

/**
 * Parses a weather condition string to determine the weather type and intensity.
 * Handles various condition formats including compound conditions.
 *
 * @param condition - Weather condition string (e.g., "Light Rain", "Heavy Snow")
 * @param precipitation - Optional precipitation percentage for intensity calculation
 * @returns Parsed condition with type and intensity, or null for unknown conditions
 */
export function parseCondition(condition: string, precipitation?: number): ParsedCondition | null {
  const lower = condition.toLowerCase();

  // Handle rain conditions
  if (
    lower.includes("rain") ||
    lower.includes("drizzle") ||
    lower.includes("shower") ||
    lower.includes("thunderstorm")
  ) {
    const modifierIntensity = getIntensityFromModifier(lower);
    const intensity =
      modifierIntensity ??
      (precipitation !== undefined ? getIntensityFromPrecipitation(precipitation) : "moderate");
    return { type: "rain", intensity };
  }

  // Handle snow conditions
  if (lower.includes("snow") || lower.includes("sleet") || lower.includes("blizzard")) {
    const modifierIntensity = getIntensityFromModifier(lower);
    const intensity =
      modifierIntensity ??
      (precipitation !== undefined ? getIntensityFromPrecipitation(precipitation) : "moderate");
    return { type: "snow", intensity };
  }

  // Handle fog/mist conditions
  if (lower.includes("fog") || lower.includes("mist") || lower.includes("haze")) {
    const modifierIntensity = getIntensityFromModifier(lower);
    return { type: "fog", intensity: modifierIntensity ?? "moderate" };
  }

  // Handle partly cloudy - check before sunny/clear to avoid false matches
  // "Partly Cloudy" or "Partly Sunny" should show clouds with sun
  if (lower.includes("partly")) {
    // Return cloud for partly conditions - sun will be added by parseConditions
    return { type: "cloud", intensity: "light" };
  }

  // Handle sunny/clear conditions
  if (lower.includes("sunny") || lower.includes("clear") || lower === "fair") {
    return { type: "sun", intensity: "moderate" };
  }

  // Handle cloudy/overcast conditions
  if (lower.includes("cloud") || lower.includes("overcast")) {
    const modifierIntensity = getIntensityFromModifier(lower);
    // Heavy clouds = more clouds, not storm intensity
    return { type: "cloud", intensity: modifierIntensity ?? "moderate" };
  }

  // Unknown condition
  return null;
}

/**
 * Parses a weather condition string and returns all applicable effects.
 * Handles compound conditions like "Partly Cloudy" (cloud + sun).
 *
 * @param condition - Weather condition string
 * @param precipitation - Optional precipitation percentage
 * @returns Array of parsed conditions representing all effects to show
 */
export function parseConditions(condition: string, precipitation?: number): ParsedCondition[] {
  const lower = condition.toLowerCase();
  const effects: ParsedCondition[] = [];

  // Handle partly cloudy/sunny - shows both cloud and sun
  if (lower.includes("partly")) {
    effects.push({ type: "cloud", intensity: "light" });
    effects.push({ type: "sun", intensity: "light" });
    return effects;
  }

  // Parse single condition
  const parsed = parseCondition(condition, precipitation);
  if (parsed) {
    effects.push(parsed);
  }

  return effects;
}
