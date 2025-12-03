/**
 * Weather API Client
 *
 * Uses Open-Meteo API exclusively for weather data.
 * Open-Meteo is free, requires no API key, and provides:
 * - Up to 16-day forecasts
 * - Hourly data
 * - Global coverage
 *
 * Based on accuracy testing against official weather services
 * (Met Éireann, NOAA), Open-Meteo showed the best performance
 * for condition and rain prediction accuracy.
 *
 * Features:
 * - Geocoding for location name to coordinates conversion
 * - Retry logic with exponential backoff (3 retries)
 * - Type-safe response parsing
 * - Comprehensive error handling
 */

import { WeatherData, WeatherAPIError, HourlyWeather } from "@/types/weather";

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Maximum days available from Open-Meteo */
const OPEN_METEO_MAX_DAYS = 16;

/** Retry configuration */
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Coordinates for Open-Meteo API
 */
interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Open-Meteo Geocoding API response
 */
interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    country_code: string;
    admin1?: string; // State/region
  }>;
}

/**
 * Open-Meteo API response types
 * @see https://open-meteo.com/en/docs
 */
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    relative_humidity_2m: number;
    is_day: number;
  };
  hourly: {
    time: string[]; // ISO8601 timestamps
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m?: number[];
    is_day: number[]; // 1 = day, 0 = night
    relative_humidity_2m: number[];
  };
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * WMO Weather interpretation codes to condition text
 * @see https://open-meteo.com/en/docs#weathervariables
 */
function wmoCodeToCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: "Clear",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    56: "Light Freezing Drizzle",
    57: "Dense Freezing Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    66: "Light Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    85: "Slight Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail",
  };
  return conditions[code] ?? "Unknown";
}

// =============================================================================
// GEOCODING
// =============================================================================

/**
 * Convert a location string to coordinates using Open-Meteo Geocoding API
 *
 * @param location - Location string (e.g., "Balbriggan, IE" or "New York")
 * @returns Coordinates and resolved location name
 * @throws WeatherAPIError if location not found
 */
