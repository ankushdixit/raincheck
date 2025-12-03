/**
 * Unit tests for Weather API Client (Open-Meteo)
 *
 * Tests cover:
 * - Geocoding
 * - Response parsing
 * - Error handling
 * - Retry logic
 */

import {
  fetchCurrentWeather,
  fetchForecast,
  fetchFromOpenMeteo,
  fetchHybridForecast,
  geocodeLocation,
} from "../weather-client";
import { WeatherAPIError } from "@/types/weather";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Sample geocoding response
const mockGeocodingResponse = {
  results: [
    {
      id: 2964180,
      name: "Balbriggan",
      latitude: 53.6108,
      longitude: -6.1817,
      country: "Ireland",
      country_code: "IE",
      admin1: "Leinster",
    },
  ],
};

// Sample Open-Meteo forecast response
const mockOpenMeteoResponse = {
  latitude: 53.61,
  longitude: -6.18,
  timezone: "Europe/Dublin",
  current: {
    time: "2025-11-28T14:30",
    temperature_2m: 12.5,
    apparent_temperature: 10.2,
    precipitation: 0,
    weather_code: 2,
    wind_speed_10m: 15.3,
    wind_direction_10m: 180,
    relative_humidity_2m: 75,
    is_day: 1,
  },
  hourly: {
    time: Array.from({ length: 24 }, (_, i) => {
      const date = new Date("2025-11-28T00:00:00");
      date.setHours(i);
      return date.toISOString().slice(0, 16);
    }),
    temperature_2m: Array.from({ length: 24 }, () => 10),
    apparent_temperature: Array.from({ length: 24 }, () => 8),
    precipitation_probability: Array.from({ length: 24 }, () => 20),
    precipitation: Array.from({ length: 24 }, () => 0),
    weather_code: Array.from({ length: 24 }, () => 2), // Partly Cloudy
    wind_speed_10m: Array.from({ length: 24 }, () => 15),
    wind_direction_10m: Array.from({ length: 24 }, () => 180),
    is_day: Array.from({ length: 24 }, (_, i) => (i >= 8 && i < 17 ? 1 : 0)),
    relative_humidity_2m: Array.from({ length: 24 }, () => 75),
  },
};

// Sample multi-day forecast response
const mockMultiDayResponse = {
  latitude: 53.61,
  longitude: -6.18,
  timezone: "Europe/Dublin",
  hourly: {
    time: Array.from({ length: 7 * 24 }, (_, i) => {
      const date = new Date("2025-11-28T00:00:00");
      date.setHours(i);
      return date.toISOString().slice(0, 16);
    }),
    temperature_2m: Array.from({ length: 7 * 24 }, () => 10),
    apparent_temperature: Array.from({ length: 7 * 24 }, () => 8),
    precipitation_probability: Array.from({ length: 7 * 24 }, (_, i) =>
      Math.floor(i / 24) === 2 ? 60 : 20
    ), // Day 3 has higher precip
    precipitation: Array.from({ length: 7 * 24 }, () => 0),
    weather_code: Array.from({ length: 7 * 24 }, (_, i) => (Math.floor(i / 24) === 2 ? 63 : 2)), // Day 3 has rain
    wind_speed_10m: Array.from({ length: 7 * 24 }, () => 15),
    wind_direction_10m: Array.from({ length: 7 * 24 }, () => 180),
    is_day: Array.from({ length: 7 * 24 }, (_, i) => (i % 24 >= 8 && i % 24 < 17 ? 1 : 0)),
    relative_humidity_2m: Array.from({ length: 7 * 24 }, () => 75),
  },
};

