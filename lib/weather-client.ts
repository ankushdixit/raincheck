/**
 * Weather API Client
 *
 * Hybrid weather fetching from multiple sources:
 * - WeatherAPI.com: High accuracy for days 1-5 (paid)
 * - Open-Meteo: Extended forecast for days 6-16 (free)
 *
 * Features:
 * - Rate limiting (1000 calls/day internal safety limit)
 * - Retry logic with exponential backoff (3 retries)
 * - Type-safe response parsing
 * - Comprehensive error handling
 */

import { WeatherData, WeatherAPIError, HourlyWeather } from "@/types/weather";

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Number of days to fetch from WeatherAPI.com (paid, higher accuracy) */
const WEATHER_API_DAYS = 5;

/** Maximum days available from Open-Meteo (free) */
const OPEN_METEO_MAX_DAYS = 16;

// Rate limiting state (resets daily)
let dailyCallCount = 0;
let lastResetDate = new Date().toDateString();
const DAILY_LIMIT = 1000; // Increased for paid WeatherAPI plans

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * WeatherAPI.com hourly forecast structure
 */
interface WeatherAPIHour {
  time: string; // "2025-11-29 09:00"
  time_epoch: number;
  temp_c: number;
  feelslike_c: number;
  humidity: number;
  wind_kph: number;
  chance_of_rain: number;
  is_day: number; // 1 = day, 0 = night
  condition: {
    text: string;
  };
}

/**
 * WeatherAPI.com response types (partial, for what we need)
 */
interface WeatherAPIResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    wind_kph: number;
    wind_degree: number;
    condition: {
      text: string;
    };
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        avgtemp_c: number;
        daily_chance_of_rain: number;
        avghumidity: number;
        maxwind_kph: number;
        condition: {
          text: string;
        };
      };
      hour: WeatherAPIHour[];
    }>;
  };
}

interface WeatherAPIErrorResponse {
  error: {
    code: number;
    message: string;
  };
}

/**
 * Check if daily rate limit has been exceeded
 */
function checkRateLimit(): void {
  const today = new Date().toDateString();

  // Reset counter if it's a new day
  if (today !== lastResetDate) {
    dailyCallCount = 0;
    lastResetDate = today;
  }

  if (dailyCallCount >= DAILY_LIMIT) {
    throw new WeatherAPIError("Daily rate limit exceeded", 429);
  }
}

/**
 * Increment the rate limit counter
 */
function incrementRateLimit(): void {
  dailyCallCount++;
}

/**
 * Get current rate limit status (for testing)
 */
export function getRateLimitStatus(): { count: number; limit: number; resetDate: string } {
  return {
    count: dailyCallCount,
    limit: DAILY_LIMIT,
    resetDate: lastResetDate,
  };
}

/**
 * Reset rate limit (for testing only)
 */
export function resetRateLimit(): void {
  dailyCallCount = 0;
  lastResetDate = new Date().toDateString();
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse WeatherAPI.com response into WeatherData
 */
function parseWeatherResponse(data: WeatherAPIResponse): WeatherData {
  const precipitation = data.forecast?.forecastday[0]?.day.daily_chance_of_rain ?? 0;

  return {
    location: `${data.location.name}, ${data.location.country}`,
    latitude: data.location.lat,
    longitude: data.location.lon,
    datetime: new Date(data.location.localtime),
    condition: data.current.condition.text,
    description: data.current.condition.text,
    temperature: data.current.temp_c,
    feelsLike: data.current.feelslike_c,
    precipitation,
    humidity: data.current.humidity,
    windSpeed: data.current.wind_kph,
    windDirection: data.current.wind_degree,
  };
}

/**
 * Make a single API request (without retry)
 */
async function makeRequest(url: string): Promise<WeatherAPIResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    // Try to parse error response
    try {
      const errorData = (await response.json()) as WeatherAPIErrorResponse;
      const errorCode = errorData.error?.code;
      const errorMessage = errorData.error?.message || "Unknown error";

      // Map WeatherAPI.com error codes to our error messages
      if (response.status === 401 || errorCode === 2006 || errorCode === 2007) {
        throw new WeatherAPIError("Weather API key invalid", response.status);
      }
      if (errorCode === 1006) {
        throw new WeatherAPIError("Location not found", 400);
      }

      throw new WeatherAPIError(errorMessage, response.status);
    } catch (e) {
      if (e instanceof WeatherAPIError) throw e;
      throw new WeatherAPIError("Weather service unavailable", response.status);
    }
  }

  return response.json() as Promise<WeatherAPIResponse>;
}