export async function geocodeLocation(
  location: string
): Promise<{ coords: Coordinates; name: string }> {
  // Check if location is already coordinates (lat,lon format)
  const coordsMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordsMatch) {
    return {
      coords: {
        latitude: parseFloat(coordsMatch[1]),
        longitude: parseFloat(coordsMatch[2]),
      },
      name: location,
    };
  }

  // Open-Meteo geocoding works better with just the city name
  // Strip common country code formats like ", IE", ", US", etc.
  const cleanLocation = location
    .replace(/,\s*[A-Z]{2}$/i, "") // Remove ", IE" format
    .replace(/,\s*[A-Z]{2,3}\s*$/i, "") // Remove ", USA" format
    .trim();

  const params = new URLSearchParams({
    name: cleanLocation,
    count: "1",
    language: "en",
    format: "json",
  });

  const url = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new WeatherAPIError(`Geocoding API error: ${response.statusText}`, response.status);
      }

      const data = (await response.json()) as GeocodingResponse;

      if (!data.results || data.results.length === 0) {
        throw new WeatherAPIError("Location not found", 404);
      }

      const result = data.results[0];
      const locationName = result.admin1
        ? `${result.name}, ${result.admin1}, ${result.country}`
        : `${result.name}, ${result.country}`;

      return {
        coords: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
        name: locationName,
      };
    } catch (error) {
      lastError = error as Error;

      if (error instanceof WeatherAPIError) {
        const status = error.statusCode ?? 0;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  if (lastError instanceof WeatherAPIError) {
    throw lastError;
  }
  throw new WeatherAPIError("Geocoding service unavailable", 503);
}

// =============================================================================
// WEATHER DATA PARSING
// =============================================================================

/**
 * Parse Open-Meteo hourly data into HourlyWeather array
 */
function parseOpenMeteoHourly(data: OpenMeteoResponse, dayIndex: number): HourlyWeather[] {
  const hoursPerDay = 24;
  const startIndex = dayIndex * hoursPerDay;
  const endIndex = startIndex + hoursPerDay;
  const hourly: HourlyWeather[] = [];

  for (let i = startIndex; i < endIndex && i < data.hourly.time.length; i++) {
    hourly.push({
      time: new Date(data.hourly.time[i]),
      condition: wmoCodeToCondition(data.hourly.weather_code[i]),
      temperature: data.hourly.temperature_2m[i],
      feelsLike: data.hourly.apparent_temperature[i],
      precipitation: data.hourly.precipitation_probability[i],
      humidity: data.hourly.relative_humidity_2m[i],
      windSpeed: data.hourly.wind_speed_10m[i],
      isDay: data.hourly.is_day[i] === 1,
    });
  }

  return hourly;
}

/**
 * Parse Open-Meteo response into WeatherData array
 */
function parseOpenMeteoResponse(data: OpenMeteoResponse, location: string): WeatherData[] {
  const days: WeatherData[] = [];
  const hoursPerDay = 24;
  const totalDays = Math.floor(data.hourly.time.length / hoursPerDay);

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const startHour = dayIndex * hoursPerDay;
    const endHour = startHour + hoursPerDay;

    // Calculate daily aggregates from hourly data
    let totalTemp = 0;
    let totalFeelsLike = 0;
    let maxPrecipProb = 0;
    let totalHumidity = 0;
    let maxWindSpeed = 0;
    let windDirection = 0;
    let dominantWeatherCode = 0;
    let hourCount = 0;

    for (let i = startHour; i < endHour && i < data.hourly.time.length; i++) {
      totalTemp += data.hourly.temperature_2m[i];
      totalFeelsLike += data.hourly.apparent_temperature[i];
      maxPrecipProb = Math.max(maxPrecipProb, data.hourly.precipitation_probability[i]);
      totalHumidity += data.hourly.relative_humidity_2m[i];
      maxWindSpeed = Math.max(maxWindSpeed, data.hourly.wind_speed_10m[i]);
      // Use weather code and wind direction from midday (12:00) as representative
      if (i === startHour + 12) {
        dominantWeatherCode = data.hourly.weather_code[i];
        windDirection = data.hourly.wind_direction_10m?.[i] ?? 0;
      }
      hourCount++;
    }

    const avgTemp = totalTemp / hourCount;
    const avgFeelsLike = totalFeelsLike / hourCount;
    const avgHumidity = totalHumidity / hourCount;
    const condition = wmoCodeToCondition(dominantWeatherCode);

    days.push({
      location,
      latitude: data.latitude,
      longitude: data.longitude,
      datetime: new Date(data.hourly.time[startHour]),
      condition,
      description: condition,
      temperature: Math.round(avgTemp * 10) / 10,
      feelsLike: Math.round(avgFeelsLike * 10) / 10,
      precipitation: maxPrecipProb,
      humidity: Math.round(avgHumidity),
      windSpeed: Math.round(maxWindSpeed * 10) / 10,
      windDirection,
      hourly: parseOpenMeteoHourly(data, dayIndex),
    });
  }

  return days;
}

/**
 * Parse current weather from Open-Meteo response
 */
