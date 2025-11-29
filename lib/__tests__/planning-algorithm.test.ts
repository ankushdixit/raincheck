/**
 * Planning Algorithm Tests
 *
 * Comprehensive test suite for the run suggestion algorithm.
 * Target: 90%+ coverage
 *
 * Test categories:
 * - Unit tests for helper functions
 * - Integration tests for generateSuggestions
 * - Edge case handling
 * - Constraint validation
 * - Performance tests
 * - Reasoning generation tests
 */

import { Phase, RunType } from "@prisma/client";
import type { TrainingPlan, WeatherPreference } from "@prisma/client";
import type { WeatherData } from "@/types/weather";
import {
  generateSuggestions,
  formatDateKey,
  addDays,
  getDayName,
  getPreferenceForRunType,
  getRunsNeeded,
  scoreForecastDays,
  findBestLongRunDay,
  findEasyRunDays,
  generateReason,
  isWeekend,
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
 * Create mock weather data for a specific date.
 */
function createWeatherData(date: Date, overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    location: "Test Location",
    latitude: 53.6108,
    longitude: -6.1817,
    datetime: date,
    condition: "Clear",
    description: "Clear sky",
    temperature: 12,
    feelsLike: 11,
    precipitation: 10,
    humidity: 50,
    windSpeed: 10,
    windDirection: 180,
    ...overrides,
  };
}

/**
 * Create a 7-day weather forecast starting from a given date.
 */
