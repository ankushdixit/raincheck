/**
 * Tests for weather router
 */
import { createCaller } from "../../root";
import { TRPCError } from "@trpc/server";
import { WeatherAPIError, WeatherData } from "@/types/weather";

// Mock superjson to avoid ES module issues in Jest
jest.mock("superjson", () => ({
  serialize: (obj: unknown) => ({ json: obj, meta: undefined }),
  deserialize: (payload: { json: unknown }) => payload.json,
  stringify: (obj: unknown) => JSON.stringify(obj),
  parse: (str: string) => JSON.parse(str),
}));

// Mock the weather client
jest.mock("@/lib/weather-client", () => ({
  fetchCurrentWeather: jest.fn(),
}));

import { fetchCurrentWeather } from "@/lib/weather-client";

const mockFetchCurrentWeather = fetchCurrentWeather as jest.MockedFunction<
  typeof fetchCurrentWeather
>;

// Sample weather data for tests
const sampleWeatherData: WeatherData = {
  location: "Balbriggan, Ireland",
  latitude: 53.6108,
  longitude: -6.1817,
  datetime: new Date("2024-01-15T12:00:00Z"),
  condition: "Partly cloudy",
  description: "Partly cloudy",
  temperature: 12.5,
  feelsLike: 10.2,
  precipitation: 20,
  humidity: 75,
  windSpeed: 15.3,
  windDirection: 180,
};

// Sample cached data
const sampleCachedData = {
  id: "cache-1",
  location: "Balbriggan, Ireland",
  latitude: 53.6108,
  longitude: -6.1817,
  datetime: new Date("2024-01-15T12:00:00Z"),
  condition: "Partly cloudy",
  description: "Partly cloudy",
  temperature: 12.5,
  feelsLike: 10.2,
  precipitation: 20,
  humidity: 75,
  windSpeed: 15.3,
  windDirection: 180,
  cachedAt: new Date("2024-01-15T11:30:00Z"),
  expiresAt: new Date("2024-01-15T12:30:00Z"), // Valid cache
};

