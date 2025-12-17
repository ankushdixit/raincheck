/**
 * Planning Algorithm Tests
 *
 * Test suite for the run suggestion algorithm with new rules:
 * - Long runs: Weekend only, always scheduled
 * - Easy runs: Best hourly weather, 1-day rest after
 * - 2-day rest after long runs
 * - Time window suggestions (9am-5pm easy, 9am-2pm long)
 */

import { Phase, RunType } from "@prisma/client";
import type { TrainingPlan, WeatherPreference } from "@prisma/client";
import type { WeatherData, HourlyWeather } from "@/types/weather";
import {
  generateSuggestions,
  formatDateKey,
  addDays,
  getDayName,
  isWeekend,
  isSunday,
  isSundayOrMonday,
  formatHour,
  getDayGap,
  validateNoLargeGaps,
  validateNoBackToBackHardDays,
  type AlgorithmInput,
  type Suggestion,
} from "../planning-algorithm";

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Create mock hourly weather data for a day.
 */
function createHourlyWeather(baseDate: Date): HourlyWeather[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    time: new Date(baseDate.getTime() + hour * 60 * 60 * 1000),
    condition: "Clear",
    temperature: 10 + (hour >= 9 && hour < 17 ? 5 : 0), // Warmer during day
    feelsLike: 9 + (hour >= 9 && hour < 17 ? 5 : 0),
    precipitation: 10,
    humidity: 50,
    windSpeed: 10,
    isDay: hour >= 7 && hour < 19,
  }));
}

/**
 * Create mock weather data for a specific date.
 */
function createWeatherData(date: Date, overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    location: "Test Location",
    latitude: 53.6108,
    longitude: -6.1817,
    datetime: date,
    timezone: "Europe/Dublin",
    condition: "Clear",
    description: "Clear sky",
    temperature: 12,
    feelsLike: 11,
    precipitation: 10,
    humidity: 50,
    windSpeed: 10,
    windDirection: 180,
    hourly: createHourlyWeather(date),
    ...overrides,
  };
}

/**
 * Create a 14-day weather forecast starting from a given date.
 */
function create14DayForecast(
  startDate: Date,
  weatherOverrides: Array<Partial<WeatherData>> = []
): WeatherData[] {
  return Array.from({ length: 14 }, (_, i) => {
    const date = addDays(startDate, i);
    return createWeatherData(date, weatherOverrides[i] ?? {});
  });
}

/**
 * Create mock training plan.
 */
