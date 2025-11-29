/**
 * Weather Preferences Logic
 *
 * Core logic for evaluating whether weather conditions are acceptable for different
 * run types. Provides scoring, acceptability checks, and rejection reasoning.
 *
 * These pure functions form the foundation of the planning algorithm:
 * - isAcceptableWeather(): Determines if weather meets run type requirements
 * - getWeatherScore(): Calculates a 0-100 score for weather quality
 * - getWeatherQuality(): Maps numeric scores to human-readable labels
 * - getRejectionReason(): Explains why weather is unacceptable
 *
 * @example
 * ```typescript
 * import { isAcceptableWeather, getWeatherScore, getWeatherQuality } from '@/lib/weather-preferences';
 *
 * const weather = { condition: 'Clear', temperature: 15, precipitation: 10, windSpeed: 15, ... };
 * const preference = { maxPrecipitation: 20, maxWindSpeed: 25, minTemperature: 0, ... };
 *
 * const acceptable = isAcceptableWeather(weather, preference);
 * const score = getWeatherScore(weather, preference);
 * const quality = getWeatherQuality(score); // 'excellent', 'good', 'fair', or 'poor'
 * ```
 */

import type { RunType, WeatherPreference as PrismaWeatherPreference } from "@prisma/client";

/**
 * Weather data structure for acceptability evaluation.
 * Subset of full WeatherData with fields needed for scoring.
 */
export interface WeatherDataForScoring {
  condition: string;
  temperature: number; // Celsius
  feelsLike: number; // Celsius
  precipitation: number; // 0-100 probability
  humidity: number; // 0-100 percentage
  windSpeed: number; // km/h
}

/**
 * Weather preference thresholds for a run type.
 * Matches the Prisma WeatherPreference model structure.
 */
export interface WeatherPreferenceThresholds {
  runType: RunType;
  maxPrecipitation: number; // 0-100
  maxWindSpeed: number | null; // km/h, null = no limit
  minTemperature: number | null; // Celsius, null = no limit
  maxTemperature: number | null; // Celsius, null = no limit
  avoidConditions: string[]; // e.g., ["Heavy Rain", "Thunderstorm"]
}

/**
 * Quality label for weather conditions.
 * Maps to score ranges: excellent (80-100), good (60-79), fair (40-59), poor (0-39)
 */
export type WeatherQuality = "excellent" | "good" | "fair" | "poor";

/**
 * Re-export RunType from Prisma for convenience
 */
export { RunType } from "@prisma/client";

/**
 * Convert a Prisma WeatherPreference to the thresholds interface.
 * Strips database metadata fields (id, createdAt, updatedAt).
 */
export function toWeatherPreferenceThresholds(
  prismaPreference: PrismaWeatherPreference
): WeatherPreferenceThresholds {
  return {
    runType: prismaPreference.runType,
    maxPrecipitation: prismaPreference.maxPrecipitation,
    maxWindSpeed: prismaPreference.maxWindSpeed,
    minTemperature: prismaPreference.minTemperature,
    maxTemperature: prismaPreference.maxTemperature,
    avoidConditions: prismaPreference.avoidConditions,
  };
}

/**
 * Ideal temperature for running (Celsius).
 * Used as the center point for temperature penalty calculation.
 */
const IDEAL_TEMPERATURE = 12.5;

/**
 * Scoring weights for each weather factor.
 * Total must equal 100 for easy interpretation.
 */
const SCORING_WEIGHTS = {
  precipitation: 40, // Most important factor
  wind: 25, // Second most important
  temperature: 20, // Third most important
  condition: 15, // Penalty for bad conditions
} as const;

/**
 * Calculate a weather quality score from 0-100.
 *
 * The score starts at 100 (perfect conditions) and deducts points based on:
 * - Precipitation probability (0-40 points)
 * - Wind speed (0-25 points)
 * - Temperature deviation from ideal (0-20 points)
 * - Bad weather conditions (0-15 points)
 *
 * @param weather - Weather data to score
 * @param preference - Weather preference thresholds for comparison
 * @returns Score from 0-100, where higher is better
 *
 * @example
 * ```typescript
 * const score = getWeatherScore(
 *   { condition: 'Clear', temperature: 12, precipitation: 10, windSpeed: 10, feelsLike: 11, humidity: 50 },
 *   { maxPrecipitation: 20, maxWindSpeed: 25, minTemperature: 0, maxTemperature: 25, avoidConditions: [], runType: 'LONG_RUN' }
 * );
 * // Returns ~85 (excellent conditions)
 * ```
 */
