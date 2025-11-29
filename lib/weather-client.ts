/**
 * Weather API Client
 *
 * Fetches weather data from WeatherAPI.com with:
 * - Rate limiting (50 calls/day internal safety limit)
 * - Retry logic with exponential backoff (3 retries)
 * - Type-safe response parsing
 * - Comprehensive error handling
 */

import { WeatherData, WeatherAPIError } from "@/types/weather";

// Rate limiting state (resets daily)
let dailyCallCount = 0;
let lastResetDate = new Date().toDateString();
const DAILY_LIMIT = 1000; // Increased for paid WeatherAPI plans

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

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