describe("Weather Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("weather.getCurrentWeather", () => {
    describe("cache behavior", () => {
      it("returns cached data when cache hit (unexpired)", async () => {
        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(sampleCachedData),
            upsert: jest.fn(),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        const result = await caller.weather.getCurrentWeather({});

        expect(result.location).toBe("Balbriggan, Ireland");
        expect(result.temperature).toBe(12.5);
        expect(mockDb.weatherCache.findFirst).toHaveBeenCalled();
        expect(mockFetchCurrentWeather).not.toHaveBeenCalled();
        expect(mockDb.weatherCache.upsert).not.toHaveBeenCalled();
      });

      it("fetches from API and caches on cache miss", async () => {
        mockFetchCurrentWeather.mockResolvedValue(sampleWeatherData);

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        const result = await caller.weather.getCurrentWeather({});

        expect(result.location).toBe("Balbriggan, Ireland");
        expect(mockFetchCurrentWeather).toHaveBeenCalledWith("Balbriggan, IE");
        expect(mockDb.weatherCache.upsert).toHaveBeenCalled();
      });

      it("calculates TTL correctly (1 hour from now)", async () => {
        mockFetchCurrentWeather.mockResolvedValue(sampleWeatherData);

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockResolvedValue({}),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        const beforeCall = Date.now();
        await caller.weather.getCurrentWeather({});
        const afterCall = Date.now();

        // Verify upsert was called with correct expiresAt
        const upsertCall = mockDb.weatherCache.upsert.mock.calls[0][0];
        const expiresAt = upsertCall.create.expiresAt as Date;
        const cachedAt = upsertCall.create.cachedAt as Date;

        // expiresAt should be approximately 1 hour after cachedAt
        const ttlMs = expiresAt.getTime() - cachedAt.getTime();
        expect(ttlMs).toBe(60 * 60 * 1000); // 1 hour in ms

        // expiresAt should be within the test execution window + 1 hour
        expect(expiresAt.getTime()).toBeGreaterThanOrEqual(beforeCall + 60 * 60 * 1000);
        expect(expiresAt.getTime()).toBeLessThanOrEqual(afterCall + 60 * 60 * 1000);
      });
    });

    describe("location handling", () => {
      it("uses provided location when specified", async () => {
        mockFetchCurrentWeather.mockResolvedValue(sampleWeatherData);

        const mockDb = {
          userSettings: {
            findFirst: jest.fn(),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockResolvedValue({}),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        await caller.weather.getCurrentWeather({ location: "Dublin, IE" });

        expect(mockFetchCurrentWeather).toHaveBeenCalledWith("Dublin, IE");
        expect(mockDb.userSettings.findFirst).not.toHaveBeenCalled();
      });

      it("uses default location from UserSettings when not provided", async () => {
        mockFetchCurrentWeather.mockResolvedValue(sampleWeatherData);

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Cork, IE",
            }),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockResolvedValue({}),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        await caller.weather.getCurrentWeather({});

        expect(mockFetchCurrentWeather).toHaveBeenCalledWith("Cork, IE");
      });

      it("uses fallback location when no UserSettings exist", async () => {
        mockFetchCurrentWeather.mockResolvedValue(sampleWeatherData);

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockResolvedValue({}),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        await caller.weather.getCurrentWeather({});

        expect(mockFetchCurrentWeather).toHaveBeenCalledWith("Balbriggan, IE");
      });
    });

    describe("error handling", () => {
      it("throws UNAUTHORIZED for invalid API key", async () => {
        mockFetchCurrentWeather.mockRejectedValue(
          new WeatherAPIError("Weather API key invalid", 401)
        );

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        await expect(caller.weather.getCurrentWeather({})).rejects.toThrow(TRPCError);
        await expect(caller.weather.getCurrentWeather({})).rejects.toMatchObject({
          code: "UNAUTHORIZED",
          message: "Weather API key invalid",
        });
      });

      it("throws BAD_REQUEST for location not found", async () => {
        mockFetchCurrentWeather.mockRejectedValue(new WeatherAPIError("Location not found", 400));

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        await expect(caller.weather.getCurrentWeather({})).rejects.toThrow(TRPCError);
        await expect(caller.weather.getCurrentWeather({})).rejects.toMatchObject({
          code: "BAD_REQUEST",
          message: "Location not found",
        });
      });

      it("throws TOO_MANY_REQUESTS for rate limit exceeded", async () => {
        mockFetchCurrentWeather.mockRejectedValue(
          new WeatherAPIError("Daily rate limit exceeded", 429)
        );

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        await expect(caller.weather.getCurrentWeather({})).rejects.toThrow(TRPCError);
        await expect(caller.weather.getCurrentWeather({})).rejects.toMatchObject({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded",
        });
      });

      it("throws INTERNAL_SERVER_ERROR for service unavailable", async () => {
        mockFetchCurrentWeather.mockRejectedValue(
          new WeatherAPIError("Weather service unavailable", 503)
        );

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        await expect(caller.weather.getCurrentWeather({})).rejects.toThrow(TRPCError);
        await expect(caller.weather.getCurrentWeather({})).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
          message: "Weather service unavailable",
        });
      });

      it("throws INTERNAL_SERVER_ERROR for unknown errors", async () => {
        mockFetchCurrentWeather.mockRejectedValue(new Error("Network error"));

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        await expect(caller.weather.getCurrentWeather({})).rejects.toThrow(TRPCError);
        await expect(caller.weather.getCurrentWeather({})).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
          message: "Weather service unavailable",
        });
      });
    });

    describe("response format", () => {
      it("returns weather data with all required fields", async () => {
        mockFetchCurrentWeather.mockResolvedValue(sampleWeatherData);

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockResolvedValue({}),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        const result = await caller.weather.getCurrentWeather({});

        expect(result).toHaveProperty("location");
        expect(result).toHaveProperty("latitude");
        expect(result).toHaveProperty("longitude");
        expect(result).toHaveProperty("datetime");
        expect(result).toHaveProperty("condition");
        expect(result).toHaveProperty("description");
        expect(result).toHaveProperty("temperature");
        expect(result).toHaveProperty("feelsLike");
        expect(result).toHaveProperty("precipitation");
        expect(result).toHaveProperty("humidity");
        expect(result).toHaveProperty("windSpeed");
        expect(result).toHaveProperty("windDirection");
      });

      it("returns correct data types for all fields", async () => {
        mockFetchCurrentWeather.mockResolvedValue(sampleWeatherData);

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          weatherCache: {
            findFirst: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockResolvedValue({}),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
        });

        const result = await caller.weather.getCurrentWeather({});

        expect(typeof result.location).toBe("string");
        expect(typeof result.latitude).toBe("number");
        expect(typeof result.longitude).toBe("number");
        expect(result.datetime).toBeInstanceOf(Date);
        expect(typeof result.condition).toBe("string");
        expect(typeof result.description).toBe("string");
        expect(typeof result.temperature).toBe("number");
        expect(typeof result.feelsLike).toBe("number");
        expect(typeof result.precipitation).toBe("number");
        expect(typeof result.humidity).toBe("number");
        expect(typeof result.windSpeed).toBe("number");
        expect(typeof result.windDirection).toBe("number");
      });
    });
  });
});