/**
 * Fetch current weather for a location
 *
 * @param location - Location string (e.g., "Balbriggan, IE" or coordinates "53.6108,-6.1817")
 * @param apiKey - Optional API key override (defaults to env variable)
 * @returns Weather data for the location
 * @throws WeatherAPIError on failure
 */
export async function fetchCurrentWeather(location: string, apiKey?: string): Promise<WeatherData> {
  // Validate API key
  const key = apiKey ?? process.env.WEATHER_API_KEY;
  if (!key) {
    throw new WeatherAPIError("Weather API key invalid", 401);
  }

  // Check rate limit
  checkRateLimit();

  // Build API URL
  const baseUrl = "https://api.weatherapi.com/v1/forecast.json";
  const params = new URLSearchParams({
    key,
    q: location,
    days: "1",
    aqi: "no",
    alerts: "no",
  });
  const url = `${baseUrl}?${params.toString()}`;

  // Retry logic with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const data = await makeRequest(url);
      incrementRateLimit();
      return parseWeatherResponse(data);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) - these won't succeed on retry
      if (error instanceof WeatherAPIError) {
        const status = error.statusCode ?? 0;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  if (lastError instanceof WeatherAPIError) {
    throw lastError;
  }
  throw new WeatherAPIError("Weather service unavailable", 503);
}

/**
 * Parse hourly weather data from API response
 */
function parseHourlyData(hours: WeatherAPIHour[]): HourlyWeather[] {
  return hours.map((hour) => ({
    time: new Date(hour.time.replace(" ", "T")),
    condition: hour.condition.text,
    temperature: hour.temp_c,
    feelsLike: hour.feelslike_c,
    precipitation: hour.chance_of_rain,
    humidity: hour.humidity,
    windSpeed: hour.wind_kph,
    isDay: hour.is_day === 1,
  }));
}

/**
 * Parse WeatherAPI.com forecast response into array of WeatherData
 */
function parseForecastResponse(data: WeatherAPIResponse): WeatherData[] {
  const location = `${data.location.name}, ${data.location.country}`;
  const latitude = data.location.lat;
  const longitude = data.location.lon;

  if (!data.forecast?.forecastday) {
    return [];
  }

  return data.forecast.forecastday.map((day) => ({
    location,
    latitude,
    longitude,
    datetime: new Date(day.date),
    condition: day.day.condition.text,
    description: day.day.condition.text,
    temperature: day.day.avgtemp_c,
    feelsLike: day.day.avgtemp_c, // Forecast API doesn't provide feels-like for daily
    precipitation: day.day.daily_chance_of_rain,
    humidity: day.day.avghumidity,
    windSpeed: day.day.maxwind_kph,
    windDirection: 0, // Forecast API doesn't provide wind direction for daily
    hourly: day.hour ? parseHourlyData(day.hour) : undefined,
  }));
}

/**
 * Fetch weather forecast for a location
 *
 * @param location - Location string (e.g., "Balbriggan, IE" or coordinates "53.6108,-6.1817")
 * @param days - Number of days to fetch (1-14, default 7)
 * @param apiKey - Optional API key override (defaults to env variable)
 * @returns Array of weather data for each day
 * @throws WeatherAPIError on failure
 */
export async function fetchForecast(
  location: string,
  days: number = 7,
  apiKey?: string
): Promise<WeatherData[]> {
  // Validate API key
  const key = apiKey ?? process.env.WEATHER_API_KEY;
  if (!key) {
    throw new WeatherAPIError("Weather API key invalid", 401);
  }

  // Validate days parameter
  if (days < 1 || days > 14) {
    throw new WeatherAPIError("Days must be between 1 and 14", 400);
  }

  // Check rate limit
  checkRateLimit();

  // Build API URL
  const baseUrl = "https://api.weatherapi.com/v1/forecast.json";
  const params = new URLSearchParams({
    key,
    q: location,
    days: days.toString(),
    aqi: "no",
    alerts: "no",
  });
  const url = `${baseUrl}?${params.toString()}`;

  // Retry logic with exponential backoff
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const data = await makeRequest(url);
      incrementRateLimit();
      return parseForecastResponse(data);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) - these won't succeed on retry
      if (error instanceof WeatherAPIError) {
        const status = error.statusCode ?? 0;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  if (lastError instanceof WeatherAPIError) {
    throw lastError;
  }
  throw new WeatherAPIError("Weather service unavailable", 503);
}