function create7DayForecast(
  startDate: Date,
  weatherOverrides: Array<Partial<WeatherData>> = []
): WeatherData[] {
  return Array.from({ length: 7 }, (_, i) => {
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
    {
      id: "pref-tempo",
      runType: RunType.TEMPO_RUN,
      maxPrecipitation: 30,
      maxWindSpeed: 25,
      minTemperature: 5,
      maxTemperature: 25,
      avoidConditions: ["Heavy Rain", "Thunderstorm"],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Create a complete algorithm input with defaults.
 */
function createAlgorithmInput(overrides: Partial<AlgorithmInput> = {}): AlgorithmInput {
  const startDate = new Date("2025-12-01T00:00:00Z");
  return {
    forecast: create7DayForecast(startDate),
    trainingPlan: createTrainingPlan(),
    preferences: createWeatherPreferences(),
    existingRuns: [],
    ...overrides,
  };
}

// ============================================================================
// Helper Function Tests
// ============================================================================

describe("formatDateKey", () => {
  it("formats a Date object as YYYY-MM-DD", () => {
    const date = new Date("2025-12-15T10:30:00Z");
    expect(formatDateKey(date)).toBe("2025-12-15");
  });

  it("formats a date string as YYYY-MM-DD", () => {
    expect(formatDateKey("2025-12-15T10:30:00Z")).toBe("2025-12-15");
  });

  it("handles different timezones consistently", () => {
    const date1 = new Date("2025-12-15T00:00:00Z");
    const date2 = new Date("2025-12-15T23:59:59Z");
    expect(formatDateKey(date1)).toBe("2025-12-15");
    expect(formatDateKey(date2)).toBe("2025-12-15");
  });
});

describe("addDays", () => {
  it("adds positive days correctly", () => {
    const date = new Date("2025-12-01T00:00:00Z");
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(6);
  });

  it("handles month boundaries", () => {
    const date = new Date("2025-12-30T00:00:00Z");
    const result = addDays(date, 5);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getFullYear()).toBe(2026);
  });

  it("does not modify the original date", () => {
    const date = new Date("2025-12-01T00:00:00Z");
    const originalTime = date.getTime();
    addDays(date, 5);
    expect(date.getTime()).toBe(originalTime);
  });

  it("handles negative days", () => {
    const date = new Date("2025-12-10T00:00:00Z");
    const result = addDays(date, -5);
    expect(result.getDate()).toBe(5);
  });
});

describe("getDayName", () => {
  it("returns correct day names", () => {
    // December 1, 2025 is a Monday
    const monday = new Date("2025-12-01T00:00:00Z");
    expect(getDayName(monday)).toBe("Monday");

    const sunday = new Date("2025-11-30T00:00:00Z");
    expect(getDayName(sunday)).toBe("Sunday");

    const saturday = new Date("2025-12-06T00:00:00Z");
    expect(getDayName(saturday)).toBe("Saturday");
  });
});

describe("isWeekend", () => {
  it("returns true for Saturday", () => {
    const saturday = new Date("2025-12-06T00:00:00Z");
    expect(isWeekend(saturday)).toBe(true);
  });

  it("returns true for Sunday", () => {
    const sunday = new Date("2025-12-07T00:00:00Z");
    expect(isWeekend(sunday)).toBe(true);
  });

  it("returns false for weekdays", () => {
    const monday = new Date("2025-12-01T00:00:00Z");
    const wednesday = new Date("2025-12-03T00:00:00Z");
    const friday = new Date("2025-12-05T00:00:00Z");
    expect(isWeekend(monday)).toBe(false);
    expect(isWeekend(wednesday)).toBe(false);
    expect(isWeekend(friday)).toBe(false);
  });
});

describe("getDayGap", () => {
  it("calculates gap between consecutive days", () => {
    const date1 = new Date("2025-12-01T00:00:00Z");
    const date2 = new Date("2025-12-02T00:00:00Z");
    expect(getDayGap(date1, date2)).toBe(1);
  });

  it("calculates gap for non-consecutive days", () => {
    const date1 = new Date("2025-12-01T00:00:00Z");
    const date2 = new Date("2025-12-08T00:00:00Z");
    expect(getDayGap(date1, date2)).toBe(7);
  });

  it("works regardless of order", () => {
    const date1 = new Date("2025-12-01T00:00:00Z");
    const date2 = new Date("2025-12-05T00:00:00Z");
    expect(getDayGap(date1, date2)).toBe(4);
    expect(getDayGap(date2, date1)).toBe(4);
  });
});

describe("getPreferenceForRunType", () => {
  const preferences = createWeatherPreferences();

  it("returns the correct preference for LONG_RUN", () => {
    const pref = getPreferenceForRunType(preferences, RunType.LONG_RUN);
    expect(pref?.runType).toBe(RunType.LONG_RUN);
    expect(pref?.maxPrecipitation).toBe(20);
  });

  it("returns the correct preference for EASY_RUN", () => {
    const pref = getPreferenceForRunType(preferences, RunType.EASY_RUN);
    expect(pref?.runType).toBe(RunType.EASY_RUN);
    expect(pref?.maxPrecipitation).toBe(50);
  });

  it("returns undefined for missing run type", () => {
    const pref = getPreferenceForRunType(preferences, RunType.RACE);
    expect(pref).toBeUndefined();
  });
});

describe("getRunsNeeded", () => {
  it("returns correct values for training plan", () => {
    const plan = createTrainingPlan({
      longRunTarget: 16,
      weeklyMileageTarget: 35,
    });
    const result = getRunsNeeded(plan);

    expect(result.longRunDistance).toBe(16);
    // Remaining mileage: 35 - 16 = 19km, which is > 15, so 3 easy runs
    expect(result.totalEasyRuns).toBe(3);
    expect(result.easyRunDistance).toBeCloseTo(6.3, 1);
  });

  it("returns 2 easy runs for lower mileage weeks", () => {
    const plan = createTrainingPlan({
      longRunTarget: 12,
      weeklyMileageTarget: 24,
    });
    const result = getRunsNeeded(plan);

    expect(result.longRunDistance).toBe(12);
    expect(result.totalEasyRuns).toBe(2);
    expect(result.easyRunDistance).toBe(6);
  });

  it("returns default values when no training plan", () => {
    const result = getRunsNeeded(null);

    expect(result.longRunDistance).toBe(12);
    expect(result.easyRunDistance).toBe(6);
    expect(result.totalEasyRuns).toBe(2);
  });
});

// ============================================================================
// Scoring Tests
// ============================================================================

describe("scoreForecastDays", () => {
  const preferences = createWeatherPreferences();
  const startDate = new Date("2025-12-01T00:00:00Z");

  it("scores days with perfect weather as excellent", () => {
    const forecast = [
      createWeatherData(startDate, {
        condition: "Clear",
        temperature: 12,
        precipitation: 0,
        windSpeed: 5,
      }),
    ];

    const result = scoreForecastDays(forecast, preferences);

    expect(result).toHaveLength(1);
    expect(result[0]!.score).toBeGreaterThanOrEqual(80);
    expect(result[0]!.quality).toBe("excellent");
  });

  it("scores days with poor weather as poor", () => {
    const forecast = [
      createWeatherData(startDate, {
        condition: "Heavy Rain",
        temperature: 5,
        precipitation: 80,
        windSpeed: 40,
      }),
    ];

    const result = scoreForecastDays(forecast, preferences);

    expect(result).toHaveLength(1);
    expect(result[0]!.score).toBeLessThan(40);
    expect(result[0]!.quality).toBe("poor");
  });

  it("handles empty preferences gracefully", () => {
    const forecast = create7DayForecast(startDate);
    const result = scoreForecastDays(forecast, []);

    expect(result).toHaveLength(7);
    // Without preferences, all days get neutral score
    result.forEach((day) => {
      expect(day.score).toBe(50);
      expect(day.quality).toBe("fair");
    });
  });

  it("preserves date information correctly", () => {
    const forecast = create7DayForecast(startDate);
    const result = scoreForecastDays(forecast, preferences);

    expect(result).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      expect(result[i]!.dateKey).toBe(formatDateKey(addDays(startDate, i)));
    }
  });
});

// ============================================================================
// Long Run Placement Tests
// ============================================================================

describe("findBestLongRunDay", () => {
  const preferences = createWeatherPreferences();
  const startDate = new Date("2025-12-01T00:00:00Z");

  it("selects the day with the highest score", () => {
    // Create forecast with one excellent day
    const forecast = create7DayForecast(startDate, [
      { precipitation: 50, windSpeed: 30 }, // Day 0: poor
      { precipitation: 5, windSpeed: 5 }, // Day 1: excellent
      { precipitation: 40, windSpeed: 25 }, // Day 2: fair
      { precipitation: 30, windSpeed: 20 }, // Day 3: fair
      { precipitation: 20, windSpeed: 15 }, // Day 4: good
      { precipitation: 35, windSpeed: 25 }, // Day 5: fair
      { precipitation: 45, windSpeed: 30 }, // Day 6: poor
    ]);

    const scoredDays = scoreForecastDays(forecast, preferences);
    const result = findBestLongRunDay(scoredDays, new Set(), new Set());

    expect(result).not.toBeNull();
    expect(result!.dateKey).toBe(formatDateKey(addDays(startDate, 1)));
  });

  it("excludes existing run dates", () => {
    const forecast = create7DayForecast(startDate, [
      { precipitation: 5, windSpeed: 5 }, // Day 0: best but excluded
      { precipitation: 10, windSpeed: 10 }, // Day 1: second best
      { precipitation: 20, windSpeed: 15 }, // Day 2
      { precipitation: 30, windSpeed: 20 }, // Day 3
      { precipitation: 40, windSpeed: 25 }, // Day 4
      { precipitation: 50, windSpeed: 30 }, // Day 5
      { precipitation: 60, windSpeed: 35 }, // Day 6
    ]);

    const scoredDays = scoreForecastDays(forecast, preferences);
    const existingRunDates = new Set([formatDateKey(startDate)]);
    const result = findBestLongRunDay(scoredDays, existingRunDates, new Set());

    expect(result).not.toBeNull();
    expect(result!.dateKey).toBe(formatDateKey(addDays(startDate, 1)));
  });

  it("excludes already used dates", () => {
    const forecast = create7DayForecast(startDate);
    const scoredDays = scoreForecastDays(forecast, preferences);

    const usedDates = new Set([formatDateKey(startDate)]);
    const result = findBestLongRunDay(scoredDays, new Set(), usedDates);

    expect(result).not.toBeNull();
    expect(result!.dateKey).not.toBe(formatDateKey(startDate));
  });

  it("prefers weekend days when scores are equal", () => {
    // December 1, 2025 is Monday; December 6 is Saturday, December 7 is Sunday
    const forecast = create7DayForecast(startDate, [
      { precipitation: 10, windSpeed: 10 }, // Monday
      { precipitation: 10, windSpeed: 10 }, // Tuesday
      { precipitation: 10, windSpeed: 10 }, // Wednesday
      { precipitation: 10, windSpeed: 10 }, // Thursday
      { precipitation: 10, windSpeed: 10 }, // Friday
      { precipitation: 10, windSpeed: 10 }, // Saturday
      { precipitation: 10, windSpeed: 10 }, // Sunday
    ]);

    const scoredDays = scoreForecastDays(forecast, preferences);
    const result = findBestLongRunDay(scoredDays, new Set(), new Set());

    expect(result).not.toBeNull();
    // Should prefer weekend day (Saturday or Sunday)
    const dayOfWeek = result!.date.getDay();
    expect(dayOfWeek === 0 || dayOfWeek === 6).toBe(true);
  });

  it("returns null when all days are excluded", () => {
    const forecast = create7DayForecast(startDate);
    const scoredDays = scoreForecastDays(forecast, preferences);

    const allDates = new Set(forecast.map((w) => formatDateKey(w.datetime)));
    const result = findBestLongRunDay(scoredDays, allDates, new Set());

    expect(result).toBeNull();
  });
});

// ============================================================================
// Easy Run Placement Tests
// ============================================================================

describe("findEasyRunDays", () => {
  const preferences = createWeatherPreferences();
  const startDate = new Date("2025-12-01T00:00:00Z");

  it("selects correct number of easy run days", () => {
    const forecast = create7DayForecast(startDate);
    const scoredDays = scoreForecastDays(forecast, preferences);

    const result = findEasyRunDays(scoredDays, null, new Set(), new Set(), 2);

    expect(result).toHaveLength(2);
  });

  it("excludes long run day and rest day after", () => {
    const forecast = create7DayForecast(startDate);
    const scoredDays = scoreForecastDays(forecast, preferences);
    const longRunDateKey = formatDateKey(addDays(startDate, 3));

    const result = findEasyRunDays(scoredDays, longRunDateKey, new Set(), new Set(), 2);

    const resultDateKeys = result.map((d) => d.dateKey);
    expect(resultDateKeys).not.toContain(longRunDateKey);
    expect(resultDateKeys).not.toContain(formatDateKey(addDays(startDate, 4))); // Rest day
  });

  it("excludes existing run dates", () => {
    const forecast = create7DayForecast(startDate);
    const scoredDays = scoreForecastDays(forecast, preferences);
    const existingDates = new Set([formatDateKey(startDate), formatDateKey(addDays(startDate, 1))]);

    const result = findEasyRunDays(scoredDays, null, existingDates, new Set(), 2);

    const resultDateKeys = result.map((d) => d.dateKey);
    expect(resultDateKeys).not.toContain(formatDateKey(startDate));
    expect(resultDateKeys).not.toContain(formatDateKey(addDays(startDate, 1)));
  });

  it("selects higher-scoring days first", () => {
    const forecast = create7DayForecast(startDate, [
      { precipitation: 60, windSpeed: 35 }, // Day 0: worst
      { precipitation: 5, windSpeed: 5 }, // Day 1: best
      { precipitation: 50, windSpeed: 30 }, // Day 2
      { precipitation: 10, windSpeed: 10 }, // Day 3: second best
      { precipitation: 40, windSpeed: 25 }, // Day 4
      { precipitation: 30, windSpeed: 20 }, // Day 5
      { precipitation: 20, windSpeed: 15 }, // Day 6
    ]);

    const scoredDays = scoreForecastDays(forecast, preferences);
    const result = findEasyRunDays(scoredDays, null, new Set(), new Set(), 2);

    // Should select days 1 and 3 (best and second best)
    const resultDateKeys = result.map((d) => d.dateKey);
    expect(resultDateKeys).toContain(formatDateKey(addDays(startDate, 1)));
    expect(resultDateKeys).toContain(formatDateKey(addDays(startDate, 3)));
  });

  it("returns fewer days when not enough available", () => {
    const forecast = create7DayForecast(startDate);
    const scoredDays = scoreForecastDays(forecast, preferences);

    // Mark most days as used
    const usedDates = new Set([0, 1, 2, 3, 4, 5].map((i) => formatDateKey(addDays(startDate, i))));

    const result = findEasyRunDays(scoredDays, null, new Set(), usedDates, 3);

    expect(result.length).toBeLessThan(3);
  });
});

// ============================================================================
// Reasoning Generation Tests
// ============================================================================

describe("generateReason", () => {
  const startDate = new Date("2025-12-01T00:00:00Z");
  const preferences = createWeatherPreferences();

  it("generates excellent long run reason", () => {
    const weather = createWeatherData(startDate, {
      condition: "Clear",
      temperature: 12,
      precipitation: 5,
      windSpeed: 8,
    });
    const scoredDays = scoreForecastDays([weather], preferences);
    const scoredDay = scoredDays[0]!;

    const suggestion = {
      date: startDate,
      runType: RunType.LONG_RUN,
      distance: 16,
      weatherScore: scoredDay.score,
      isOptimal: true,
      weather: {
        condition: "Clear",
        temperature: 12,
        precipitation: 5,
        windSpeed: 8,
      },
    };

    const reason = generateReason(suggestion, scoredDay);

    expect(reason).toContain("Best weather of the week");
    expect(reason).toContain("Clear");
    expect(reason).toContain("12°C");
  });

  it("generates poor long run reason", () => {
    const weather = createWeatherData(startDate, {
      condition: "Heavy Rain",
      temperature: 8,
      precipitation: 70,
      windSpeed: 35,
    });
    const scoredDays = scoreForecastDays([weather], preferences);
    const scoredDay = scoredDays[0]!;

    const suggestion = {
      date: startDate,
      runType: RunType.LONG_RUN,
      distance: 16,
      weatherScore: scoredDay.score,
      isOptimal: false,
      weather: {
        condition: "Heavy Rain",
        temperature: 8,
        precipitation: 70,
        windSpeed: 35,
      },
    };

    const reason = generateReason(suggestion, scoredDay);

    expect(reason).toContain("challenging weather");
  });

  it("generates gap filler reason for easy run", () => {
    const weather = createWeatherData(startDate, {
      condition: "Light Rain",
      temperature: 10,
      precipitation: 40,
      windSpeed: 20,
    });
    const scoredDays = scoreForecastDays([weather], preferences);
    const scoredDay = scoredDays[0]!;

    const suggestion = {
      date: startDate,
      runType: RunType.EASY_RUN,
      distance: 6,
      weatherScore: scoredDay.score,
      isOptimal: false,
      weather: {
        condition: "Light Rain",
        temperature: 10,
        precipitation: 40,
        windSpeed: 20,
      },
    };

    const reason = generateReason(suggestion, scoredDay, true);

    expect(reason).toContain("training consistency");
    expect(reason).toContain("4+ day gap");
  });

  it("includes day name in easy run reason", () => {
    // December 1, 2025 is Monday
    const weather = createWeatherData(startDate, {
      condition: "Cloudy",
      temperature: 15,
      precipitation: 20,
      windSpeed: 12,
    });
    const scoredDays = scoreForecastDays([weather], preferences);
    const scoredDay = scoredDays[0]!;

    const suggestion = {
      date: startDate,
      runType: RunType.EASY_RUN,
      distance: 6,
      weatherScore: scoredDay.score,
      isOptimal: false,
      weather: {
        condition: "Cloudy",
        temperature: 15,
        precipitation: 20,
        windSpeed: 12,
      },
    };

    const reason = generateReason(suggestion, scoredDay);

    expect(reason).toContain("Monday");
  });
});

// ============================================================================
// Main Algorithm Tests (generateSuggestions)
// ============================================================================

describe("generateSuggestions", () => {
  describe("basic functionality", () => {
    it("returns correct number of suggestions for training week", () => {
      const input = createAlgorithmInput();
      const result = generateSuggestions(input);

      // Should have 1 long run + 2 easy runs = 3 suggestions
      expect(result).toHaveLength(3);
    });

    it("includes exactly one long run", () => {
      const input = createAlgorithmInput();
      const result = generateSuggestions(input);

      const longRuns = result.filter((s) => s.runType === RunType.LONG_RUN);
      expect(longRuns).toHaveLength(1);
    });

    it("returns suggestions sorted by date", () => {
      const input = createAlgorithmInput();
      const result = generateSuggestions(input);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i]!.date.getTime()).toBeLessThanOrEqual(result[i + 1]!.date.getTime());
      }
    });

    it("each suggestion includes all required fields", () => {
      const input = createAlgorithmInput();
      const result = generateSuggestions(input);

      for (const suggestion of result) {
        expect(suggestion.date).toBeInstanceOf(Date);
        expect(typeof suggestion.runType).toBe("string");
        expect(typeof suggestion.distance).toBe("number");
        expect(typeof suggestion.weatherScore).toBe("number");
        expect(typeof suggestion.isOptimal).toBe("boolean");
        expect(typeof suggestion.reason).toBe("string");
        expect(suggestion.weather).toHaveProperty("condition");
        expect(suggestion.weather).toHaveProperty("temperature");
        expect(suggestion.weather).toHaveProperty("precipitation");
        expect(suggestion.weather).toHaveProperty("windSpeed");
      }
    });
  });

  describe("weather-based optimization", () => {
    it("assigns long run to best weather day", () => {
      const startDate = new Date("2025-12-01T00:00:00Z");
      const forecast = create7DayForecast(startDate, [
        { precipitation: 60, windSpeed: 40 }, // Day 0: poor
        { precipitation: 50, windSpeed: 30 }, // Day 1: poor
        { precipitation: 5, windSpeed: 5 }, // Day 2: excellent
        { precipitation: 40, windSpeed: 25 }, // Day 3: fair
        { precipitation: 30, windSpeed: 20 }, // Day 4: fair
        { precipitation: 45, windSpeed: 30 }, // Day 5: poor
        { precipitation: 55, windSpeed: 35 }, // Day 6: poor
      ]);

      const input = createAlgorithmInput({ forecast });
      const result = generateSuggestions(input);

      const longRun = result.find((s) => s.runType === RunType.LONG_RUN);
      expect(longRun).toBeDefined();
      expect(formatDateKey(longRun!.date)).toBe(formatDateKey(addDays(startDate, 2)));
    });

    it("sets isOptimal flag correctly based on score", () => {
      const startDate = new Date("2025-12-01T00:00:00Z");
      const forecast = create7DayForecast(startDate, [
        { precipitation: 5, windSpeed: 5 }, // Excellent
        { precipitation: 15, windSpeed: 10 }, // Good
        { precipitation: 45, windSpeed: 25 }, // Fair
        { precipitation: 60, windSpeed: 35 }, // Poor
        { precipitation: 5, windSpeed: 5 }, // Excellent
        { precipitation: 10, windSpeed: 8 }, // Excellent
        { precipitation: 15, windSpeed: 10 }, // Good
      ]);

      const input = createAlgorithmInput({ forecast });
      const result = generateSuggestions(input);

      // Long run should be on an excellent day (isOptimal = true)
      const longRun = result.find((s) => s.runType === RunType.LONG_RUN);
      expect(longRun!.isOptimal).toBe(true);
      expect(longRun!.weatherScore).toBeGreaterThanOrEqual(80);
    });
  });

  describe("training constraints", () => {
    it("enforces rest day after long run", () => {
      const input = createAlgorithmInput();
      const result = generateSuggestions(input);

      const longRun = result.find((s) => s.runType === RunType.LONG_RUN);
      expect(longRun).toBeDefined();

      const restDayKey = formatDateKey(addDays(longRun!.date, 1));

      // No run should be scheduled for the day after long run
      const runOnRestDay = result.find((s) => formatDateKey(s.date) === restDayKey);
      expect(runOnRestDay).toBeUndefined();
    });

    it("respects existing runs", () => {
      const startDate = new Date("2025-12-01T00:00:00Z");
      const existingRuns = [
        { date: startDate, runType: RunType.EASY_RUN },
        { date: addDays(startDate, 3), runType: RunType.TEMPO_RUN },
      ];

      const input = createAlgorithmInput({ existingRuns });
      const result = generateSuggestions(input);

      const resultDateKeys = result.map((s) => formatDateKey(s.date));
      expect(resultDateKeys).not.toContain(formatDateKey(startDate));
      expect(resultDateKeys).not.toContain(formatDateKey(addDays(startDate, 3)));
    });

    it("uses correct distances from training plan", () => {
      const plan = createTrainingPlan({
        longRunTarget: 18,
        weeklyMileageTarget: 40,
      });

      const input = createAlgorithmInput({ trainingPlan: plan });
      const result = generateSuggestions(input);

      const longRun = result.find((s) => s.runType === RunType.LONG_RUN);
      expect(longRun!.distance).toBe(18);

      // Remaining mileage: 40 - 18 = 22km, which is > 15, so 3 easy runs
      const easyRuns = result.filter((s) => s.runType === RunType.EASY_RUN);
      expect(easyRuns.length).toBe(3);
    });
  });

  describe("gap prevention", () => {
    it("does not create 4+ day gaps between runs", () => {
      const input = createAlgorithmInput();
      const result = generateSuggestions(input);

      expect(validateNoLargeGaps(result)).toBe(true);
    });

    it("fills gaps even with poor weather if needed", () => {
      const startDate = new Date("2025-12-01T00:00:00Z");
      // All days have poor weather except first and last
      const forecast = create7DayForecast(startDate, [
        { precipitation: 5, windSpeed: 5 }, // Day 0: excellent
        { precipitation: 70, windSpeed: 40 }, // Day 1: poor
        { precipitation: 70, windSpeed: 40 }, // Day 2: poor
        { precipitation: 70, windSpeed: 40 }, // Day 3: poor
        { precipitation: 70, windSpeed: 40 }, // Day 4: poor
        { precipitation: 70, windSpeed: 40 }, // Day 5: poor
        { precipitation: 5, windSpeed: 5 }, // Day 6: excellent
      ]);

      const input = createAlgorithmInput({ forecast });
      const result = generateSuggestions(input);

      // Should still schedule runs to avoid 4+ day gaps
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(validateNoLargeGaps(result)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles empty forecast gracefully", () => {
      const input = createAlgorithmInput({ forecast: [] });
      const result = generateSuggestions(input);

      expect(result).toHaveLength(0);
    });

    it("handles no training plan data", () => {
      const input = createAlgorithmInput({ trainingPlan: null });
      const result = generateSuggestions(input);

      // Should still produce suggestions using defaults
      expect(result.length).toBeGreaterThan(0);

      const longRun = result.find((s) => s.runType === RunType.LONG_RUN);
      expect(longRun!.distance).toBe(12); // Default long run distance
    });

    it("handles all poor weather week", () => {
      const startDate = new Date("2025-12-01T00:00:00Z");
      const forecast = create7DayForecast(startDate, [
        { condition: "Heavy Rain", precipitation: 80, windSpeed: 45 },
        { condition: "Thunderstorm", precipitation: 90, windSpeed: 50 },
        { condition: "Heavy Rain", precipitation: 85, windSpeed: 40 },
        { condition: "Heavy Rain", precipitation: 75, windSpeed: 38 },
        { condition: "Thunderstorm", precipitation: 95, windSpeed: 55 },
        { condition: "Heavy Rain", precipitation: 70, windSpeed: 42 },
        { condition: "Heavy Rain", precipitation: 78, windSpeed: 44 },
      ]);

      const input = createAlgorithmInput({ forecast });
      const result = generateSuggestions(input);

      // Should still produce suggestions, picking the "least bad" days
      expect(result.length).toBeGreaterThan(0);

      // Long run should exist
      const longRun = result.find((s) => s.runType === RunType.LONG_RUN);
      expect(longRun).toBeDefined();

      // Reasoning should reflect poor conditions
      expect(longRun!.reason.toLowerCase()).toContain("challenging");
    });

    it("handles single day forecast", () => {
      const startDate = new Date("2025-12-01T00:00:00Z");
      const forecast = [createWeatherData(startDate)];

      const input = createAlgorithmInput({ forecast });
      const result = generateSuggestions(input);

      // Can only schedule one run on single day
      expect(result.length).toBe(1);
      expect(result[0]!.runType).toBe(RunType.LONG_RUN);
    });

    it("handles forecast with all days already having runs", () => {
      const startDate = new Date("2025-12-01T00:00:00Z");
      const forecast = create7DayForecast(startDate);
      const existingRuns = forecast.map((w, i) => ({
        date: w.datetime,
        runType: i === 0 ? RunType.LONG_RUN : RunType.EASY_RUN,
      }));

      const input = createAlgorithmInput({ forecast, existingRuns });
      const result = generateSuggestions(input);

      expect(result).toHaveLength(0);
    });
  });

  describe("reasoning quality", () => {
    it("generates human-readable reasons for each suggestion", () => {
      const input = createAlgorithmInput();
      const result = generateSuggestions(input);

      for (const suggestion of result) {
        expect(suggestion.reason.length).toBeGreaterThan(10);
        // Should not contain template placeholders
        expect(suggestion.reason).not.toContain("{");
        expect(suggestion.reason).not.toContain("}");
      }
    });

    it("long run reason explains weather choice", () => {
      const input = createAlgorithmInput();
      const result = generateSuggestions(input);

      const longRun = result.find((s) => s.runType === RunType.LONG_RUN);
      expect(longRun!.reason.toLowerCase()).toMatch(/weather|conditions/);
    });

    it("includes temperature in reasons", () => {
      const input = createAlgorithmInput();
      const result = generateSuggestions(input);

      // At least one suggestion should mention temperature
      const hasTemp = result.some((s) => s.reason.includes("°C"));
      expect(hasTemp).toBe(true);
    });
  });
});

