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
 * Check if current time is night (4pm - 8am)
 */
export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 16 || hour < 8;
}

/**
 * Get night overlay opacity based on time
 * - Daytime (8am - 4pm): no overlay
 * - Evening twilight (4pm - 6pm): gradual darkening 0 to 0.75
 * - Night (6pm - 6am): full darkness at 0.75
 * - Morning twilight (6am - 8am): gradual lightening 0.75 to 0
 */
export function getNightOverlayOpacity(date: Date = new Date()): number {
  const hour = date.getHours();

  // Daytime (8am - 4pm) - no overlay
  if (hour >= 8 && hour < 16) {
    return 0;
  }

  // Evening twilight (4pm - 6pm) - gradual darkening
  if (hour >= 16 && hour < 18) {
    return (hour - 16) * 0.425; // 0 at 4pm, 0.375 at 5pm, 0.75 at 6pm
  }

  // Night (6pm - 6am) - full darkness
  if (hour >= 18 || hour < 6) {
    return 0.85;
  }

  // Morning twilight (6am - 8am) - gradual lightening
  return 0.75 - (hour - 6) * 0.425; // 0.75 at 6am, 0.375 at 7am, 0 at 8am
}

/**
 * Get the night tint overlay color (dark blue overlay)
 */
export function getNightTint(date: Date = new Date()): string {
  const opacity = getNightOverlayOpacity(date);
  if (opacity === 0) return "transparent";
  return `rgba(15, 23, 42, ${opacity})`; // Dark blue-black
}

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
