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
    it("creates UserSettings with default location Balbriggan", async () => {
      const userSettings = await db.userSettings.findFirst({
        where: { id: "default-settings" },
      });

      expect(userSettings).not.toBeNull();
      // Accept both "Balbriggan" and "Balbriggan, IE" as valid (user may have modified location)
      expect(userSettings?.defaultLocation).toMatch(/^Balbriggan/);
      expect(userSettings?.latitude).toBe(53.6108);
      expect(userSettings?.longitude).toBe(-6.1817);
    });

    it("creates UserSettings with correct race information", async () => {
      const userSettings = await db.userSettings.findFirst({
        where: { id: "default-settings" },
      });

      expect(userSettings).not.toBeNull();
      expect(userSettings?.raceName).toBe("Life Style Sports Fastlane Summer Edition 2026");
      expect(userSettings?.targetTime).toBe("2:00:00");
      expect(userSettings?.raceDate).toEqual(new Date("2026-05-17T10:00:00.000Z"));
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
    it("table exists and is accessible", async () => {
      // Verify the table exists and can be queried
      // (may contain cached weather data from API usage)
      const count = await db.weatherCache.count();
      expect(count).toBeGreaterThanOrEqual(0);
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

  describe("TrainingPlan", () => {
    it("creates exactly 34 TrainingPlan entries", async () => {
      const count = await db.trainingPlan.count();
      expect(count).toBe(34);
    });

    it("creates unique week numbers 1-34", async () => {
      const plans = await db.trainingPlan.findMany({
        select: { weekNumber: true },
        orderBy: { weekNumber: "asc" },
      });

      const weekNumbers = plans.map((p) => p.weekNumber);
      expect(weekNumbers).toHaveLength(34);
      expect(weekNumbers[0]).toBe(1);
      expect(weekNumbers[33]).toBe(34);

      // Check all week numbers are unique and sequential
      for (let i = 0; i < 34; i++) {
        expect(weekNumbers[i]).toBe(i + 1);
      }
    });

    it("has correct phase progression", async () => {
      const plans = await db.trainingPlan.findMany({
        select: { weekNumber: true, phase: true },
        orderBy: { weekNumber: "asc" },
      });

      // Weeks 1-15: BASE_BUILDING
      for (let i = 0; i < 15; i++) {
        expect(plans[i]?.phase).toBe("BASE_BUILDING");
      }

      // Weeks 16-23: BASE_EXTENSION (or may include RECOVERY phase for injury periods)
      // The seed creates all BASE_EXTENSION, but live DB may have RECOVERY in W17-19
      const hasRecoveryPhase = plans.some((p) => p.phase === "RECOVERY");
      if (hasRecoveryPhase) {
        // Live DB with RECOVERY phase: W16 BASE_EXTENSION, W17-19 RECOVERY, W20-23 BASE_EXTENSION
        expect(plans[15]?.phase).toBe("BASE_EXTENSION");
        for (let i = 16; i < 19; i++) {
          expect(plans[i]?.phase).toBe("RECOVERY");
        }
        for (let i = 19; i < 23; i++) {
          expect(plans[i]?.phase).toBe("BASE_EXTENSION");
        }
      } else {
        // Fresh seed: W16-23 all BASE_EXTENSION
        for (let i = 15; i < 23; i++) {
          expect(plans[i]?.phase).toBe("BASE_EXTENSION");
        }
      }

      // Weeks 24-30: SPEED_DEVELOPMENT
      for (let i = 23; i < 30; i++) {
        expect(plans[i]?.phase).toBe("SPEED_DEVELOPMENT");
      }

      // Weeks 31-34: PEAK_TAPER
      for (let i = 30; i < 34; i++) {
        expect(plans[i]?.phase).toBe("PEAK_TAPER");
      }
    });

    it("has week dates spanning Sep 21, 2025 to May 16, 2026", async () => {
      const firstWeek = await db.trainingPlan.findFirst({
        where: { weekNumber: 1 },
      });
      const lastWeek = await db.trainingPlan.findFirst({
        where: { weekNumber: 34 },
      });

      // Week 1 starts on Sep 21, 2025 (Sunday)
      expect(firstWeek?.weekStart).toEqual(new Date("2025-09-21T00:00:00.000Z"));

      // Week 34 ends on May 16, 2026 (Saturday)
      // Check the date portion only (time may vary based on seeding)
      const lastWeekEndDate = lastWeek?.weekEnd ? new Date(lastWeek.weekEnd) : null;
      expect(lastWeekEndDate?.getUTCFullYear()).toBe(2026);
      expect(lastWeekEndDate?.getUTCMonth()).toBe(4); // May is month 4 (0-indexed)
      expect(lastWeekEndDate?.getUTCDate()).toBe(16);
    });

    it("has appropriate long run targets for each phase", async () => {
      const plans = await db.trainingPlan.findMany({
        select: { weekNumber: true, longRunTarget: true, phase: true },
        orderBy: { weekNumber: "asc" },
      });

      // BASE_BUILDING: 7km → 14km
      const baseBuildingPlans = plans.filter((p) => p.phase === "BASE_BUILDING");
      expect(baseBuildingPlans[0]?.longRunTarget).toBe(7);
      expect(baseBuildingPlans[baseBuildingPlans.length - 1]?.longRunTarget).toBe(14);

      // BASE_EXTENSION: targets vary based on whether RECOVERY phase exists
      const baseExtensionPlans = plans.filter((p) => p.phase === "BASE_EXTENSION");
      const hasRecoveryPhase = plans.some((p) => p.phase === "RECOVERY");
      if (hasRecoveryPhase) {
        // Live DB: W16 has 0km (interrupted), W20-23 has 6-14km
        expect(baseExtensionPlans[0]?.longRunTarget).toBe(0);
        expect(baseExtensionPlans[baseExtensionPlans.length - 1]?.longRunTarget).toBe(14);
      } else {
        // Fresh seed: 15km → 18km
        expect(baseExtensionPlans[0]?.longRunTarget).toBe(15);
        expect(baseExtensionPlans[baseExtensionPlans.length - 1]?.longRunTarget).toBe(18);
      }

      // SPEED_DEVELOPMENT: peaks at 20km
      const speedDevPlans = plans.filter((p) => p.phase === "SPEED_DEVELOPMENT");
      const maxLongRun = Math.max(...speedDevPlans.map((p) => p.longRunTarget));
      expect(maxLongRun).toBe(20);

      // PEAK_TAPER: ends at 5km (race week)
      const peakTaperPlans = plans.filter((p) => p.phase === "PEAK_TAPER");
      expect(peakTaperPlans[peakTaperPlans.length - 1]?.longRunTarget).toBe(5);
    });

    it("has appropriate weekly mileage targets", async () => {
      const plans = await db.trainingPlan.findMany({
        select: { weekNumber: true, weeklyMileageTarget: true, phase: true },
        orderBy: { weekNumber: "asc" },
      });

      // BASE_BUILDING: 15km → 27km
      const baseBuildingPlans = plans.filter((p) => p.phase === "BASE_BUILDING");
      expect(baseBuildingPlans[0]?.weeklyMileageTarget).toBe(15);
      expect(baseBuildingPlans[baseBuildingPlans.length - 1]?.weeklyMileageTarget).toBe(27);

      // PEAK_TAPER: ends at 10km (race week)
      const peakTaperPlans = plans.filter((p) => p.phase === "PEAK_TAPER");
      expect(peakTaperPlans[peakTaperPlans.length - 1]?.weeklyMileageTarget).toBe(10);
    });
  });

  describe("WeatherPreference", () => {
    it("creates entries for all 6 run types", async () => {
      const count = await db.weatherPreference.count();
      expect(count).toBe(6);
    });

    it("has unique RunType for each entry", async () => {
      const preferences = await db.weatherPreference.findMany({
        select: { runType: true },
      });

      const runTypes = preferences.map((p) => p.runType);
      const expectedTypes = [
        "LONG_RUN",
        "EASY_RUN",
        "TEMPO_RUN",
        "INTERVAL_RUN",
        "RECOVERY_RUN",
        "RACE",
      ];

      expect(runTypes).toHaveLength(6);
      expectedTypes.forEach((type) => {
        expect(runTypes).toContain(type);
      });
    });

    it("has correct LONG_RUN preferences", async () => {
      const longRun = await db.weatherPreference.findUnique({
        where: { runType: "LONG_RUN" },
      });

      expect(longRun).not.toBeNull();
      expect(longRun?.maxPrecipitation).toBe(20);
      expect(longRun?.maxWindSpeed).toBe(25);
      expect(longRun?.minTemperature).toBe(0);
      expect(longRun?.maxTemperature).toBe(25);
      expect(longRun?.avoidConditions).toContain("Heavy Rain");
      expect(longRun?.avoidConditions).toContain("Thunderstorm");
      expect(longRun?.avoidConditions).toContain("Heavy Snow");
    });

    it("has correct EASY_RUN preferences", async () => {
      const easyRun = await db.weatherPreference.findUnique({
        where: { runType: "EASY_RUN" },
      });

      expect(easyRun).not.toBeNull();
      expect(easyRun?.maxPrecipitation).toBe(50);
      expect(easyRun?.maxWindSpeed).toBe(35);
      expect(easyRun?.minTemperature).toBe(-5);
      expect(easyRun?.maxTemperature).toBe(30);
      expect(easyRun?.avoidConditions).toContain("Thunderstorm");
      expect(easyRun?.avoidConditions).toContain("Heavy Snow");
    });

    it("has correct TEMPO_RUN preferences", async () => {
      const tempoRun = await db.weatherPreference.findUnique({
        where: { runType: "TEMPO_RUN" },
      });

      expect(tempoRun).not.toBeNull();
      expect(tempoRun?.maxPrecipitation).toBe(30);
      expect(tempoRun?.maxWindSpeed).toBe(25);
      expect(tempoRun?.minTemperature).toBe(5);
      expect(tempoRun?.maxTemperature).toBe(25);
    });

    it("has correct INTERVAL_RUN preferences", async () => {
      const intervalRun = await db.weatherPreference.findUnique({
        where: { runType: "INTERVAL_RUN" },
      });

      expect(intervalRun).not.toBeNull();
      expect(intervalRun?.maxPrecipitation).toBe(30);
      expect(intervalRun?.maxWindSpeed).toBe(25);
      expect(intervalRun?.minTemperature).toBe(5);
      expect(intervalRun?.maxTemperature).toBe(25);
    });

    it("has correct RECOVERY_RUN preferences", async () => {
      const recoveryRun = await db.weatherPreference.findUnique({
        where: { runType: "RECOVERY_RUN" },
      });

      expect(recoveryRun).not.toBeNull();
      expect(recoveryRun?.maxPrecipitation).toBe(60);
      expect(recoveryRun?.maxWindSpeed).toBe(40);
      expect(recoveryRun?.minTemperature).toBe(-5);
      expect(recoveryRun?.maxTemperature).toBe(30);
      expect(recoveryRun?.avoidConditions).toContain("Thunderstorm");
    });

    it("has correct RACE preferences (no limits)", async () => {
      const race = await db.weatherPreference.findUnique({
        where: { runType: "RACE" },
      });

      expect(race).not.toBeNull();
      expect(race?.maxPrecipitation).toBe(100);
      expect(race?.maxWindSpeed).toBeNull();
      expect(race?.minTemperature).toBeNull();
      expect(race?.maxTemperature).toBeNull();
      expect(race?.avoidConditions).toHaveLength(0);
    });
  });

  describe("Run (Historical Runs)", () => {
    // Note: These tests check seeded historical runs. User-accepted run suggestions
    // may add additional runs to the database, so we use minimum counts rather than exact values.

    it("creates at least 22 historical runs from seed", async () => {
      const count = await db.run.count();
      expect(count).toBeGreaterThanOrEqual(22);
    });

    it("seeded historical runs (before Nov 27, 2025) are marked as completed", async () => {
      // Only check runs that were definitely seeded (Sept to mid-Nov 2025)
      // Using Nov 27 as cutoff since seed data ends before that date
      // User-accepted runs for dates after that may not be completed
      const incompleteSeededRuns = await db.run.count({
        where: {
          completed: false,
          date: {
            lt: new Date("2025-11-27T00:00:00.000Z"),
          },
        },
      });
      expect(incompleteSeededRuns).toBe(0);
    });

    it("has at least 22 unique dates for runs", async () => {
      const runs = await db.run.findMany({
        select: { date: true },
      });

      const dates = runs.map((r) => r.date.toISOString());
      const uniqueDates = new Set(dates);
      expect(uniqueDates.size).toBeGreaterThanOrEqual(22);
    });

    it("has seeded runs spanning Sept to Nov 2025", async () => {
      // Check seeded runs only (before Dec 2025)
      const seededRuns = await db.run.findMany({
        where: {
          date: {
            lt: new Date("2025-12-01T00:00:00.000Z"),
          },
        },
        select: { date: true },
        orderBy: { date: "asc" },
      });

      expect(seededRuns.length).toBeGreaterThanOrEqual(22);

      // First run should be in September 2025
      expect(seededRuns[0]?.date.getFullYear()).toBe(2025);
      expect(seededRuns[0]?.date.getMonth()).toBe(8); // September (0-indexed)

      // Last seeded run should be in November 2025
      const lastSeededRun = seededRuns[seededRuns.length - 1];
      expect(lastSeededRun?.date.getFullYear()).toBe(2025);
      expect(lastSeededRun?.date.getMonth()).toBe(10); // November (0-indexed)
    });

    it("has mix of LONG_RUN and EASY_RUN types", async () => {
      const runTypes = await db.run.groupBy({
        by: ["type"],
        _count: true,
      });

      const typeMap = Object.fromEntries(runTypes.map((r) => [r.type, r._count]));

      // Should have LONG_RUN entries
      expect(typeMap["LONG_RUN"]).toBeGreaterThan(0);
      // Should have EASY_RUN entries
      expect(typeMap["EASY_RUN"]).toBeGreaterThan(0);
    });

    it("has valid pace format (M:SS or MM:SS) for completed/scheduled runs", async () => {
      const runs = await db.run.findMany({
        select: { pace: true, distance: true },
      });

      // Pace can be M:SS/MM:SS format OR "-" for skipped/cancelled runs
      const paceRegex = /^(\d{1,2}:\d{2}|-)$/;
      runs.forEach((run) => {
        expect(run.pace).toMatch(paceRegex);
        // If distance is 0 (skipped run), pace should be "-"
        if (run.distance === 0) {
          expect(run.pace).toBe("-");
        }
      });
    });

    it("has valid duration format", async () => {
      const runs = await db.run.findMany({
        select: { duration: true, distance: true },
      });

      // Duration can be M:SS, MM:SS, HH:MM:SS format OR "-" for skipped/cancelled runs
      const durationRegex = /^(\d{1,2}:\d{2}(:\d{2})?|-)$/;
      runs.forEach((run) => {
        expect(run.duration).toMatch(durationRegex);
        // If distance is 0 (skipped run), duration should be "-"
        if (run.distance === 0) {
          expect(run.duration).toBe("-");
        }
      });
    });

    it("has non-negative distances", async () => {
      const runs = await db.run.findMany({
        select: { distance: true },
      });

      // Distance should be >= 0 (0 for skipped runs, positive for actual runs)
      runs.forEach((run) => {
        expect(run.distance).toBeGreaterThanOrEqual(0);
      });
    });

    it("has positive distances for non-skipped runs", async () => {
      const runs = await db.run.findMany({
        select: { distance: true, pace: true },
        where: { pace: { not: "-" } },
      });

      runs.forEach((run) => {
        expect(run.distance).toBeGreaterThan(0);
      });
    });

    it("can be queried by date range", async () => {
      const octoberRuns = await db.run.findMany({
        where: {
          date: {
            gte: new Date("2025-10-01T00:00:00.000Z"),
            lt: new Date("2025-11-01T00:00:00.000Z"),
          },
        },
      });

      expect(octoberRuns.length).toBeGreaterThan(0);
      octoberRuns.forEach((run) => {
        expect(run.date.getMonth()).toBe(9); // October (0-indexed)
      });
    });
  });
});
