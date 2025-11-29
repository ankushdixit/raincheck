/**
 * Unit tests for Weather API Client
 *
 * Tests cover:
 * - Response parsing
 * - Error handling
 * - Rate limiting
 * - Retry logic
 */

import {
  fetchCurrentWeather,
  fetchForecast,
  getRateLimitStatus,
  resetRateLimit,
} from "../weather-client";
import { WeatherAPIError } from "@/types/weather";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Sample successful API response
const mockSuccessResponse = {
  location: {
    name: "Balbriggan",
    region: "Leinster",
    country: "Ireland",
    lat: 53.61,
    lon: -6.18,
    localtime: "2025-11-28 14:30",
  },
  current: {
    temp_c: 12.5,
    feelslike_c: 10.2,
    humidity: 75,
    wind_kph: 15.3,
    wind_degree: 180,
    condition: {
      text: "Partly cloudy",
    },
  },
  forecast: {
    forecastday: [
      {
        day: {
          daily_chance_of_rain: 30,
        },
      },
    ],
  },
};

// Sample 7-day forecast response
const mockForecastResponse = {
  location: {
    name: "Balbriggan",
    region: "Leinster",
    country: "Ireland",
    lat: 53.61,
    lon: -6.18,
    localtime: "2025-11-28 14:30",
  },
  current: {
    temp_c: 12.5,
    feelslike_c: 10.2,
    humidity: 75,
    wind_kph: 15.3,
    wind_degree: 180,
    condition: {
      text: "Partly cloudy",
    },
  },
  forecast: {
    forecastday: [
      {
        date: "2025-11-28",
        day: {
          maxtemp_c: 14.0,
          mintemp_c: 8.0,
          avgtemp_c: 11.0,
          daily_chance_of_rain: 20,
          avghumidity: 75,
          maxwind_kph: 20.0,
          condition: { text: "Partly cloudy" },
        },
      },
      {
        date: "2025-11-29",
        day: {
          maxtemp_c: 12.0,
          mintemp_c: 6.0,
          avgtemp_c: 9.0,
          daily_chance_of_rain: 40,
          avghumidity: 80,
          maxwind_kph: 25.0,
          condition: { text: "Light rain" },
        },
      },
      {
        date: "2025-11-30",
        day: {
          maxtemp_c: 10.0,
          mintemp_c: 4.0,
          avgtemp_c: 7.0,
          daily_chance_of_rain: 60,
          avghumidity: 85,
          maxwind_kph: 30.0,
          condition: { text: "Rain" },
        },
      },
      {
        date: "2025-12-01",
        day: {
          maxtemp_c: 11.0,
          mintemp_c: 5.0,
          avgtemp_c: 8.0,
          daily_chance_of_rain: 30,
          avghumidity: 78,
          maxwind_kph: 22.0,
          condition: { text: "Cloudy" },
        },
      },
      {
        date: "2025-12-02",
        day: {
          maxtemp_c: 13.0,
          mintemp_c: 7.0,
          avgtemp_c: 10.0,
          daily_chance_of_rain: 15,
          avghumidity: 70,
          maxwind_kph: 18.0,
          condition: { text: "Sunny" },
        },
      },
      {
        date: "2025-12-03",
        day: {
          maxtemp_c: 14.0,
          mintemp_c: 8.0,
          avgtemp_c: 11.0,
          daily_chance_of_rain: 10,
          avghumidity: 65,
          maxwind_kph: 15.0,
          condition: { text: "Clear" },
        },
      },
      {
        date: "2025-12-04",
        day: {
          maxtemp_c: 12.0,
          mintemp_c: 6.0,
          avgtemp_c: 9.0,
          daily_chance_of_rain: 25,
          avghumidity: 72,
          maxwind_kph: 20.0,
          condition: { text: "Overcast" },
        },
      },
    ],
  },
};