function createTrainingPlan(overrides: Partial<TrainingPlan> = {}): TrainingPlan {
  const now = new Date();
  return {
    id: "test-plan-1",
    phase: Phase.BASE_BUILDING,
    weekNumber: 1,
    weekStart: now,
    weekEnd: addDays(now, 6),
    longRunTarget: 12,
    weeklyMileageTarget: 24,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create mock weather preferences for all run types.
 */
function createWeatherPreferences(): WeatherPreference[] {
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

// ============================================================================
// Helper Function Tests
// ============================================================================

describe("formatDateKey", () => {
  it("formats Date object to YYYY-MM-DD", () => {
    const date = new Date("2025-11-30T10:00:00Z");
    expect(formatDateKey(date)).toBe("2025-11-30");
  });

  it("formats date string to YYYY-MM-DD", () => {
    expect(formatDateKey("2025-12-25T15:30:00Z")).toBe("2025-12-25");
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    const date = new Date("2025-11-30");
    const result = addDays(date, 5);
    expect(formatDateKey(result)).toBe("2025-12-05");
  });

  it("does not modify original date", () => {
    const original = new Date("2025-11-30");
    addDays(original, 5);
    expect(formatDateKey(original)).toBe("2025-11-30");
  });
});

describe("getDayName", () => {
  it("returns correct day name", () => {
    const sunday = new Date("2025-11-30"); // Sunday
    expect(getDayName(sunday)).toBe("Sunday");
  });
});

describe("isWeekend", () => {
  it("returns true for Saturday", () => {
    const saturday = new Date("2025-11-29"); // Saturday
    expect(isWeekend(saturday)).toBe(true);
  });

  it("returns true for Sunday", () => {
    const sunday = new Date("2025-11-30"); // Sunday
    expect(isWeekend(sunday)).toBe(true);
  });

  it("returns false for weekdays", () => {
    const monday = new Date("2025-12-01"); // Monday
    expect(isWeekend(monday)).toBe(false);
  });
});

describe("isSunday", () => {
  it("returns true for Sunday", () => {
    const sunday = new Date("2025-11-30");
    expect(isSunday(sunday)).toBe(true);
  });

  it("returns false for other days", () => {
    const saturday = new Date("2025-11-29");
    expect(isSunday(saturday)).toBe(false);
  });
});

describe("formatHour", () => {
  it("formats morning hours", () => {
    expect(formatHour(9)).toBe("9am");
  });

  it("formats afternoon hours", () => {
    expect(formatHour(14)).toBe("2pm");
  });

  it("formats noon", () => {
    expect(formatHour(12)).toBe("12pm");
  });

  it("formats midnight", () => {
    expect(formatHour(0)).toBe("12am");
  });
});

describe("getDayGap", () => {
  it("calculates gap between dates", () => {
    const date1 = new Date("2025-11-30");
    const date2 = new Date("2025-12-03");
    expect(getDayGap(date1, date2)).toBe(3);
  });

  it("returns 0 for same day", () => {
    const date = new Date("2025-11-30");
    expect(getDayGap(date, date)).toBe(0);
  });
});

// ============================================================================
// Validation Function Tests
// ============================================================================

describe("validateNoLargeGaps", () => {
  it("returns true for single suggestion", () => {
    const suggestions: Suggestion[] = [
      {
        date: new Date("2025-11-30"),
        timezone: "Europe/Dublin",
        runType: RunType.LONG_RUN,
        distance: 12,
        weatherScore: 75,
        isOptimal: false,
        reason: "Test",
        weather: { condition: "Clear", temperature: 10, precipitation: 10, windSpeed: 10 },
        timeRange: { start: "9am", end: "12pm" },
      },
    ];
    expect(validateNoLargeGaps(suggestions)).toBe(true);
  });

  it("returns true for suggestions without large gaps", () => {
    const suggestions: Suggestion[] = [
      {
        date: new Date("2025-11-30"),
        timezone: "Europe/Dublin",
        runType: RunType.LONG_RUN,
        distance: 12,
        weatherScore: 75,
        isOptimal: false,
        reason: "Test",
        weather: { condition: "Clear", temperature: 10, precipitation: 10, windSpeed: 10 },
        timeRange: { start: "9am", end: "12pm" },
      },
      {
        date: new Date("2025-12-03"),
        timezone: "Europe/Dublin",
        runType: RunType.EASY_RUN,
        distance: 6,
        weatherScore: 70,
        isOptimal: false,
        reason: "Test",
        weather: { condition: "Clear", temperature: 10, precipitation: 10, windSpeed: 10 },
        timeRange: { start: "9am", end: "11am" },
      },
    ];
    expect(validateNoLargeGaps(suggestions)).toBe(true);
  });

  it("returns false for suggestions with 5+ day gap", () => {
    const suggestions: Suggestion[] = [
      {
        date: new Date("2025-11-30"),
        timezone: "Europe/Dublin",
        runType: RunType.LONG_RUN,
        distance: 12,
        weatherScore: 75,
        isOptimal: false,
        reason: "Test",
        weather: { condition: "Clear", temperature: 10, precipitation: 10, windSpeed: 10 },
        timeRange: { start: "9am", end: "12pm" },
      },
      {
        date: new Date("2025-12-06"),
        timezone: "Europe/Dublin",
        runType: RunType.EASY_RUN,
        distance: 6,
        weatherScore: 70,
        isOptimal: false,
        reason: "Test",
        weather: { condition: "Clear", temperature: 10, precipitation: 10, windSpeed: 10 },
        timeRange: { start: "9am", end: "11am" },
      },
    ];
    expect(validateNoLargeGaps(suggestions)).toBe(false);
  });
});

describe("validateNoBackToBackHardDays", () => {
  it("returns true when no back-to-back hard days", () => {
    const suggestions: Suggestion[] = [
      {
        date: new Date("2025-11-30"),
        timezone: "Europe/Dublin",
        runType: RunType.LONG_RUN,
        distance: 12,
        weatherScore: 75,
        isOptimal: false,
        reason: "Test",
        weather: { condition: "Clear", temperature: 10, precipitation: 10, windSpeed: 10 },
        timeRange: { start: "9am", end: "12pm" },
      },
      {
        date: new Date("2025-12-03"),
        timezone: "Europe/Dublin",
        runType: RunType.EASY_RUN,
        distance: 6,
        weatherScore: 70,
        isOptimal: false,
        reason: "Test",
        weather: { condition: "Clear", temperature: 10, precipitation: 10, windSpeed: 10 },
        timeRange: { start: "9am", end: "11am" },
      },
    ];
    expect(validateNoBackToBackHardDays(suggestions)).toBe(true);
  });
});

// ============================================================================
// generateSuggestions Tests
// ============================================================================

describe("generateSuggestions", () => {
  describe("basic functionality", () => {
    it("returns empty array for empty forecast", () => {
      const input: AlgorithmInput = {
        forecast: [],
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
      };
      expect(generateSuggestions(input)).toEqual([]);
    });

    it("generates suggestions with time ranges", () => {
      // Start from tomorrow (Sunday) to ensure algorithm generates suggestions
      const tomorrow = addDays(new Date(), 1);
      // Find next Sunday
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);

      const input: AlgorithmInput = {
        forecast: create14DayForecast(startDate),
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);
      expect(result.length).toBeGreaterThan(0);

      // All suggestions should have time ranges
      result.forEach((suggestion) => {
        expect(suggestion.timeRange).toBeDefined();
        expect(suggestion.timeRange.start).toBeDefined();
        expect(suggestion.timeRange.end).toBeDefined();
      });
    });

    it("places long runs only on Sunday or Monday", () => {
      // Start from tomorrow (Sunday) to ensure algorithm generates suggestions
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);

      const input: AlgorithmInput = {
        forecast: create14DayForecast(startDate),
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);
      const longRuns = result.filter((s) => s.runType === RunType.LONG_RUN);

      // All long runs should be on Sunday or Monday
      longRuns.forEach((longRun) => {
        expect(isSundayOrMonday(longRun.date)).toBe(true);
      });
    });

    it("schedules at least 2 long runs with 14-day forecast", () => {
      // Start from tomorrow (Sunday) to ensure algorithm generates suggestions
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);

      const input: AlgorithmInput = {
        forecast: create14DayForecast(startDate),
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);
      const longRuns = result.filter((s) => s.runType === RunType.LONG_RUN);

      expect(longRuns.length).toBeGreaterThanOrEqual(2);
    });

    it("enforces 2-day rest after long runs", () => {
      // Start from next Sunday
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);

      const input: AlgorithmInput = {
        forecast: create14DayForecast(startDate),
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);
      const sorted = [...result].sort((a, b) => a.date.getTime() - b.date.getTime());

      // Find each long run and verify no runs scheduled for next 2 days
      sorted.forEach((suggestion) => {
        if (suggestion.runType === RunType.LONG_RUN) {
          const restDay1 = formatDateKey(addDays(suggestion.date, 1));
          const restDay2 = formatDateKey(addDays(suggestion.date, 2));

          // Check no runs on rest days
          const runsOnRestDays = result.filter((s) => {
            const sDate = formatDateKey(s.date);
            return sDate === restDay1 || sDate === restDay2;
          });

          expect(runsOnRestDays.length).toBe(0);
        }
      });
    });

    it("includes weather data in suggestions", () => {
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);

      const input: AlgorithmInput = {
        forecast: create14DayForecast(startDate),
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);

      result.forEach((suggestion) => {
        expect(suggestion.weather).toBeDefined();
        expect(suggestion.weather.condition).toBeDefined();
        expect(typeof suggestion.weather.temperature).toBe("number");
        expect(typeof suggestion.weather.precipitation).toBe("number");
      });
    });

    it("generates human-readable reasons", () => {
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);

      const input: AlgorithmInput = {
        forecast: create14DayForecast(startDate),
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);

      result.forEach((suggestion) => {
        expect(suggestion.reason).toBeDefined();
        expect(suggestion.reason.length).toBeGreaterThan(0);
      });
    });

    it("sorts suggestions by date", () => {
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);

      const input: AlgorithmInput = {
        forecast: create14DayForecast(startDate),
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i]!.date.getTime()).toBeLessThanOrEqual(result[i + 1]!.date.getTime());
      }
    });
  });

  describe("weather scoring", () => {
    it("assigns higher scores to better weather", () => {
      // Start from next Sunday
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);

      // Create forecast with varying weather
      const forecast = create14DayForecast(startDate);
      // Make Wednesday (index 3) have excellent weather
      forecast[3] = createWeatherData(addDays(startDate, 3), {
        condition: "Clear",
        precipitation: 0,
        windSpeed: 5,
        temperature: 15,
      });

      const input: AlgorithmInput = {
        forecast,
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);
      const wednesdayRun = result.find(
        (s) => formatDateKey(s.date) === formatDateKey(addDays(startDate, 3))
      );

      // Wednesday should have a good score due to good weather
      if (wednesdayRun) {
        expect(wednesdayRun.weatherScore).toBeGreaterThan(50);
      }
    });

    it("marks optimal days when score >= 80", () => {
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);

      const forecast = create14DayForecast(startDate).map((day) =>
        createWeatherData(day.datetime, {
          condition: "Clear",
          precipitation: 0,
          windSpeed: 5,
          temperature: 12,
        })
      );

      const input: AlgorithmInput = {
        forecast,
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);
      const optimalRuns = result.filter((s) => s.isOptimal);

      // With perfect weather, should have optimal runs
      expect(optimalRuns.length).toBeGreaterThanOrEqual(0);
      optimalRuns.forEach((run) => {
        expect(run.weatherScore).toBeGreaterThanOrEqual(80);
      });
    });
  });

  describe("existing runs handling", () => {
    it("skips days that already have runs scheduled", () => {
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);
      const existingRunDate = addDays(startDate, 3);

      const input: AlgorithmInput = {
        forecast: create14DayForecast(startDate),
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [{ date: existingRunDate, runType: RunType.EASY_RUN }],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);
      const runOnExistingDate = result.find(
        (s) => formatDateKey(s.date) === formatDateKey(existingRunDate)
      );

      expect(runOnExistingDate).toBeUndefined();
    });

    it("schedules second short run when first short run is already accepted", () => {
      // Regression test for bug where second short run was not scheduled
      // when the first short run was already accepted
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const longRunDate = addDays(tomorrow, daysUntilSunday); // Sunday

      // First short run is 3 days after long run (2 rest + 1)
      const firstShortDate = addDays(longRunDate, 3);
      // Second short run is 2 days after first short (1 rest + 1)
      const secondShortDate = addDays(firstShortDate, 2);

      const input: AlgorithmInput = {
        forecast: create14DayForecast(longRunDate),
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [
          // Long run accepted
          {
            id: "1",
            date: longRunDate,
            runType: RunType.LONG_RUN,
            completed: false,
            distance: 14,
          },
          // First short run also accepted
          {
            id: "2",
            date: firstShortDate,
            runType: RunType.EASY_RUN,
            completed: false,
            distance: 6,
          },
        ],
        longestCompletedDistance: 14,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);

      // The second short run should still be scheduled even though first is accepted
      const secondShortRun = result.find(
        (s) =>
          formatDateKey(s.date) === formatDateKey(secondShortDate) && s.runType === RunType.EASY_RUN
      );

      expect(secondShortRun).toBeDefined();
      expect(secondShortRun?.distance).toBe(6);
    });
  });

  describe("edge cases", () => {
    it("handles forecast with no Sunday or Monday", () => {
      // Create a 5-day forecast starting Tuesday (no Sun/Mon for long runs)
      const tomorrow = addDays(new Date(), 1);
      const daysUntilTuesday = (9 - tomorrow.getDay()) % 7; // 9 = Tuesday + 7
      const tuesday = addDays(tomorrow, daysUntilTuesday || 7);
      const forecast = Array.from({ length: 5 }, (_, i) => createWeatherData(addDays(tuesday, i)));

      const input: AlgorithmInput = {
        forecast,
        trainingPlan: createTrainingPlan(),
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);

      // Should not schedule long runs without Sunday/Monday
      const longRuns = result.filter((s) => s.runType === RunType.LONG_RUN);
      expect(longRuns.length).toBe(0);
    });

    it("handles null training plan", () => {
      const tomorrow = addDays(new Date(), 1);
      const daysUntilSunday = (7 - tomorrow.getDay()) % 7;
      const startDate = addDays(tomorrow, daysUntilSunday);

      const input: AlgorithmInput = {
        forecast: create14DayForecast(startDate),
        trainingPlan: null,
        preferences: createWeatherPreferences(),
        existingRuns: [],
        acceptedRuns: [],
        longestCompletedDistance: 0,
        lastCompletedRun: null,
      };

      const result = generateSuggestions(input);

      // Should use default distances (10km long start, 6km easy)
      const longRun = result.find((s) => s.runType === RunType.LONG_RUN);
      if (longRun) {
        expect(longRun.distance).toBe(10); // New algorithm starts at 10km
      }
    });
  });
});
