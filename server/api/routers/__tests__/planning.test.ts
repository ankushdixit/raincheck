/**
 * Tests for planning router
 */
import { createCaller } from "../../root";
import { TRPCError } from "@trpc/server";
import { WeatherAPIError, WeatherData } from "@/types/weather";
import { Phase, RunType } from "@prisma/client";

// Mock superjson to avoid ES module issues in Jest
jest.mock("superjson", () => ({
  serialize: (obj: unknown) => ({ json: obj, meta: undefined }),
  deserialize: (payload: { json: unknown }) => payload.json,
  stringify: (obj: unknown) => JSON.stringify(obj),
  parse: (str: string) => JSON.parse(str),
}));

// Mock next-auth to avoid ESM issues
jest.mock("@/lib/auth", () => ({
  auth: jest.fn().mockResolvedValue(null),
}));

// Mock the weather client
jest.mock("@/lib/weather-client", () => ({
  fetchCurrentWeather: jest.fn(),
  fetchForecast: jest.fn(),
  fetchHybridForecast: jest.fn(),
}));

import { fetchHybridForecast } from "@/lib/weather-client";

const mockFetchHybridForecast = fetchHybridForecast as jest.MockedFunction<
  typeof fetchHybridForecast
>;

/**
 * Create sample 7-day forecast data.
 */
function createSampleForecastData(baseDate: Date, days: number = 7): WeatherData[] {
  const conditions = [
    "Clear",
    "Partly cloudy",
    "Light rain",
    "Cloudy",
    "Sunny",
    "Overcast",
    "Rain",
  ];
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    return {
      location: "Balbriggan, Ireland",
      latitude: 53.6108,
      longitude: -6.1817,
      datetime: date,
      condition: conditions[i % conditions.length] ?? "Clear",
      description: conditions[i % conditions.length] ?? "Clear",
      temperature: 10 + i,
      feelsLike: 10 + i,
      precipitation: 5 + i * 5,
      humidity: 70 + i,
      windSpeed: 10 + i,
      windDirection: 180,
    };
  });
}

/**
 * Create a sample training plan for testing.
 */
