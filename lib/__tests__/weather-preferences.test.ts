/**
 * Weather Preferences Logic Tests
 *
 * Comprehensive unit tests for the weather preferences module.
 * Target coverage: 95%+
 */

import {
  getWeatherScore,
  isAcceptableWeather,
  getWeatherQuality,
  getRejectionReason,
  toWeatherPreferenceThresholds,
  type WeatherDataForScoring,
  type WeatherPreferenceThresholds,
  type WeatherQuality,
  RunType,
} from "../weather-preferences";

// Test fixtures
const createWeather = (overrides: Partial<WeatherDataForScoring> = {}): WeatherDataForScoring => ({
  condition: "Clear",
  temperature: 12.5, // Ideal temperature
  feelsLike: 12,
  precipitation: 0,
  humidity: 50,
  windSpeed: 0,
  ...overrides,
});

const createPreference = (
  overrides: Partial<WeatherPreferenceThresholds> = {}
): WeatherPreferenceThresholds => ({
  runType: RunType.LONG_RUN,
  maxPrecipitation: 20,
  maxWindSpeed: 25,
  minTemperature: 0,
  maxTemperature: 25,
  avoidConditions: ["Heavy Rain", "Thunderstorm", "Heavy Snow"],
  ...overrides,
});

describe("weather-preferences", () => {
  describe("getWeatherScore", () => {
    it("returns 100 for perfect conditions", () => {
      const weather = createWeather();
      const preference = createPreference();

      const score = getWeatherScore(weather, preference);
      expect(score).toBe(100);
    });

    it("returns 0 for worst conditions", () => {
      const weather = createWeather({
        precipitation: 100,
        windSpeed: 100,
        temperature: 50, // Very hot
        condition: "Heavy Rain",
      });
      const preference = createPreference();

      const score = getWeatherScore(weather, preference);
      expect(score).toBe(0);
    });

    describe("precipitation penalty", () => {
      it("applies no penalty when precipitation is 0", () => {
        const weather = createWeather({ precipitation: 0 });
        const preference = createPreference({ maxPrecipitation: 20 });

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(100);
      });

      it("applies full penalty when precipitation equals max", () => {
        const weather = createWeather({ precipitation: 20 });
        const preference = createPreference({ maxPrecipitation: 20 });

        // Precipitation penalty = 60 points (new weight)
        const score = getWeatherScore(weather, preference);
        expect(score).toBe(40);
      });

      it("applies half penalty when precipitation is half of max", () => {
        const weather = createWeather({ precipitation: 10 });
        const preference = createPreference({ maxPrecipitation: 20 });

        // Precipitation penalty = 30 points (new weight)
        const score = getWeatherScore(weather, preference);
        expect(score).toBe(70);
      });

      it("caps penalty at 60 points when precipitation exceeds max", () => {
        const weather = createWeather({ precipitation: 100 });
        const preference = createPreference({ maxPrecipitation: 20 });

        // Should be capped at 60, not 300 (new weight)
        const score = getWeatherScore(weather, preference);
        expect(score).toBe(40);
      });

      it("handles maxPrecipitation of 0 without division by zero", () => {
        const weather = createWeather({ precipitation: 50 });
        const preference = createPreference({ maxPrecipitation: 0 });

        // Should not throw, penalty capped at 60 (new weight)
        const score = getWeatherScore(weather, preference);
        expect(score).toBeLessThanOrEqual(40);
      });
    });

    describe("wind penalty", () => {
      it("applies no penalty when wind is 0", () => {
        const weather = createWeather({ windSpeed: 0 });
        const preference = createPreference({ maxWindSpeed: 25 });

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(100);
      });

      it("applies full penalty when wind equals max", () => {
        const weather = createWeather({ windSpeed: 25 });
        const preference = createPreference({ maxWindSpeed: 25 });

        // Wind penalty = 30 points (new weight)
        const score = getWeatherScore(weather, preference);
        expect(score).toBe(70);
      });

      it("applies no wind penalty when maxWindSpeed is null", () => {
        const weather = createWeather({ windSpeed: 100 });
        const preference = createPreference({ maxWindSpeed: null });

        // No wind penalty applied
        const score = getWeatherScore(weather, preference);
        expect(score).toBe(100);
      });

      it("caps wind penalty at 30 points when wind exceeds max", () => {
        const weather = createWeather({ windSpeed: 100 });
        const preference = createPreference({ maxWindSpeed: 25 });

        // Should be capped at 30 (new weight)
        const score = getWeatherScore(weather, preference);
        expect(score).toBe(70);
      });
    });

    describe("temperature penalty", () => {
      it("applies no penalty at ideal temperature (12.5°C)", () => {
        const weather = createWeather({ temperature: 12.5 });
        const preference = createPreference();

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(100);
      });

      it("applies 2 points penalty per degree away from ideal, capped at 5", () => {
        // 5 degrees below ideal = 10 points, but capped at 5 (new weight)
        const weather = createWeather({ temperature: 7.5 });
        const preference = createPreference();

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(95);
      });

      it("caps temperature penalty at 5 points", () => {
        // 30 degrees away from ideal = should be 60 points, but capped at 5 (new weight)
        const weather = createWeather({ temperature: 42.5 });
        const preference = createPreference();

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(95);
      });

      it("applies penalty symmetrically for cold temperatures", () => {
        // 5 degrees above ideal
        const warmWeather = createWeather({ temperature: 17.5 });
        // 5 degrees below ideal
        const coldWeather = createWeather({ temperature: 7.5 });
        const preference = createPreference();

        const warmScore = getWeatherScore(warmWeather, preference);
        const coldScore = getWeatherScore(coldWeather, preference);

        expect(warmScore).toBe(coldScore);
      });
    });

    describe("condition penalty", () => {
      it("applies no penalty when condition is not in avoid list", () => {
        const weather = createWeather({ condition: "Clear" });
        const preference = createPreference({
          avoidConditions: ["Heavy Rain", "Thunderstorm"],
        });

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(100);
      });

      it("applies 5 point penalty when condition matches avoid list", () => {
        const weather = createWeather({ condition: "Heavy Rain" });
        const preference = createPreference({
          avoidConditions: ["Heavy Rain", "Thunderstorm"],
        });

        // Condition penalty = 5 points (new weight)
        const score = getWeatherScore(weather, preference);
        expect(score).toBe(95);
      });

      it("matches condition case-insensitively", () => {
        const weather = createWeather({ condition: "heavy rain" });
        const preference = createPreference({
          avoidConditions: ["Heavy Rain"],
        });

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(95);
      });

      it("matches partial condition strings", () => {
        const weather = createWeather({ condition: "Heavy Rain with Wind" });
        const preference = createPreference({
          avoidConditions: ["Heavy Rain"],
        });

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(95);
      });

      it("applies no penalty when avoidConditions is empty", () => {
        const weather = createWeather({ condition: "Heavy Rain" });
        const preference = createPreference({ avoidConditions: [] });

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(100);
      });
    });

    describe("combined penalties", () => {
      it("combines all penalties correctly", () => {
        const weather = createWeather({
          precipitation: 20, // 60 points (new weight)
          windSpeed: 25, // 30 points (new weight)
          temperature: 22.5, // 10 degrees from ideal = capped at 5 points (new weight)
          condition: "Heavy Rain", // 5 points (new weight)
        });
        const preference = createPreference({ maxPrecipitation: 20, maxWindSpeed: 25 });

        // 100 - 60 - 30 - 5 - 5 = 0
        const score = getWeatherScore(weather, preference);
        expect(score).toBe(0);
      });

      it("never returns negative scores", () => {
        const weather = createWeather({
          precipitation: 200,
          windSpeed: 200,
          temperature: 100,
          condition: "Heavy Rain Thunderstorm Heavy Snow",
        });
        const preference = createPreference();

        const score = getWeatherScore(weather, preference);
        expect(score).toBeGreaterThanOrEqual(0);
      });

      it("never returns scores above 100", () => {
        const weather = createWeather({
          precipitation: -10, // Invalid but should be handled
          windSpeed: -10,
          temperature: 12.5, // Ideal
        });
        const preference = createPreference();

        const score = getWeatherScore(weather, preference);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    describe("edge cases", () => {
      it("handles precipitation at exactly max threshold", () => {
        const weather = createWeather({ precipitation: 20 });
        const preference = createPreference({ maxPrecipitation: 20 });

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(40); // Full precipitation penalty (60 points, new weight)
      });

      it("handles temperature at exactly ideal", () => {
        const weather = createWeather({ temperature: 12.5 });
        const preference = createPreference();

        const score = getWeatherScore(weather, preference);
        expect(score).toBe(100);
      });

      it("rounds score to nearest integer", () => {
        const weather = createWeather({ precipitation: 7 }); // Would give fractional penalty
        const preference = createPreference({ maxPrecipitation: 20 });

        const score = getWeatherScore(weather, preference);
        expect(Number.isInteger(score)).toBe(true);
      });
    });
  });

  describe("isAcceptableWeather", () => {
    it("returns true when all conditions are within limits", () => {
      const weather = createWeather({
        precipitation: 10,
        windSpeed: 20,
        temperature: 15,
      });
      const preference = createPreference();

      expect(isAcceptableWeather(weather, preference)).toBe(true);
    });

    it("returns false when precipitation exceeds max", () => {
      const weather = createWeather({ precipitation: 25 });
      const preference = createPreference({ maxPrecipitation: 20 });

      expect(isAcceptableWeather(weather, preference)).toBe(false);
    });

    it("returns true when precipitation equals max", () => {
      const weather = createWeather({ precipitation: 20 });
      const preference = createPreference({ maxPrecipitation: 20 });

      expect(isAcceptableWeather(weather, preference)).toBe(true);
    });

    it("returns false when wind exceeds max", () => {
      const weather = createWeather({ windSpeed: 30 });
      const preference = createPreference({ maxWindSpeed: 25 });

      expect(isAcceptableWeather(weather, preference)).toBe(false);
    });

    it("returns true when wind equals max", () => {
      const weather = createWeather({ windSpeed: 25 });
      const preference = createPreference({ maxWindSpeed: 25 });

      expect(isAcceptableWeather(weather, preference)).toBe(true);
    });

    it("ignores wind limit when maxWindSpeed is null", () => {
      const weather = createWeather({ windSpeed: 100 });
      const preference = createPreference({ maxWindSpeed: null });

      expect(isAcceptableWeather(weather, preference)).toBe(true);
    });

    it("returns false when temperature is below minimum", () => {
      const weather = createWeather({ temperature: -5 });
      const preference = createPreference({ minTemperature: 0 });

      expect(isAcceptableWeather(weather, preference)).toBe(false);
    });

    it("returns true when temperature equals minimum", () => {
      const weather = createWeather({ temperature: 0 });
      const preference = createPreference({ minTemperature: 0 });

      expect(isAcceptableWeather(weather, preference)).toBe(true);
    });

    it("ignores minimum temperature when null", () => {
      const weather = createWeather({ temperature: -20 });
      const preference = createPreference({ minTemperature: null });

      expect(isAcceptableWeather(weather, preference)).toBe(true);
    });

    it("returns false when temperature is above maximum", () => {
      const weather = createWeather({ temperature: 30 });
      const preference = createPreference({ maxTemperature: 25 });

      expect(isAcceptableWeather(weather, preference)).toBe(false);
    });

    it("returns true when temperature equals maximum", () => {
      const weather = createWeather({ temperature: 25 });
      const preference = createPreference({ maxTemperature: 25 });

      expect(isAcceptableWeather(weather, preference)).toBe(true);
    });

    it("ignores maximum temperature when null", () => {
      const weather = createWeather({ temperature: 50 });
      const preference = createPreference({ maxTemperature: null });

      expect(isAcceptableWeather(weather, preference)).toBe(true);
    });

    it("returns false when condition is in avoid list", () => {
      const weather = createWeather({ condition: "Heavy Rain" });
      const preference = createPreference({
        avoidConditions: ["Heavy Rain", "Thunderstorm"],
      });

      expect(isAcceptableWeather(weather, preference)).toBe(false);
    });

    it("returns true when condition is not in avoid list", () => {
      const weather = createWeather({ condition: "Light Rain" });
      const preference = createPreference({
        avoidConditions: ["Heavy Rain", "Thunderstorm"],
      });

      expect(isAcceptableWeather(weather, preference)).toBe(true);
    });

    it("matches avoided conditions case-insensitively", () => {
      const weather = createWeather({ condition: "heavy rain" });
      const preference = createPreference({
        avoidConditions: ["Heavy Rain"],
      });

      expect(isAcceptableWeather(weather, preference)).toBe(false);
    });

    it("matches partial condition strings", () => {
      const weather = createWeather({ condition: "Heavy Rain with Thunder" });
      const preference = createPreference({
        avoidConditions: ["Heavy Rain"],
      });

      expect(isAcceptableWeather(weather, preference)).toBe(false);
    });

    it("returns true when avoidConditions is empty", () => {
      const weather = createWeather({ condition: "Heavy Rain" });
      const preference = createPreference({ avoidConditions: [] });

      expect(isAcceptableWeather(weather, preference)).toBe(true);
    });

    describe("run type specific tests with default preferences", () => {
      it("LONG_RUN has strictest requirements", () => {
        const weather = createWeather({
          precipitation: 25, // Above 20% max for LONG_RUN
          windSpeed: 20,
          temperature: 15,
        });
        const longRunPreference = createPreference({
          runType: RunType.LONG_RUN,
          maxPrecipitation: 20,
        });

        expect(isAcceptableWeather(weather, longRunPreference)).toBe(false);
      });

      it("EASY_RUN has more lenient requirements", () => {
        const weather = createWeather({
          precipitation: 40, // Within 50% max for EASY_RUN
          windSpeed: 30,
          temperature: 15,
        });
        const easyRunPreference = createPreference({
          runType: RunType.EASY_RUN,
          maxPrecipitation: 50,
          maxWindSpeed: 35,
        });

        expect(isAcceptableWeather(weather, easyRunPreference)).toBe(true);
      });

      it("RACE has no limits (null values)", () => {
        const weather = createWeather({
          precipitation: 100,
          windSpeed: 100,
          temperature: -10,
        });
        const racePreference = createPreference({
          runType: RunType.RACE,
          maxPrecipitation: 100,
          maxWindSpeed: null,
          minTemperature: null,
          maxTemperature: null,
          avoidConditions: [],
        });

        expect(isAcceptableWeather(weather, racePreference)).toBe(true);
      });
    });
  });

  describe("getWeatherQuality", () => {
    it('returns "excellent" for scores 80-100', () => {
      expect(getWeatherQuality(100)).toBe("excellent");
      expect(getWeatherQuality(90)).toBe("excellent");
      expect(getWeatherQuality(80)).toBe("excellent");
    });

    it('returns "good" for scores 60-79', () => {
      expect(getWeatherQuality(79)).toBe("good");
      expect(getWeatherQuality(70)).toBe("good");
      expect(getWeatherQuality(60)).toBe("good");
    });

    it('returns "fair" for scores 40-59', () => {
      expect(getWeatherQuality(59)).toBe("fair");
      expect(getWeatherQuality(50)).toBe("fair");
      expect(getWeatherQuality(40)).toBe("fair");
    });

    it('returns "poor" for scores 0-39', () => {
      expect(getWeatherQuality(39)).toBe("poor");
      expect(getWeatherQuality(20)).toBe("poor");
      expect(getWeatherQuality(0)).toBe("poor");
    });

    describe("boundary cases", () => {
      it("handles exact boundary at 80", () => {
        expect(getWeatherQuality(80)).toBe("excellent");
      });

      it("handles exact boundary at 79", () => {
        expect(getWeatherQuality(79)).toBe("good");
      });

      it("handles exact boundary at 60", () => {
        expect(getWeatherQuality(60)).toBe("good");
      });

      it("handles exact boundary at 59", () => {
        expect(getWeatherQuality(59)).toBe("fair");
      });

      it("handles exact boundary at 40", () => {
        expect(getWeatherQuality(40)).toBe("fair");
      });

      it("handles exact boundary at 39", () => {
        expect(getWeatherQuality(39)).toBe("poor");
      });
    });
  });

  describe("getRejectionReason", () => {
    it("returns empty array when weather is acceptable", () => {
      const weather = createWeather();
      const preference = createPreference();

      const reasons = getRejectionReason(weather, preference);
      expect(reasons).toHaveLength(0);
    });

    it("returns precipitation reason when exceeded", () => {
      const weather = createWeather({ precipitation: 65 });
      const preference = createPreference({ maxPrecipitation: 20 });

      const reasons = getRejectionReason(weather, preference);
      expect(reasons).toContain("Precipitation too high (65% vs 20% max)");
    });

    it("returns wind reason when exceeded", () => {
      const weather = createWeather({ windSpeed: 45 });
      const preference = createPreference({ maxWindSpeed: 25 });

      const reasons = getRejectionReason(weather, preference);
      expect(reasons).toContain("Wind speed exceeds limit (45 km/h vs 25 km/h max)");
    });

    it("does not return wind reason when maxWindSpeed is null", () => {
      const weather = createWeather({ windSpeed: 100 });
      const preference = createPreference({ maxWindSpeed: null });

      const reasons = getRejectionReason(weather, preference);
      expect(reasons.some((r) => r.includes("Wind"))).toBe(false);
    });

    it("returns low temperature reason when below min", () => {
      const weather = createWeather({ temperature: -2 });
      const preference = createPreference({ minTemperature: 0 });

      const reasons = getRejectionReason(weather, preference);
      expect(reasons).toContain("Temperature below minimum (-2°C vs 0°C min)");
    });

    it("does not return low temperature reason when minTemperature is null", () => {
      const weather = createWeather({ temperature: -50 });
      const preference = createPreference({ minTemperature: null });

      const reasons = getRejectionReason(weather, preference);
      expect(reasons.some((r) => r.includes("below minimum"))).toBe(false);
    });

    it("returns high temperature reason when above max", () => {
      const weather = createWeather({ temperature: 32 });
      const preference = createPreference({ maxTemperature: 25 });

      const reasons = getRejectionReason(weather, preference);
      expect(reasons).toContain("Temperature above maximum (32°C vs 25°C max)");
    });

    it("does not return high temperature reason when maxTemperature is null", () => {
      const weather = createWeather({ temperature: 50 });
      const preference = createPreference({ maxTemperature: null });

      const reasons = getRejectionReason(weather, preference);
      expect(reasons.some((r) => r.includes("above maximum"))).toBe(false);
    });

    it("returns condition reason when in avoid list", () => {
      const weather = createWeather({ condition: "Heavy Rain" });
      const preference = createPreference({
        avoidConditions: ["Heavy Rain", "Thunderstorm"],
      });

      const reasons = getRejectionReason(weather, preference);
      expect(reasons).toContain("Conditions include Heavy Rain which should be avoided");
    });

    it("returns combined reasons when multiple failures", () => {
      const weather = createWeather({
        precipitation: 80,
        windSpeed: 40,
        temperature: -5,
        condition: "Heavy Rain",
      });
      const preference = createPreference({
        maxPrecipitation: 20,
        maxWindSpeed: 25,
        minTemperature: 0,
      });

      const reasons = getRejectionReason(weather, preference);
      expect(reasons.length).toBeGreaterThanOrEqual(4);
      expect(reasons.some((r) => r.includes("Precipitation"))).toBe(true);
      expect(reasons.some((r) => r.includes("Wind"))).toBe(true);
      expect(reasons.some((r) => r.includes("Temperature"))).toBe(true);
      expect(reasons.some((r) => r.includes("Conditions"))).toBe(true);
    });

    it("rounds values in rejection messages", () => {
      const weather = createWeather({
        precipitation: 65.7,
        windSpeed: 45.3,
        temperature: -2.8,
      });
      const preference = createPreference({
        maxPrecipitation: 20.5,
        maxWindSpeed: 25.5,
        minTemperature: 0.5,
      });

      const reasons = getRejectionReason(weather, preference);
      // Should contain rounded values
      expect(reasons.some((r) => r.includes("66%") || r.includes("65%"))).toBe(true);
    });

    it("only reports first matching avoided condition", () => {
      const weather = createWeather({ condition: "Heavy Rain Thunderstorm" });
      const preference = createPreference({
        avoidConditions: ["Heavy Rain", "Thunderstorm"],
      });

      const reasons = getRejectionReason(weather, preference);
      const conditionReasons = reasons.filter((r) => r.includes("Conditions include"));
      expect(conditionReasons).toHaveLength(1);
    });
  });

  describe("toWeatherPreferenceThresholds", () => {
    it("converts Prisma WeatherPreference to thresholds interface", () => {
      const prismaPreference = {
        id: "test-id",
        runType: RunType.LONG_RUN,
        maxPrecipitation: 20,
        maxWindSpeed: 25,
        minTemperature: 0,
        maxTemperature: 25,
        avoidConditions: ["Heavy Rain"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const thresholds = toWeatherPreferenceThresholds(prismaPreference);

      expect(thresholds.runType).toBe(RunType.LONG_RUN);
      expect(thresholds.maxPrecipitation).toBe(20);
      expect(thresholds.maxWindSpeed).toBe(25);
      expect(thresholds.minTemperature).toBe(0);
      expect(thresholds.maxTemperature).toBe(25);
      expect(thresholds.avoidConditions).toEqual(["Heavy Rain"]);
      // Should not have database metadata
      expect((thresholds as unknown as Record<string, unknown>).id).toBeUndefined();
      expect((thresholds as unknown as Record<string, unknown>).createdAt).toBeUndefined();
      expect((thresholds as unknown as Record<string, unknown>).updatedAt).toBeUndefined();
    });

    it("preserves null values", () => {
      const prismaPreference = {
        id: "test-id",
        runType: RunType.RACE,
        maxPrecipitation: 100,
        maxWindSpeed: null,
        minTemperature: null,
        maxTemperature: null,
        avoidConditions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const thresholds = toWeatherPreferenceThresholds(prismaPreference);

      expect(thresholds.maxWindSpeed).toBeNull();
      expect(thresholds.minTemperature).toBeNull();
      expect(thresholds.maxTemperature).toBeNull();
    });
  });

  describe("type exports", () => {
    it("exports WeatherDataForScoring type", () => {
      const weather: WeatherDataForScoring = {
        condition: "Clear",
        temperature: 15,
        feelsLike: 14,
        precipitation: 10,
        humidity: 50,
        windSpeed: 10,
      };
      expect(weather).toBeDefined();
    });

    it("exports WeatherPreferenceThresholds type", () => {
      const preference: WeatherPreferenceThresholds = {
        runType: RunType.LONG_RUN,
        maxPrecipitation: 20,
        maxWindSpeed: 25,
        minTemperature: 0,
        maxTemperature: 25,
        avoidConditions: [],
      };
      expect(preference).toBeDefined();
    });

    it("exports WeatherQuality type", () => {
      const quality: WeatherQuality = "excellent";
      expect(quality).toBeDefined();
    });

    it("re-exports RunType from Prisma", () => {
      expect(RunType.LONG_RUN).toBeDefined();
      expect(RunType.EASY_RUN).toBeDefined();
      expect(RunType.TEMPO_RUN).toBeDefined();
      expect(RunType.INTERVAL_RUN).toBeDefined();
      expect(RunType.RECOVERY_RUN).toBeDefined();
      expect(RunType.RACE).toBeDefined();
    });
  });
});