export function getWeatherScore(
  weather: WeatherDataForScoring,
  preference: WeatherPreferenceThresholds
): number {
  let score = 100;

  // Precipitation penalty (0-40 points)
  // Scale: at maxPrecipitation, lose 40 points; above max, still capped at 40
  const maxPrecip = Math.max(preference.maxPrecipitation, 1); // Avoid division by zero
  const precipRatio = weather.precipitation / maxPrecip;
  const precipPenalty = Math.min(
    precipRatio * SCORING_WEIGHTS.precipitation,
    SCORING_WEIGHTS.precipitation
  );
  score -= precipPenalty;

  // Wind penalty (0-25 points)
  // Only apply if there's a wind limit set
  if (preference.maxWindSpeed !== null && preference.maxWindSpeed > 0) {
    const windRatio = weather.windSpeed / preference.maxWindSpeed;
    const windPenalty = Math.min(windRatio * SCORING_WEIGHTS.wind, SCORING_WEIGHTS.wind);
    score -= windPenalty;
  }

  // Temperature penalty (0-20 points)
  // Penalty increases as temperature moves away from ideal (12.5°C)
  // Each degree away from ideal costs 2 points, up to max penalty
  const tempDiff = Math.abs(weather.temperature - IDEAL_TEMPERATURE);
  const tempPenalty = Math.min(tempDiff * 2, SCORING_WEIGHTS.temperature);
  score -= tempPenalty;

  // Condition penalty (0-15 points)
  // Full penalty if any avoided condition matches
  const hasAvoidedCondition = preference.avoidConditions.some((avoided) =>
    weather.condition.toLowerCase().includes(avoided.toLowerCase())
  );
  if (hasAvoidedCondition) {
    score -= SCORING_WEIGHTS.condition;
  }

  // Clamp to 0-100 range and round
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Check if weather conditions are acceptable for a run type.
 *
 * Compares weather data against preference thresholds:
 * - Precipitation must be <= maxPrecipitation
 * - Wind speed must be <= maxWindSpeed (if limit set)
 * - Temperature must be >= minTemperature (if limit set)
 * - Temperature must be <= maxTemperature (if limit set)
 * - Condition must not match any avoidConditions
 *
 * @param weather - Weather data to evaluate
 * @param preference - Weather preference thresholds
 * @returns true if weather is acceptable, false otherwise
 *
 * @example
 * ```typescript
 * const acceptable = isAcceptableWeather(
 *   { condition: 'Light Rain', temperature: 10, precipitation: 60, windSpeed: 20, feelsLike: 8, humidity: 80 },
 *   { maxPrecipitation: 50, maxWindSpeed: 30, minTemperature: 5, maxTemperature: 25, avoidConditions: ['Heavy Rain'], runType: 'EASY_RUN' }
 * );
 * // Returns false (precipitation 60% > max 50%)
 * ```
 */
export function isAcceptableWeather(
  weather: WeatherDataForScoring,
  preference: WeatherPreferenceThresholds
): boolean {
  // Check precipitation
  if (weather.precipitation > preference.maxPrecipitation) {
    return false;
  }

  // Check wind speed (only if limit is set)
  if (preference.maxWindSpeed !== null && weather.windSpeed > preference.maxWindSpeed) {
    return false;
  }

  // Check minimum temperature (only if limit is set)
  if (preference.minTemperature !== null && weather.temperature < preference.minTemperature) {
    return false;
  }

  // Check maximum temperature (only if limit is set)
  if (preference.maxTemperature !== null && weather.temperature > preference.maxTemperature) {
    return false;
  }

  // Check avoided conditions
  const hasAvoidedCondition = preference.avoidConditions.some((avoided) =>
    weather.condition.toLowerCase().includes(avoided.toLowerCase())
  );
  if (hasAvoidedCondition) {
    return false;
  }

  return true;
}

/**
 * Convert a numeric score to a quality label.
 *
 * Quality thresholds:
 * - excellent: 80-100 (ideal conditions, prioritize this day)
 * - good: 60-79 (good conditions, schedule if needed)
 * - fair: 40-59 (acceptable but not ideal)
 * - poor: 0-39 (consider skipping or rescheduling)
 *
 * @param score - Weather score from 0-100
 * @returns Quality label
 *
 * @example
 * ```typescript
 * getWeatherQuality(85); // 'excellent'
 * getWeatherQuality(70); // 'good'
 * getWeatherQuality(45); // 'fair'
 * getWeatherQuality(25); // 'poor'
 * ```
 */
export function getWeatherQuality(score: number): WeatherQuality {
  if (score >= 80) {
    return "excellent";
  }
  if (score >= 60) {
    return "good";
  }
  if (score >= 40) {
    return "fair";
  }
  return "poor";
}

/**
 * Generate a human-readable explanation for why weather is unacceptable.
 *
 * Checks each threshold and generates specific messages for failures:
 * - "Precipitation too high (X% vs Y% max)"
 * - "Wind speed exceeds limit (X km/h vs Y km/h max)"
 * - "Temperature below minimum (X°C vs Y°C min)"
 * - "Temperature above maximum (X°C vs Y°C max)"
 * - "Conditions include X which should be avoided"
 *
 * @param weather - Weather data to evaluate
 * @param preference - Weather preference thresholds
 * @returns Array of rejection reasons, empty if weather is acceptable
 *
 * @example
 * ```typescript
 * const reasons = getRejectionReason(
 *   { condition: 'Heavy Rain', temperature: -5, precipitation: 80, windSpeed: 40, feelsLike: -8, humidity: 95 },
 *   { maxPrecipitation: 20, maxWindSpeed: 25, minTemperature: 0, maxTemperature: 25, avoidConditions: ['Heavy Rain'], runType: 'LONG_RUN' }
 * );
 * // Returns [
 * //   "Precipitation too high (80% vs 20% max)",
 * //   "Wind speed exceeds limit (40 km/h vs 25 km/h max)",
 * //   "Temperature below minimum (-5°C vs 0°C min)",
 * //   "Conditions include Heavy Rain which should be avoided"
 * // ]
 * ```
 */
export function getRejectionReason(
  weather: WeatherDataForScoring,
  preference: WeatherPreferenceThresholds
): string[] {
  const reasons: string[] = [];

  // Check precipitation
  if (weather.precipitation > preference.maxPrecipitation) {
    reasons.push(
      `Precipitation too high (${Math.round(weather.precipitation)}% vs ${Math.round(preference.maxPrecipitation)}% max)`
    );
  }

  // Check wind speed
  if (preference.maxWindSpeed !== null && weather.windSpeed > preference.maxWindSpeed) {
    reasons.push(
      `Wind speed exceeds limit (${Math.round(weather.windSpeed)} km/h vs ${Math.round(preference.maxWindSpeed)} km/h max)`
    );
  }

  // Check minimum temperature
  if (preference.minTemperature !== null && weather.temperature < preference.minTemperature) {
    reasons.push(
      `Temperature below minimum (${Math.round(weather.temperature)}°C vs ${Math.round(preference.minTemperature)}°C min)`
    );
  }

  // Check maximum temperature
  if (preference.maxTemperature !== null && weather.temperature > preference.maxTemperature) {
    reasons.push(
      `Temperature above maximum (${Math.round(weather.temperature)}°C vs ${Math.round(preference.maxTemperature)}°C max)`
    );
  }

  // Check avoided conditions
  for (const avoided of preference.avoidConditions) {
    if (weather.condition.toLowerCase().includes(avoided.toLowerCase())) {
      reasons.push(`Conditions include ${avoided} which should be avoided`);
      break; // Only report first matching condition
    }
  }

  return reasons;
}
