/**
 * Integration tests for database seed script
 *
 * These tests verify that the seed script creates the expected data
 * in the database. They require a real database connection and are
 * skipped when DATABASE_URL is not available (e.g., in unit-tests CI job).
 */

import { db } from "@/server/db";

// Skip all tests if no real database connection is available
const describeFn = process.env.DATABASE_URL ? describe : describe.skip;

describeFn("Database Seed", () => {
  describe("UserSettings", () => {
    it("creates UserSettings with default location Balbriggan, IE", async () => {
      const userSettings = await db.userSettings.findFirst({
        where: { id: "default-settings" },
      });

      expect(userSettings).not.toBeNull();
      expect(userSettings?.defaultLocation).toBe("Balbriggan, IE");
      expect(userSettings?.latitude).toBe(53.6108);
      expect(userSettings?.longitude).toBe(-6.1817);
    });

    it("creates UserSettings with correct race information", async () => {
      const userSettings = await db.userSettings.findFirst({
        where: { id: "default-settings" },
      });

      expect(userSettings).not.toBeNull();
      expect(userSettings?.raceName).toBe(
        "Life Style Sports Fastlane Summer Edition 2026"
      );
      expect(userSettings?.targetTime).toBe("2:00:00");
      expect(userSettings?.raceDate).toEqual(
        new Date("2026-05-17T10:00:00.000Z")
      );
    });

    it("follows singleton pattern with known ID", async () => {
      const count = await db.userSettings.count();
      expect(count).toBe(1);

      const settings = await db.userSettings.findUnique({
        where: { id: "default-settings" },
      });
      expect(settings).not.toBeNull();
    });
  });

  describe("WeatherCache", () => {
    it("table exists and is empty after seed", async () => {
      const count = await db.weatherCache.count();
      expect(count).toBe(0);
    });

    it("can create and query weather cache entries", async () => {
      const testEntry = await db.weatherCache.create({
        data: {
          location: "Test Location",
          latitude: 53.0,
          longitude: -6.0,
          datetime: new Date("2025-11-28T12:00:00.000Z"),
          condition: "Clear",
          description: "Clear sky",
          temperature: 15.5,
          feelsLike: 14.0,
          precipitation: 0,
          humidity: 65,
          windSpeed: 10.5,
          windDirection: 180,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        },
      });

      expect(testEntry.id).toBeDefined();
      expect(testEntry.location).toBe("Test Location");

      // Clean up test data
      await db.weatherCache.delete({ where: { id: testEntry.id } });
    });

    it("enforces unique constraint on location + datetime", async () => {
      const datetime = new Date("2025-11-28T14:00:00.000Z");
      const expiresAt = new Date(Date.now() + 3600000);

      // Create first entry
      const first = await db.weatherCache.create({
        data: {
          location: "Unique Test",
          latitude: 53.0,
          longitude: -6.0,
          datetime,
          condition: "Clear",
          description: "Clear sky",
          temperature: 15.5,
          feelsLike: 14.0,
          precipitation: 0,
          humidity: 65,
          windSpeed: 10.5,
          windDirection: 180,
          expiresAt,
        },
      });

      // Try to create duplicate
      await expect(
        db.weatherCache.create({
          data: {
            location: "Unique Test",
            latitude: 53.0,
            longitude: -6.0,
            datetime, // Same datetime
            condition: "Cloudy",
            description: "Cloudy sky",
            temperature: 12.0,
            feelsLike: 10.0,
            precipitation: 30,
            humidity: 80,
            windSpeed: 15.0,
            windDirection: 270,
            expiresAt,
          },
        })
      ).rejects.toThrow();

      // Clean up
      await db.weatherCache.delete({ where: { id: first.id } });
    });
  });
});