function parseCurrentWeather(data: OpenMeteoResponse, location: string): WeatherData {
  if (!data.current) {
    // Fall back to first hour of hourly data
    const condition = wmoCodeToCondition(data.hourly.weather_code[0]);
    return {
      location,
      latitude: data.latitude,
      longitude: data.longitude,
      datetime: new Date(data.hourly.time[0]),
      condition,
      description: condition,
      temperature: data.hourly.temperature_2m[0],
      feelsLike: data.hourly.apparent_temperature[0],
      precipitation: data.hourly.precipitation_probability[0],
      humidity: data.hourly.relative_humidity_2m[0],
      windSpeed: data.hourly.wind_speed_10m[0],
      windDirection: data.hourly.wind_direction_10m?.[0] ?? 0,
    };
  }

  const condition = wmoCodeToCondition(data.current.weather_code);
  return {
    location,
    latitude: data.latitude,
    longitude: data.longitude,
    datetime: new Date(data.current.time),
    condition,
    description: condition,
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    precipitation: data.hourly.precipitation_probability[0] ?? 0,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
  };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Fetch current weather for a location
 *
 * @param location - Location string (e.g., "Balbriggan, IE" or coordinates "53.6108,-6.1817")
 * @returns Weather data for the location
 * @throws WeatherAPIError on failure
 */
export async function fetchCurrentWeather(location: string): Promise<WeatherData> {
  // Geocode the location
  const { coords, name } = await geocodeLocation(location);

  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "relative_humidity_2m",
      "is_day",
    ].join(","),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "is_day",
      "relative_humidity_2m",
    ].join(","),
    forecast_days: "1",
    timezone: "auto",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new WeatherAPIError(`Open-Meteo API error: ${response.statusText}`, response.status);
      }

      const data = (await response.json()) as OpenMeteoResponse;
      return parseCurrentWeather(data, name);
    } catch (error) {
      lastError = error as Error;

      if (error instanceof WeatherAPIError) {
        const status = error.statusCode ?? 0;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  if (lastError instanceof WeatherAPIError) {
    throw lastError;
  }
  throw new WeatherAPIError("Weather service unavailable", 503);
}

/**
 * Fetch weather forecast for a location
 *
 * @param location - Location string (e.g., "Balbriggan, IE" or coordinates "53.6108,-6.1817")
 * @param days - Number of days to fetch (1-16, default 7)
 * @returns Array of weather data for each day
 * @throws WeatherAPIError on failure
 */
export async function fetchForecast(location: string, days: number = 7): Promise<WeatherData[]> {
  // Validate days parameter
  const validDays = Math.min(Math.max(days, 1), OPEN_METEO_MAX_DAYS);

  // Geocode the location
  const { coords, name } = await geocodeLocation(location);

  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "is_day",
      "relative_humidity_2m",
    ].join(","),
    forecast_days: validDays.toString(),
    timezone: "auto",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new WeatherAPIError(`Open-Meteo API error: ${response.statusText}`, response.status);
      }

      const data = (await response.json()) as OpenMeteoResponse;
      return parseOpenMeteoResponse(data, name);
    } catch (error) {
      lastError = error as Error;

      if (error instanceof WeatherAPIError) {
        const status = error.statusCode ?? 0;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  if (lastError instanceof WeatherAPIError) {
    throw lastError;
  }
  throw new WeatherAPIError("Weather service unavailable", 503);
}

/**
 * Fetch extended forecast for a location (up to 16 days)
 * This is an alias for fetchForecast with days=16
 *
 * @param location - Location string (e.g., "Balbriggan, IE")
 * @param days - Total number of days to fetch (1-16, default 14)
 * @returns Array of weather data for each day
 */
export async function fetchHybridForecast(
  location: string,
  days: number = 14
): Promise<WeatherData[]> {
  // Now just a simple alias since we use Open-Meteo exclusively
  return fetchForecast(location, days);
}

/**
 * Fetch forecast using coordinates directly (no geocoding needed)
 *
 * @param coords - Latitude and longitude
 * @param location - Location name for the response
 * @param days - Number of days to fetch (1-16)
 * @returns Array of weather data for each day
 */
export async function fetchFromOpenMeteo(
  coords: Coordinates,
  location: string,
  days: number = 16
): Promise<WeatherData[]> {
  const validDays = Math.min(Math.max(days, 1), OPEN_METEO_MAX_DAYS);

  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "is_day",
      "relative_humidity_2m",
    ].join(","),
    forecast_days: validDays.toString(),
    timezone: "auto",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new WeatherAPIError(`Open-Meteo API error: ${response.statusText}`, response.status);
      }

      const data = (await response.json()) as OpenMeteoResponse;
      return parseOpenMeteoResponse(data, location);
    } catch (error) {
      lastError = error as Error;

      if (error instanceof WeatherAPIError) {
        const status = error.statusCode ?? 0;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  if (lastError instanceof WeatherAPIError) {
    throw lastError;
  }
  throw new WeatherAPIError("Open-Meteo service unavailable", 503);
}