// ============================================================================
// Validation Utility Tests
// ============================================================================

describe("validateNoLargeGaps", () => {
  it("returns true for empty suggestions", () => {
    expect(validateNoLargeGaps([])).toBe(true);
  });

  it("returns true for single suggestion", () => {
    const suggestions: Suggestion[] = [
      {
        date: new Date("2025-12-01"),
        runType: RunType.LONG_RUN,
        distance: 16,
        weatherScore: 85,
        isOptimal: true,
        reason: "Test",
        weather: { condition: "Clear", temperature: 12, precipitation: 5, windSpeed: 10 },
      },
    ];
    expect(validateNoLargeGaps(suggestions)).toBe(true);
  });

  it("returns true for suggestions without large gaps", () => {
    const suggestions: Suggestion[] = [
      {
        date: new Date("2025-12-01"),
        runType: RunType.LONG_RUN,
        distance: 16,
        weatherScore: 85,
        isOptimal: true,
        reason: "Test",
        weather: { condition: "Clear", temperature: 12, precipitation: 5, windSpeed: 10 },
      },
      {
        date: new Date("2025-12-03"),
        runType: RunType.EASY_RUN,
        distance: 6,
        weatherScore: 75,
        isOptimal: false,
        reason: "Test",
        weather: { condition: "Cloudy", temperature: 10, precipitation: 15, windSpeed: 12 },
      },
      {
        date: new Date("2025-12-06"),
        runType: RunType.EASY_RUN,
        distance: 6,
        weatherScore: 70,
        isOptimal: false,
        reason: "Test",
        weather: { condition: "Cloudy", temperature: 11, precipitation: 20, windSpeed: 15 },
      },
    ];
    expect(validateNoLargeGaps(suggestions)).toBe(true);
  });

  it("returns false for suggestions with 5+ day gap", () => {
    const suggestions: Suggestion[] = [
      {
        date: new Date("2025-12-01"),
        runType: RunType.LONG_RUN,
        distance: 16,
        weatherScore: 85,
        isOptimal: true,
        reason: "Test",
        weather: { condition: "Clear", temperature: 12, precipitation: 5, windSpeed: 10 },
      },
      {
        date: new Date("2025-12-08"), // 7-day gap
        runType: RunType.EASY_RUN,
        distance: 6,
        weatherScore: 75,
        isOptimal: false,
        reason: "Test",
        weather: { condition: "Cloudy", temperature: 10, precipitation: 15, windSpeed: 12 },
      },
    ];
    expect(validateNoLargeGaps(suggestions)).toBe(false);
  });
});