// =============================================================================
// OPEN-METEO API (Free extended forecast)
// =============================================================================

/**
 * Open-Meteo API response types
 * @see https://open-meteo.com/en/docs
 */
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: string[]; // ISO8601 timestamps
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    is_day: number[]; // 1 = day, 0 = night
    relative_humidity_2m: number[];
  };
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
    let dominantWeatherCode = 0;
    let hourCount = 0;

    for (let i = startHour; i < endHour && i < data.hourly.time.length; i++) {
      totalTemp += data.hourly.temperature_2m[i];
      totalFeelsLike += data.hourly.apparent_temperature[i];
      maxPrecipProb = Math.max(maxPrecipProb, data.hourly.precipitation_probability[i]);
      totalHumidity += data.hourly.relative_humidity_2m[i];
      maxWindSpeed = Math.max(maxWindSpeed, data.hourly.wind_speed_10m[i]);
      // Use weather code from midday (12:00) as representative
      if (i === startHour + 12) {
        dominantWeatherCode = data.hourly.weather_code[i];
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
      windDirection: 0, // Open-Meteo doesn't provide wind direction in basic request
      hourly: parseOpenMeteoHourly(data, dayIndex),
    });
  }

  return days;
}

/**
 * Coordinates for Open-Meteo API
 */
interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Fetch extended forecast from Open-Meteo (free, up to 16 days)
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
      "is_day",
      "relative_humidity_2m",
    ].join(","),
    forecast_days: validDays.toString(),
    timezone: "auto",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  // Retry logic
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

/**
 * Fetch hybrid forecast combining WeatherAPI.com and Open-Meteo
 *
 * - Days 1-5: WeatherAPI.com (higher accuracy, paid)
 * - Days 6-16: Open-Meteo (extended forecast, free)
 *
 * @param location - Location string (e.g., "Balbriggan, IE")
 * @param days - Total number of days to fetch (1-16, default 14)
 * @param apiKey - Optional WeatherAPI.com key override
 * @returns Array of weather data for each day
 */
export async function fetchHybridForecast(
  location: string,
  days: number = 14,
  apiKey?: string
): Promise<WeatherData[]> {
  const validDays = Math.min(Math.max(days, 1), OPEN_METEO_MAX_DAYS);

  // Determine how many days to fetch from each source
  const weatherApiDays = Math.min(validDays, WEATHER_API_DAYS);
  const needsOpenMeteo = validDays > WEATHER_API_DAYS;

  // Fetch from WeatherAPI.com (days 1-5)
  let weatherApiData: WeatherData[] = [];
  let coordinates: Coordinates | null = null;

  try {
    weatherApiData = await fetchForecast(location, weatherApiDays, apiKey);

    // Extract coordinates for Open-Meteo from WeatherAPI response
    if (weatherApiData.length > 0) {
      coordinates = {
        latitude: weatherApiData[0].latitude,
        longitude: weatherApiData[0].longitude,
      };
    }
  } catch (error) {
    // If WeatherAPI fails, we'll try Open-Meteo only with hardcoded coords
    console.error("WeatherAPI.com fetch failed, falling back to Open-Meteo only:", error);
  }

  // If we need more days and have coordinates, fetch from Open-Meteo
  if (needsOpenMeteo && coordinates) {
    try {
      const openMeteoData = await fetchFromOpenMeteo(
        coordinates,
        weatherApiData[0]?.location ?? location,
        validDays
      );

      // Merge: Use WeatherAPI for days 1-5, Open-Meteo for days 6+
      const weatherApiDates = new Set(weatherApiData.map((d) => d.datetime.toDateString()));

      const extendedDays = openMeteoData.filter(
        (d) => !weatherApiDates.has(d.datetime.toDateString())
      );

      return [...weatherApiData, ...extendedDays];
    } catch (error) {
      console.error("Open-Meteo fetch failed, using WeatherAPI data only:", error);
      return weatherApiData;
    }
  }

  return weatherApiData;
}
