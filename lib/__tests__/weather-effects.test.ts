import { parseCondition, parseConditions, getIntensityFromPrecipitation } from "../weather-effects";

describe("weather-effects utilities", () => {
  describe("getIntensityFromPrecipitation", () => {
    it('returns "light" for precipitation <= 30%', () => {
      expect(getIntensityFromPrecipitation(0)).toBe("light");
      expect(getIntensityFromPrecipitation(15)).toBe("light");
      expect(getIntensityFromPrecipitation(30)).toBe("light");
    });

    it('returns "moderate" for precipitation 31-60%', () => {
      expect(getIntensityFromPrecipitation(31)).toBe("moderate");
      expect(getIntensityFromPrecipitation(45)).toBe("moderate");
      expect(getIntensityFromPrecipitation(60)).toBe("moderate");
    });

    it('returns "heavy" for precipitation > 60%', () => {
      expect(getIntensityFromPrecipitation(61)).toBe("heavy");
      expect(getIntensityFromPrecipitation(80)).toBe("heavy");
      expect(getIntensityFromPrecipitation(100)).toBe("heavy");
    });
  });

  describe("parseCondition", () => {
    describe("rain conditions", () => {
      it('returns rain type with light intensity for "Light Rain"', () => {
        const result = parseCondition("Light Rain");
        expect(result).toEqual({ type: "rain", intensity: "light" });
      });

      it('returns rain type with heavy intensity for "Heavy Rain"', () => {
        const result = parseCondition("Heavy Rain");
        expect(result).toEqual({ type: "rain", intensity: "heavy" });
      });

      it('returns rain type with moderate intensity for "Moderate Rain"', () => {
        const result = parseCondition("Moderate Rain");
        expect(result).toEqual({ type: "rain", intensity: "moderate" });
      });

      it('returns rain type with moderate intensity for "Rain" (no modifier)', () => {
        const result = parseCondition("Rain");
        expect(result).toEqual({ type: "rain", intensity: "moderate" });
      });

      it('returns rain type with light intensity for "Light Drizzle"', () => {
        const result = parseCondition("Light Drizzle");
        expect(result).toEqual({ type: "rain", intensity: "light" });
      });

      it('returns rain type for "Thunderstorm"', () => {
        const result = parseCondition("Thunderstorm");
        expect(result).toEqual({ type: "rain", intensity: "moderate" });
      });

      it('returns rain type for "Rain Showers"', () => {
        const result = parseCondition("Rain Showers");
        expect(result).toEqual({ type: "rain", intensity: "moderate" });
      });

      it("uses precipitation percentage when no modifier present", () => {
        expect(parseCondition("Rain", 25)).toEqual({
          type: "rain",
          intensity: "light",
        });
        expect(parseCondition("Rain", 45)).toEqual({
          type: "rain",
          intensity: "moderate",
        });
        expect(parseCondition("Rain", 75)).toEqual({
          type: "rain",
          intensity: "heavy",
        });
      });

      it("prefers modifier over precipitation percentage", () => {
        const result = parseCondition("Light Rain", 90);
        expect(result).toEqual({ type: "rain", intensity: "light" });
      });
    });

    describe("snow conditions", () => {
      it('returns snow type with light intensity for "Light Snow"', () => {
        const result = parseCondition("Light Snow");
        expect(result).toEqual({ type: "snow", intensity: "light" });
      });

      it('returns snow type with heavy intensity for "Heavy Snow"', () => {
        const result = parseCondition("Heavy Snow");
        expect(result).toEqual({ type: "snow", intensity: "heavy" });
      });

      it('returns snow type with moderate intensity for "Snow" (no modifier)', () => {
        const result = parseCondition("Snow");
        expect(result).toEqual({ type: "snow", intensity: "moderate" });
      });

      it('returns snow type for "Sleet"', () => {
        const result = parseCondition("Sleet");
        expect(result).toEqual({ type: "snow", intensity: "moderate" });
      });

      it('returns snow type for "Blizzard"', () => {
        const result = parseCondition("Blizzard");
        expect(result).toEqual({ type: "snow", intensity: "moderate" });
      });

      it("uses precipitation percentage when no modifier present", () => {
        expect(parseCondition("Snow", 20)).toEqual({
          type: "snow",
          intensity: "light",
        });
      });
    });

    describe("fog/mist conditions", () => {
      it('returns fog type for "Fog"', () => {
        const result = parseCondition("Fog");
        expect(result).toEqual({ type: "fog", intensity: "moderate" });
      });

      it('returns fog type for "Mist"', () => {
        const result = parseCondition("Mist");
        expect(result).toEqual({ type: "fog", intensity: "moderate" });
      });

      it('returns fog type for "Haze"', () => {
        const result = parseCondition("Haze");
        expect(result).toEqual({ type: "fog", intensity: "moderate" });
      });

      it('returns fog type with light intensity for "Light Fog"', () => {
        const result = parseCondition("Light Fog");
        expect(result).toEqual({ type: "fog", intensity: "light" });
      });

      it('returns fog type with heavy intensity for "Heavy Fog"', () => {
        const result = parseCondition("Heavy Fog");
        expect(result).toEqual({ type: "fog", intensity: "heavy" });
      });
    });

    describe("sunny/clear conditions", () => {
      it('returns sun type for "Sunny"', () => {
        const result = parseCondition("Sunny");
        expect(result).toEqual({ type: "sun", intensity: "moderate" });
      });

      it('returns sun type for "Clear"', () => {
        const result = parseCondition("Clear");
        expect(result).toEqual({ type: "sun", intensity: "moderate" });
      });

      it('returns sun type for "Fair"', () => {
        const result = parseCondition("Fair");
        expect(result).toEqual({ type: "sun", intensity: "moderate" });
      });
    });

    describe("cloudy conditions", () => {
      it('returns cloud type for "Cloudy"', () => {
        const result = parseCondition("Cloudy");
        expect(result).toEqual({ type: "cloud", intensity: "moderate" });
      });

      it('returns cloud type for "Overcast"', () => {
        const result = parseCondition("Overcast");
        expect(result).toEqual({ type: "cloud", intensity: "moderate" });
      });

      it('returns cloud type with heavy intensity for "Heavy Clouds"', () => {
        const result = parseCondition("Heavy Clouds");
        expect(result).toEqual({ type: "cloud", intensity: "heavy" });
      });
    });

    describe("partly cloudy conditions", () => {
      it('returns cloud type with light intensity for "Partly Cloudy"', () => {
        const result = parseCondition("Partly Cloudy");
        expect(result).toEqual({ type: "cloud", intensity: "light" });
      });

      it('returns cloud type with light intensity for "Partly Sunny"', () => {
        const result = parseCondition("Partly Sunny");
        expect(result).toEqual({ type: "cloud", intensity: "light" });
      });
    });

    describe("unknown conditions", () => {
      it("returns null for unknown conditions", () => {
        expect(parseCondition("Unknown Weather")).toBeNull();
        expect(parseCondition("")).toBeNull();
        expect(parseCondition("Windy")).toBeNull();
      });
    });

    describe("case insensitivity", () => {
      it("handles uppercase conditions", () => {
        expect(parseCondition("LIGHT RAIN")).toEqual({
          type: "rain",
          intensity: "light",
        });
      });

      it("handles mixed case conditions", () => {
        expect(parseCondition("LiGhT sNoW")).toEqual({
          type: "snow",
          intensity: "light",
        });
      });
    });
  });

  describe("parseConditions", () => {
    it("returns array with single effect for simple conditions", () => {
      const result = parseConditions("Light Rain");
      expect(result).toEqual([{ type: "rain", intensity: "light" }]);
    });

    it('returns cloud and sun effects for "Partly Cloudy"', () => {
      const result = parseConditions("Partly Cloudy");
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ type: "cloud", intensity: "light" });
      expect(result).toContainEqual({ type: "sun", intensity: "light" });
    });

    it('returns cloud and sun effects for "Partly Sunny"', () => {
      const result = parseConditions("Partly Sunny");
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ type: "cloud", intensity: "light" });
      expect(result).toContainEqual({ type: "sun", intensity: "light" });
    });

    it("returns empty array for unknown conditions", () => {
      const result = parseConditions("Unknown");
      expect(result).toEqual([]);
    });

    it("passes precipitation to intensity calculation", () => {
      const result = parseConditions("Rain", 75);
      expect(result).toEqual([{ type: "rain", intensity: "heavy" }]);
    });
  });
});