describe("validateNoBackToBackHardDays", () => {
  const createSuggestion = (date: Date, runType: RunType): Suggestion => ({
    date,
    runType,
    distance: runType === RunType.LONG_RUN ? 16 : 6,
    weatherScore: 75,
    isOptimal: false,
    reason: "Test",
    weather: { condition: "Clear", temperature: 12, precipitation: 5, windSpeed: 10 },
  });

  it("returns true for empty suggestions", () => {
    expect(validateNoBackToBackHardDays([])).toBe(true);
  });

  it("returns true for no back-to-back hard days", () => {
    const suggestions = [
      createSuggestion(new Date("2025-12-01"), RunType.LONG_RUN),
      createSuggestion(new Date("2025-12-03"), RunType.EASY_RUN),
      createSuggestion(new Date("2025-12-05"), RunType.TEMPO_RUN),
    ];
    expect(validateNoBackToBackHardDays(suggestions)).toBe(true);
  });

  it("returns true for consecutive easy runs", () => {
    const suggestions = [
      createSuggestion(new Date("2025-12-01"), RunType.EASY_RUN),
      createSuggestion(new Date("2025-12-02"), RunType.EASY_RUN),
    ];
    expect(validateNoBackToBackHardDays(suggestions)).toBe(true);
  });

  it("returns false for consecutive hard days", () => {
    const suggestions = [
      createSuggestion(new Date("2025-12-01"), RunType.LONG_RUN),
      createSuggestion(new Date("2025-12-02"), RunType.TEMPO_RUN),
    ];
    expect(validateNoBackToBackHardDays(suggestions)).toBe(false);
  });

  it("returns false for long run followed by interval", () => {
    const suggestions = [
      createSuggestion(new Date("2025-12-01"), RunType.LONG_RUN),
      createSuggestion(new Date("2025-12-02"), RunType.INTERVAL_RUN),
    ];
    expect(validateNoBackToBackHardDays(suggestions)).toBe(false);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe("performance", () => {
  it("completes in <500ms for 7-day forecast", () => {
    const input = createAlgorithmInput();

    const start = performance.now();
    generateSuggestions(input);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500);
  });

  it("completes in <1s for 14-day forecast", () => {
    const startDate = new Date("2025-12-01T00:00:00Z");
    const forecast = Array.from({ length: 14 }, (_, i) => createWeatherData(addDays(startDate, i)));

    const input = createAlgorithmInput({ forecast });

    const start = performance.now();
    generateSuggestions(input);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000);
  });

  it("handles large forecast efficiently", () => {
    const startDate = new Date("2025-12-01T00:00:00Z");
    const forecast = Array.from({ length: 30 }, (_, i) => createWeatherData(addDays(startDate, i)));

    const input = createAlgorithmInput({ forecast });

    const start = performance.now();
    generateSuggestions(input);
    const duration = performance.now() - start;

    // Should still be reasonably fast even for a month
    expect(duration).toBeLessThan(2000);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("integration", () => {
  it("produces consistent results for same input", () => {
    const input = createAlgorithmInput();

    const result1 = generateSuggestions(input);
    const result2 = generateSuggestions(input);

    expect(result1.length).toBe(result2.length);
    for (let i = 0; i < result1.length; i++) {
      expect(formatDateKey(result1[i]!.date)).toBe(formatDateKey(result2[i]!.date));
      expect(result1[i]!.runType).toBe(result2[i]!.runType);
      expect(result1[i]!.distance).toBe(result2[i]!.distance);
    }
  });

  it("uses weather-preferences scoring correctly", () => {
    const startDate = new Date("2025-12-01T00:00:00Z");

    // Create forecast with clear difference in weather quality
    const forecast = create7DayForecast(startDate, [
      { precipitation: 5, windSpeed: 5, temperature: 12 }, // Perfect
      { precipitation: 80, windSpeed: 40, temperature: 5 }, // Terrible
      { precipitation: 15, windSpeed: 10, temperature: 10 }, // Good
      { precipitation: 70, windSpeed: 35, temperature: 8 }, // Bad
      { precipitation: 10, windSpeed: 8, temperature: 14 }, // Excellent
      { precipitation: 60, windSpeed: 30, temperature: 6 }, // Poor
      { precipitation: 20, windSpeed: 12, temperature: 11 }, // Good
    ]);

    const input = createAlgorithmInput({ forecast });
    const result = generateSuggestions(input);

    // Long run should be on day 0 or day 4 (best weather)
    const longRun = result.find((s) => s.runType === RunType.LONG_RUN);
    const longRunDayIndex = Math.floor(
      (longRun!.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect([0, 4]).toContain(longRunDayIndex);
  });

  it("handles training plan week with recovery focus", () => {
    const plan = createTrainingPlan({
      phase: Phase.PEAK_TAPER,
      longRunTarget: 8,
      weeklyMileageTarget: 16,
      notes: "Recovery week",
    });

    const input = createAlgorithmInput({ trainingPlan: plan });
    const result = generateSuggestions(input);

    const longRun = result.find((s) => s.runType === RunType.LONG_RUN);
    expect(longRun!.distance).toBe(8);

    // With 16km total and 8km long run, remaining is 8km
    // 8km < 15km, so should be 2 easy runs at 4km each
    const easyRuns = result.filter((s) => s.runType === RunType.EASY_RUN);
    expect(easyRuns.length).toBe(2);
    expect(easyRuns[0]!.distance).toBe(4);
  });
});