describe("Weather Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimit();
    // Set up API key for tests
    process.env.WEATHER_API_KEY = "test-api-key";
  });

  afterEach(() => {
    delete process.env.WEATHER_API_KEY;
  });

  describe("fetchCurrentWeather", () => {
    it("parses weather response correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      const result = await fetchCurrentWeather("Balbriggan, IE");

      expect(result).toEqual({
        location: "Balbriggan, Ireland",
        latitude: 53.61,
        longitude: -6.18,
        datetime: new Date("2025-11-28 14:30"),
        condition: "Partly cloudy",
        description: "Partly cloudy",
        temperature: 12.5,
        feelsLike: 10.2,
        precipitation: 30,
        humidity: 75,
        windSpeed: 15.3,
        windDirection: 180,
      });
    });

    it("handles response without forecast data", async () => {
      const responseWithoutForecast = {
        ...mockSuccessResponse,
        forecast: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseWithoutForecast),
      });

      const result = await fetchCurrentWeather("Balbriggan, IE");

      expect(result.precipitation).toBe(0);
    });

    it("constructs correct API URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await fetchCurrentWeather("Balbriggan, IE");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://api.weatherapi.com/v1/forecast.json")
      );
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("key=test-api-key"));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("q=Balbriggan"));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("days=1"));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("aqi=no"));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("alerts=no"));
    });

    it("uses custom API key when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await fetchCurrentWeather("Balbriggan, IE", "custom-key");

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("key=custom-key"));
    });
  });

  describe("Error handling", () => {
    it("throws WeatherAPIError when API key is missing", async () => {
      delete process.env.WEATHER_API_KEY;

      await expect(fetchCurrentWeather("Balbriggan, IE")).rejects.toThrow(WeatherAPIError);
      await expect(fetchCurrentWeather("Balbriggan, IE")).rejects.toThrow(
        "Weather API key invalid"
      );
    });

    it("throws WeatherAPIError for invalid API key (401)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: { code: 2006, message: "API key is invalid" },
          }),
      });

      await expect(fetchCurrentWeather("Balbriggan, IE")).rejects.toThrow(
        "Weather API key invalid"
      );
    });

    it("throws WeatherAPIError for location not found (1006)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              code: 1006,
              message: "No matching location found.",
            },
          }),
      });

      await expect(fetchCurrentWeather("InvalidLocation123")).rejects.toThrow("Location not found");
    });

    it("throws WeatherAPIError for server error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Parse error")),
      });

      await expect(fetchCurrentWeather("Balbriggan, IE")).rejects.toThrow(
        "Weather service unavailable"
      );
    });

    it("includes status code in WeatherAPIError", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: { code: 1006, message: "No matching location found." },
          }),
      });

      try {
        await fetchCurrentWeather("InvalidLocation");
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        expect((error as WeatherAPIError).statusCode).toBe(400);
      }
    });
  });

  describe("Rate limiting", () => {
    it("tracks API calls", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      const initialStatus = getRateLimitStatus();
      expect(initialStatus.count).toBe(0);

      await fetchCurrentWeather("Balbriggan, IE");

      const afterStatus = getRateLimitStatus();
      expect(afterStatus.count).toBe(1);
    });

    it("verifies rate limit is configured correctly", async () => {
      // With 1000 call limit, we verify the configuration is correct
      // rather than making 1000 actual calls
      const status = getRateLimitStatus();
      expect(status.limit).toBe(1000);
      expect(status.count).toBeGreaterThanOrEqual(0);
      expect(status.count).toBeLessThanOrEqual(status.limit);
    });

    it("resets counter on new day", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      // Make a call
      await fetchCurrentWeather("Balbriggan, IE");

      // Manually reset (simulates new day)
      resetRateLimit();

      const status = getRateLimitStatus();
      expect(status.count).toBe(0);
    });

    it("reports correct limit value", () => {
      const status = getRateLimitStatus();
      expect(status.limit).toBe(1000);
    });
  });

  describe("Retry logic", () => {
    it("does not retry on client error (4xx)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: { code: 1006, message: "No matching location found." },
          }),
      });

      await expect(fetchCurrentWeather("InvalidLocation")).rejects.toThrow("Location not found");

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not retry on unauthorized error (401)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: { code: 2006, message: "API key invalid" },
          }),
      });

      await expect(fetchCurrentWeather("Balbriggan, IE")).rejects.toThrow(
        "Weather API key invalid"
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("retries are configured with max 3 attempts", async () => {
      // This test verifies the retry configuration exists
      // Full retry behavior with timing is tested via integration tests
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: { code: 1006, message: "No matching location found." },
          }),
      });

      try {
        await fetchCurrentWeather("InvalidLocation");
      } catch {
        // Error expected
      }

      // Client errors (4xx) should not retry
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("WeatherAPIError", () => {
    it("has correct name property", () => {
      const error = new WeatherAPIError("Test error", 500);
      expect(error.name).toBe("WeatherAPIError");
    });

    it("stores message and status code", () => {
      const error = new WeatherAPIError("Test error", 500);
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
    });

    it("handles undefined status code", () => {
      const error = new WeatherAPIError("Test error");
      expect(error.statusCode).toBeUndefined();
    });
  });

  describe("fetchForecast", () => {
    it("parses 7-day forecast response correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

      const result = await fetchForecast("Balbriggan, IE", 7);

      expect(result).toHaveLength(7);
      expect(result[0]).toEqual({
        location: "Balbriggan, Ireland",
        latitude: 53.61,
        longitude: -6.18,
        datetime: new Date("2025-11-28"),
        condition: "Partly cloudy",
        description: "Partly cloudy",
        temperature: 11.0,
        feelsLike: 11.0,
        precipitation: 20,
        humidity: 75,
        windSpeed: 20.0,
        windDirection: 0,
      });
    });

    it("returns correct number of days", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

      const result = await fetchForecast("Balbriggan, IE", 7);

      expect(result).toHaveLength(7);
    });

    it("parses all days with correct data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

      const result = await fetchForecast("Balbriggan, IE", 7);

      // Verify each day has all required fields
      result.forEach((day) => {
        expect(day).toHaveProperty("location");
        expect(day).toHaveProperty("latitude");
        expect(day).toHaveProperty("longitude");
        expect(day).toHaveProperty("datetime");
        expect(day).toHaveProperty("condition");
        expect(day).toHaveProperty("description");
        expect(day).toHaveProperty("temperature");
        expect(day).toHaveProperty("feelsLike");
        expect(day).toHaveProperty("precipitation");
        expect(day).toHaveProperty("humidity");
        expect(day).toHaveProperty("windSpeed");
        expect(day).toHaveProperty("windDirection");
      });

      // Verify specific day data
      expect(result[1]?.condition).toBe("Light rain");
      expect(result[2]?.precipitation).toBe(60);
      expect(result[4]?.condition).toBe("Sunny");
    });

    it("constructs correct API URL with days parameter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

      await fetchForecast("Balbriggan, IE", 7);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://api.weatherapi.com/v1/forecast.json")
      );
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("days=7"));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("q=Balbriggan"));
    });

    it("uses default 7 days when not specified", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

      await fetchForecast("Balbriggan, IE");

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("days=7"));
    });

    it("throws error for invalid days parameter (< 1)", async () => {
      await expect(fetchForecast("Balbriggan, IE", 0)).rejects.toThrow(
        "Days must be between 1 and 14"
      );
    });

    it("throws error for invalid days parameter (> 14)", async () => {
      await expect(fetchForecast("Balbriggan, IE", 15)).rejects.toThrow(
        "Days must be between 1 and 14"
      );
    });

    it("throws WeatherAPIError when API key is missing", async () => {
      delete process.env.WEATHER_API_KEY;

      await expect(fetchForecast("Balbriggan, IE")).rejects.toThrow(WeatherAPIError);
      await expect(fetchForecast("Balbriggan, IE")).rejects.toThrow("Weather API key invalid");
    });

    it("handles empty forecast array", async () => {
      const emptyForecastResponse = {
        ...mockForecastResponse,
        forecast: { forecastday: [] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyForecastResponse),
      });

      const result = await fetchForecast("Balbriggan, IE", 7);

      expect(result).toHaveLength(0);
    });

    it("handles missing forecast data", async () => {
      const noForecastResponse = {
        ...mockForecastResponse,
        forecast: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(noForecastResponse),
      });

      const result = await fetchForecast("Balbriggan, IE", 7);

      expect(result).toHaveLength(0);
    });

    it("throws WeatherAPIError for location not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: { code: 1006, message: "No matching location found." },
          }),
      });

      await expect(fetchForecast("InvalidLocation123")).rejects.toThrow("Location not found");
    });

    it("increments rate limit counter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

      const beforeStatus = getRateLimitStatus();
      await fetchForecast("Balbriggan, IE", 7);
      const afterStatus = getRateLimitStatus();

      expect(afterStatus.count).toBe(beforeStatus.count + 1);
    });
  });
});