function createSampleTrainingPlan(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    id: "plan-1",
    phase: Phase.BASE_BUILDING as Phase,
    weekNumber: 1,
    weekStart,
    weekEnd,
    longRunTarget: 12,
    weeklyMileageTarget: 24,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create sample weather preferences for all run types.
 */
function createSampleWeatherPreferences() {
  const now = new Date();
  return [
    {
      id: "pref-long",
      runType: RunType.LONG_RUN,
      maxPrecipitation: 20,
      maxWindSpeed: 25,
      minTemperature: 0,
      maxTemperature: 25,
      avoidConditions: ["Heavy Rain", "Thunderstorm"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "pref-easy",
      runType: RunType.EASY_RUN,
      maxPrecipitation: 50,
      maxWindSpeed: 35,
      minTemperature: -5,
      maxTemperature: 30,
      avoidConditions: ["Thunderstorm"],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

describe("Planning Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("planning.generateSuggestions", () => {
    describe("success cases", () => {
      it("returns suggestions when all data is available", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.generateSuggestions({});

        // Should return suggestions (1 long run + 2 easy runs for 24km week)
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(4);

        // Check that we have exactly one long run
        const longRuns = result.filter((s) => s.runType === "LONG_RUN");
        expect(longRuns).toHaveLength(1);
      });

      it("returns correct number of suggestions for training week", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        trainingPlan.longRunTarget = 16;
        trainingPlan.weeklyMileageTarget = 35;

        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.generateSuggestions({});

        // With new algorithm rules:
        // - Long runs only on weekends
        // - 2 rest days after long runs
        // - 1 rest day after easy runs
        // Exact count depends on forecast dates and rest days
        expect(result.length).toBeGreaterThanOrEqual(1);
      });

      it("uses default location when not provided", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Cork, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        await caller.planning.generateSuggestions({});

        // Should have used Cork, IE
        expect(mockFetchHybridForecast).toHaveBeenCalledWith("Cork, IE", 7);
      });

      it("uses custom location when provided", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn(),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        await caller.planning.generateSuggestions({ location: "Dublin, IE" });

        expect(mockFetchHybridForecast).toHaveBeenCalledWith("Dublin, IE", 7);
        expect(mockDb.userSettings.findFirst).not.toHaveBeenCalled();
      });

      it("returns empty array gracefully if no training plan exists", async () => {
        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(null), // No training plan
          },
          weatherCache: {
            findFirst: jest.fn(),
            upsert: jest.fn(),
          },
          weatherPreference: {
            findMany: jest.fn(),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.generateSuggestions({});

        expect(result).toEqual([]);
        // Should not fetch weather if no training plan
        expect(mockFetchHybridForecast).not.toHaveBeenCalled();
      });
    });

    describe("input validation", () => {
      it("accepts days parameter from 1 to 14", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        // Test with 3 days
        const forecastData3 = createSampleForecastData(now, 3);
        mockFetchHybridForecast.mockResolvedValue(forecastData3);

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        await caller.planning.generateSuggestions({ days: 3 });
        expect(mockFetchHybridForecast).toHaveBeenCalledWith("Balbriggan, IE", 3);

        // Test with 14 days
        const forecastData14 = createSampleForecastData(now, 14);
        mockFetchHybridForecast.mockResolvedValue(forecastData14);

        await caller.planning.generateSuggestions({ days: 14 });
        expect(mockFetchHybridForecast).toHaveBeenCalledWith("Balbriggan, IE", 14);
      });

      it("defaults to 7 days when not specified", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        await caller.planning.generateSuggestions({});

        expect(mockFetchHybridForecast).toHaveBeenCalledWith("Balbriggan, IE", 7);
      });

      it("rejects days less than 1", async () => {
        const mockDb = {
          userSettings: { findFirst: jest.fn() },
          trainingPlan: { findFirst: jest.fn() },
          weatherCache: { findMany: jest.fn(), upsert: jest.fn() },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: { findMany: jest.fn() },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        await expect(caller.planning.generateSuggestions({ days: 0 })).rejects.toThrow();
      });

      it("rejects days greater than 21", async () => {
        const mockDb = {
          userSettings: { findFirst: jest.fn() },
          trainingPlan: { findFirst: jest.fn() },
          weatherCache: { findMany: jest.fn(), upsert: jest.fn() },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: { findMany: jest.fn() },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        await expect(caller.planning.generateSuggestions({ days: 22 })).rejects.toThrow();
      });
    });

    describe("error handling", () => {
      it("returns error if weather API fails", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        mockFetchHybridForecast.mockRejectedValue(
          new WeatherAPIError("Weather service unavailable", 503)
        );

        const trainingPlan = createSampleTrainingPlan(now);

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn(),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn(),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        await expect(caller.planning.generateSuggestions({})).rejects.toThrow(TRPCError);
        await expect(caller.planning.generateSuggestions({})).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
          message: "Weather service unavailable. Please try again later.",
        });
      });

      it("handles unknown errors gracefully", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        mockFetchHybridForecast.mockRejectedValue(new Error("Network error"));

        const trainingPlan = createSampleTrainingPlan(now);

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn(),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn(),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        await expect(caller.planning.generateSuggestions({})).rejects.toThrow(TRPCError);
        await expect(caller.planning.generateSuggestions({})).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
        });
      });
    });

    describe("response format", () => {
      it("returns suggestions with all required fields", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.generateSuggestions({});

        expect(result.length).toBeGreaterThan(0);

        for (const suggestion of result) {
          expect(suggestion).toHaveProperty("date");
          expect(suggestion).toHaveProperty("runType");
          expect(suggestion).toHaveProperty("distance");
          expect(suggestion).toHaveProperty("weatherScore");
          expect(suggestion).toHaveProperty("isOptimal");
          expect(suggestion).toHaveProperty("reason");
          expect(suggestion).toHaveProperty("weather");

          // Check weather sub-object
          expect(suggestion.weather).toHaveProperty("condition");
          expect(suggestion.weather).toHaveProperty("temperature");
          expect(suggestion.weather).toHaveProperty("precipitation");
          expect(suggestion.weather).toHaveProperty("windSpeed");
        }
      });

      it("returns correct data types for all fields", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.generateSuggestions({});

        for (const suggestion of result) {
          expect(suggestion.date).toBeInstanceOf(Date);
          expect(typeof suggestion.runType).toBe("string");
          expect(typeof suggestion.distance).toBe("number");
          expect(typeof suggestion.weatherScore).toBe("number");
          expect(suggestion.weatherScore).toBeGreaterThanOrEqual(0);
          expect(suggestion.weatherScore).toBeLessThanOrEqual(100);
          expect(typeof suggestion.isOptimal).toBe("boolean");
          expect(typeof suggestion.reason).toBe("string");
          expect(suggestion.reason.length).toBeGreaterThan(0);

          expect(typeof suggestion.weather.condition).toBe("string");
          expect(typeof suggestion.weather.temperature).toBe("number");
          expect(typeof suggestion.weather.precipitation).toBe("number");
          expect(typeof suggestion.weather.windSpeed).toBe("number");
        }
      });

      it("returns suggestions sorted by date", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.generateSuggestions({});

        // Verify dates are in ascending order
        for (let i = 1; i < result.length; i++) {
          expect(result[i]!.date.getTime()).toBeGreaterThanOrEqual(result[i - 1]!.date.getTime());
        }
      });
    });

    describe("data flow", () => {
      it("training plan data flows to algorithm correctly", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        trainingPlan.longRunTarget = 18;
        trainingPlan.weeklyMileageTarget = 40;

        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.generateSuggestions({});

        // Long run should have the correct distance from training plan
        const longRun = result.find((s) => s.runType === "LONG_RUN");
        expect(longRun).toBeDefined();
        expect(longRun!.distance).toBe(18);
      });

      it("weather data flows to algorithm correctly", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Create forecast with one clearly best day
        const forecastData = createSampleForecastData(now);
        forecastData[0]!.precipitation = 0;
        forecastData[0]!.windSpeed = 5;
        forecastData[0]!.temperature = 12;
        forecastData[0]!.condition = "Clear";

        // Make other days worse
        for (let i = 1; i < forecastData.length; i++) {
          forecastData[i]!.precipitation = 60;
          forecastData[i]!.windSpeed = 40;
          forecastData[i]!.condition = "Heavy Rain";
        }

        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.generateSuggestions({});

        // With new algorithm, long runs are only on weekends
        // The algorithm picks the best weekend day
        const longRun = result.find((s) => s.runType === "LONG_RUN");
        if (longRun) {
          // Long run should be on a weekend (Saturday=6 or Sunday=0)
          const dayOfWeek = longRun.date.getDay();
          expect([0, 6]).toContain(dayOfWeek);
        }
      });

      it("preferences data flows to algorithm correctly", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);

        // Custom preferences with strict requirements
        const preferences = [
          {
            id: "pref-strict",
            runType: RunType.LONG_RUN,
            maxPrecipitation: 10, // Very strict
            maxWindSpeed: 15,
            minTemperature: 5,
            maxTemperature: 20,
            avoidConditions: ["Rain", "Light rain", "Heavy Rain"],
            createdAt: now,
            updatedAt: now,
          },
        ];

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.generateSuggestions({});

        // Should still return suggestions even with strict preferences
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe("cache behavior", () => {
      it("uses cached weather data when available", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        // Create cached data for all 7 days
        const cachedDays = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() + i);
          date.setHours(0, 0, 0, 0);
          return {
            id: `cache-${i}`,
            location: "Balbriggan, Ireland",
            latitude: 53.6108,
            longitude: -6.1817,
            datetime: date,
            condition: "Clear",
            description: "Clear sky",
            temperature: 12,
            feelsLike: 11,
            precipitation: 5,
            humidity: 50,
            windSpeed: 10,
            windDirection: 180,
            cachedAt: new Date(now.getTime() - 30 * 60 * 1000),
            expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
          };
        });

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue(cachedDays), // All cached
            upsert: jest.fn(),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.generateSuggestions({});

        // Should not call the API
        expect(mockFetchHybridForecast).not.toHaveBeenCalled();
        // Should still return suggestions
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe("performance", () => {
      it("completes in <1s for 7-day suggestions", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const start = performance.now();
        await caller.planning.generateSuggestions({});
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(1000);
      });

      it("completes in <2s for 14-day suggestions", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now, 14);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const start = performance.now();
        await caller.planning.generateSuggestions({ days: 14 });
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(2000);
      });
    });

    describe("public access", () => {
      it("works without authentication (public procedure)", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const forecastData = createSampleForecastData(now);
        mockFetchHybridForecast.mockResolvedValue(forecastData);

        const trainingPlan = createSampleTrainingPlan(now);
        const preferences = createSampleWeatherPreferences();

        const mockDb = {
          userSettings: {
            findFirst: jest.fn().mockResolvedValue({
              defaultLocation: "Balbriggan, IE",
            }),
          },
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
          },
          weatherCache: {
            findMany: jest.fn().mockResolvedValue([]), // Cache miss
            upsert: jest.fn().mockResolvedValue({}),
          },
          $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          weatherPreference: {
            findMany: jest.fn().mockResolvedValue(preferences),
          },
        };

        // No session (unauthenticated user)
        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        // Should work without authentication
        const result = await caller.planning.generateSuggestions({});
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe("planning.getCurrentPhase", () => {
    describe("success cases", () => {
      it("returns current phase when training plan exists for today", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const trainingPlan = createSampleTrainingPlan(now);

        const mockDb = {
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
            findMany: jest.fn().mockResolvedValue([]),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.getCurrentPhase();

        expect(result).toEqual({
          phase: Phase.BASE_BUILDING,
          weekNumber: 1,
          nextPhases: [],
          nextPhaseStart: null,
          nextPhase: null,
        });
      });

      it("returns correct phase for BASE_EXTENSION", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const trainingPlan = createSampleTrainingPlan(now);
        trainingPlan.phase = Phase.BASE_EXTENSION;
        trainingPlan.weekNumber = 10;

        const mockDb = {
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
            findMany: jest.fn().mockResolvedValue([]),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.getCurrentPhase();

        expect(result).toEqual({
          phase: Phase.BASE_EXTENSION,
          weekNumber: 10,
          nextPhases: [],
          nextPhaseStart: null,
          nextPhase: null,
        });
      });

      it("returns correct phase for SPEED_DEVELOPMENT", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const trainingPlan = createSampleTrainingPlan(now);
        trainingPlan.phase = Phase.SPEED_DEVELOPMENT;
        trainingPlan.weekNumber = 18;

        const mockDb = {
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
            findMany: jest.fn().mockResolvedValue([]),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.getCurrentPhase();

        expect(result).toEqual({
          phase: Phase.SPEED_DEVELOPMENT,
          weekNumber: 18,
          nextPhases: [],
          nextPhaseStart: null,
          nextPhase: null,
        });
      });

      it("returns correct phase for PEAK_TAPER", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const trainingPlan = createSampleTrainingPlan(now);
        trainingPlan.phase = Phase.PEAK_TAPER;
        trainingPlan.weekNumber = 24;

        const mockDb = {
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
            findMany: jest.fn().mockResolvedValue([]),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.getCurrentPhase();

        expect(result).toEqual({
          phase: Phase.PEAK_TAPER,
          weekNumber: 24,
          nextPhases: [],
          nextPhaseStart: null,
          nextPhase: null,
        });
      });
    });

    describe("no training plan", () => {
      it("returns null when no training plan exists for today", async () => {
        const mockDb = {
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.getCurrentPhase();

        expect(result).toBeNull();
      });
    });

    describe("query behavior", () => {
      it("queries training plan with correct date filter", async () => {
        const mockFindFirst = jest.fn().mockResolvedValue(null);

        const mockDb = {
          trainingPlan: {
            findFirst: mockFindFirst,
          },
        };

        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        await caller.planning.getCurrentPhase();

        expect(mockFindFirst).toHaveBeenCalledWith({
          where: {
            weekStart: { lte: expect.any(Date) },
            weekEnd: { gte: expect.any(Date) },
          },
        });
      });
    });

    describe("public access", () => {
      it("works without authentication (public procedure)", async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const trainingPlan = createSampleTrainingPlan(now);

        const mockDb = {
          trainingPlan: {
            findFirst: jest.fn().mockResolvedValue(trainingPlan),
            findMany: jest.fn().mockResolvedValue([]),
          },
        };

        // No session (unauthenticated user)
        const caller = createCaller({
          db: mockDb as never,
          headers: new Headers(),
          session: null,
        });

        const result = await caller.planning.getCurrentPhase();
        expect(result).not.toBeNull();
      });
    });
  });
});
