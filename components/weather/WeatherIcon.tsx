"use client";

interface WeatherIconProps {
  condition: string;
  className?: string;
}

/**
 * Maps weather condition strings to emoji icons
 * Conditions come from WeatherAPI.com condition text
 */
export function WeatherIcon({ condition, className = "" }: WeatherIconProps) {
  const icon = getWeatherIcon(condition);

  return (
    <span className={className} role="img" aria-label={condition}>
      {icon}
    </span>
  );
}

/**
 * Get weather emoji icon based on condition string
 * Handles various WeatherAPI.com condition texts
 */
export function getWeatherIcon(condition: string): string {
  const conditionLower = condition.toLowerCase();

  // Partly cloudy/sunny (check before sunny/cloudy to handle more specific cases first)
  if (conditionLower.includes("partly cloudy") || conditionLower.includes("partly sunny")) {
    return "\u26C5"; // sun behind cloud emoji
  }

  // Sunny/Clear conditions
  if (conditionLower.includes("sunny") || conditionLower === "clear") {
    return "\u2600\uFE0F"; // sun emoji
  }

  // Cloudy/Overcast
  if (conditionLower.includes("cloudy") || conditionLower.includes("overcast")) {
    return "\u2601\uFE0F"; // cloud emoji
  }

  // Rain conditions
  if (
    conditionLower.includes("rain") ||
    conditionLower.includes("drizzle") ||
    conditionLower.includes("shower")
  ) {
    return "\uD83C\uDF27\uFE0F"; // rain cloud emoji
  }

  // Snow conditions
  if (
    conditionLower.includes("snow") ||
    conditionLower.includes("sleet") ||
    conditionLower.includes("blizzard")
  ) {
    return "\uD83C\uDF28\uFE0F"; // snow cloud emoji
  }

  // Thunder/Storm conditions
  if (conditionLower.includes("thunder") || conditionLower.includes("storm")) {
    return "\u26C8\uFE0F"; // thunder cloud emoji
  }

  // Fog/Mist conditions
  if (
    conditionLower.includes("fog") ||
    conditionLower.includes("mist") ||
    conditionLower.includes("haze")
  ) {
    return "\uD83C\uDF2B\uFE0F"; // fog emoji
  }

  // Default to cloud for unknown conditions
  return "\u2601\uFE0F"; // cloud emoji
}
