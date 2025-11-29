interface TrailConfig {
  image: string;
  tint: string;
}

/**
 * Maps weather conditions to trail images and tint overlay colors.
 * Images are located in /public/images/trails/
 */
const conditionMap: Record<string, TrailConfig> = {
  sunny: { image: "sunny-trail.webp", tint: "rgba(255, 183, 77, 0.15)" },
  clear: { image: "sunny-trail.webp", tint: "rgba(255, 183, 77, 0.15)" },
  rain: { image: "rainy-trail.webp", tint: "rgba(96, 125, 139, 0.25)" },
  cloudy: { image: "cloudy-trail.webp", tint: "rgba(158, 158, 158, 0.2)" },
  overcast: { image: "cloudy-trail.webp", tint: "rgba(158, 158, 158, 0.2)" },
  fog: { image: "foggy-trail.webp", tint: "rgba(200, 200, 200, 0.3)" },
  mist: { image: "foggy-trail.webp", tint: "rgba(200, 200, 200, 0.3)" },
  snow: { image: "snowy-trail.webp", tint: "rgba(179, 229, 252, 0.2)" },
  default: { image: "default-trail.webp", tint: "rgba(10, 15, 10, 0.6)" },
};

/**
 * Get the trail image filename for a weather condition
 */
export function getTrailImage(condition: string): string {
  const config = getTrailConfig(condition);
  return config.image;
}

/**
 * Get the tint overlay color for a weather condition
 */
export function getTintColor(condition: string): string {
  const config = getTrailConfig(condition);
  return config.tint;
}

/**
 * Get the full trail configuration for a weather condition
 */
function getTrailConfig(condition: string): TrailConfig {
  const conditionLower = condition.toLowerCase();

  // Check for more specific conditions first (order matters)
  // Partly cloudy/sunny should map to cloudy
  if (conditionLower.includes("partly cloudy") || conditionLower.includes("partly sunny")) {
    return conditionMap.cloudy;
  }

  // Sunny/Clear conditions
  if (conditionLower.includes("sunny") || conditionLower === "clear") {
    return conditionMap.sunny;
  }

  // Cloudy/Overcast conditions
  if (conditionLower.includes("cloudy") || conditionLower.includes("overcast")) {
    return conditionMap.cloudy;
  }

  // Rain conditions
  if (
    conditionLower.includes("rain") ||
    conditionLower.includes("drizzle") ||
    conditionLower.includes("shower")
  ) {
    return conditionMap.rain;
  }

  // Snow conditions
  if (
    conditionLower.includes("snow") ||
    conditionLower.includes("sleet") ||
    conditionLower.includes("blizzard")
  ) {
    return conditionMap.snow;
  }

  // Fog/Mist conditions
  if (
    conditionLower.includes("fog") ||
    conditionLower.includes("mist") ||
    conditionLower.includes("haze")
  ) {
    return conditionMap.fog;
  }

  // Default fallback
  return conditionMap.default;
}