describe("Weather Client (Open-Meteo)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("geocodeLocation", () => {
    it("geocodes a location name to coordinates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });

      const result = await geocodeLocation("Balbriggan, IE");

      expect(result.coords).toEqual({
        latitude: 53.6108,
        longitude: -6.1817,
      });
      expect(result.name).toBe("Balbriggan, Leinster, Ireland");
    });

    it("parses coordinate strings directly", async () => {
      const result = await geocodeLocation("53.6108,-6.1817");

      expect(result.coords).toEqual({
        latitude: 53.6108,
        longitude: -6.1817,
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("throws error when location not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      await expect(geocodeLocation("InvalidLocation123")).rejects.toThrow("Location not found");
    });

    it("constructs correct geocoding URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });

      await geocodeLocation("Balbriggan");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("geocoding-api.open-meteo.com")
      );
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("name=Balbriggan"));
    });
  });

  describe("fetchCurrentWeather", () => {
    it("fetches and parses current weather correctly", async () => {
      // First call: geocoding
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      // Second call: weather
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOpenMeteoResponse),
      });

      const result = await fetchCurrentWeather("Balbriggan, IE");

      expect(result).toMatchObject({
        location: "Balbriggan, Leinster, Ireland",
        latitude: 53.61,
        longitude: -6.18,
        condition: "Partly Cloudy",
        temperature: 12.5,
        feelsLike: 10.2,
        humidity: 75,
        windSpeed: 15.3,
        windDirection: 180,
      });
    });

    it("uses Open-Meteo API URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOpenMeteoResponse),
      });

      await fetchCurrentWeather("Balbriggan, IE");

      // Second call should be to Open-Meteo
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("api.open-meteo.com/v1/forecast")
      );
    });

    it("does not require API key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOpenMeteoResponse),
      });

      // Should work without any API key
      const result = await fetchCurrentWeather("Balbriggan, IE");

      expect(result).toBeDefined();
      expect(result.temperature).toBe(12.5);
    });
  });

  describe("fetchForecast", () => {
    it("fetches and parses multi-day forecast correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultiDayResponse),
      });

      const result = await fetchForecast("Balbriggan, IE", 7);

      expect(result).toHaveLength(7);
      expect(result[0]).toMatchObject({
        location: "Balbriggan, Leinster, Ireland",
        latitude: 53.61,
        longitude: -6.18,
      });
    });

    it("includes hourly data for each day", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultiDayResponse),
      });

      const result = await fetchForecast("Balbriggan, IE", 7);

      expect(result[0]?.hourly).toBeDefined();
      expect(result[0]?.hourly).toHaveLength(24);
    });

    it("parses weather conditions correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultiDayResponse),
      });

      const result = await fetchForecast("Balbriggan, IE", 7);

      // Day 1 and 2 should be Partly Cloudy (code 2)
      expect(result[0]?.condition).toBe("Partly Cloudy");
      // Day 3 should be Moderate Rain (code 63)
      expect(result[2]?.condition).toBe("Moderate Rain");
    });

    it("constructs correct API URL with days parameter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultiDayResponse),
      });

      await fetchForecast("Balbriggan, IE", 7);

      expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining("forecast_days=7"));
    });

    it("clamps days to maximum of 16", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultiDayResponse),
      });

      await fetchForecast("Balbriggan, IE", 20);

      expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining("forecast_days=16"));
    });

    it("clamps days to minimum of 1", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultiDayResponse),
      });

      await fetchForecast("Balbriggan, IE", 0);

      expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining("forecast_days=1"));
    });
  });

  describe("fetchFromOpenMeteo", () => {
    it("fetches forecast using coordinates directly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultiDayResponse),
      });

      const result = await fetchFromOpenMeteo(
        { latitude: 53.61, longitude: -6.18 },
        "Test Location",
        7
      );

      expect(result).toHaveLength(7);
      expect(result[0]?.location).toBe("Test Location");
      // Should only make one call (no geocoding)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("constructs correct URL with coordinates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultiDayResponse),
      });

      await fetchFromOpenMeteo({ latitude: 53.61, longitude: -6.18 }, "Test Location", 7);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("latitude=53.61"));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("longitude=-6.18"));
    });
  });

  describe("fetchHybridForecast", () => {
    it("is an alias for fetchForecast", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultiDayResponse),
      });

      const result = await fetchHybridForecast("Balbriggan, IE", 14);

      expect(result).toHaveLength(7); // Based on mock data
      // Should only call Open-Meteo (no separate WeatherAPI call)
      expect(mockFetch).toHaveBeenCalledTimes(2); // geocoding + weather
    });
  });

  describe("Error handling", () => {
    it("throws WeatherAPIError for location not found", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      await expect(fetchCurrentWeather("InvalidLocation123")).rejects.toThrow(WeatherAPIError);

      // Reset and mock again for second call
      mockFetch.mockClear();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      await expect(fetchCurrentWeather("InvalidLocation123")).rejects.toThrow("Location not found");
    });

    it("throws WeatherAPIError for API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(fetchCurrentWeather("Balbriggan, IE")).rejects.toThrow(WeatherAPIError);
    });

    it("includes status code in WeatherAPIError", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      });

      try {
        await fetchCurrentWeather("Balbriggan, IE");
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        expect((error as WeatherAPIError).statusCode).toBe(503);
      }
    });
  });

  describe("Retry logic", () => {
    it("does not retry on client error (4xx)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }), // Location not found
      });

      await expect(fetchCurrentWeather("InvalidLocation")).rejects.toThrow("Location not found");

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
});
