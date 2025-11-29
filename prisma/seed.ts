/**
 * Database Seed Script
 *
 * Seeds the database with initial data for the RainCheck application.
 * This creates:
 * - UserSettings: Singleton record with default race configuration
 * - TrainingPlan: 24 weeks of half-marathon training (Nov 30, 2025 - May 16, 2026)
 * - WeatherPreference: Weather tolerance thresholds for each run type
 *
 * Training Plan Structure (weeks run Sun-Sat):
 * - Long run on Sundays
 * - Easy runs on Wednesdays and Fridays
 *
 * Phases:
 * - BASE_BUILDING (Weeks 1-6): Build from 12km → 14km long runs
 * - BASE_EXTENSION (Weeks 7-14): Extend to 15km → 18km long runs
 * - SPEED_DEVELOPMENT (Weeks 15-21): Peak at 20km long runs
 * - PEAK_TAPER (Weeks 22-24): Taper for race, 16km → 8km long runs
 *
 * Race: May 17, 2026 (Sunday after week 24)
 *
 * Usage:
 *   npx prisma db seed
 */

import { PrismaClient, Phase, RunType } from "@prisma/client";

const prisma = new PrismaClient();

// Training plan start date: November 23, 2025 (Sunday, 25 weeks before race on May 17, 2026)
// Weeks run Sunday to Saturday
// Note: Adjusted to ensure current date falls within a training week for testing
const TRAINING_START = new Date("2025-11-23T00:00:00.000Z");

/**
 * Training plan data for 24 weeks
 * Based on actual training progression from runs.csv
 * Current fitness: ~12km long run (as of Nov 23, 2025)
 * Weekly structure: Long run (Sun) + Easy run (Wed) + Easy run (Fri)
 */
const trainingPlanData: Array<{
  weekNumber: number;
  phase: Phase;
  longRunTarget: number;
  weeklyMileageTarget: number;
  notes?: string;
}> = [
  // BASE_BUILDING (Weeks 1-6): Building consistency, 12km → 14km long runs
  {
    weekNumber: 1,
    phase: Phase.BASE_BUILDING,
    longRunTarget: 12,
    weeklyMileageTarget: 24,
    notes: "First structured week, maintain current fitness",
  },
  { weekNumber: 2, phase: Phase.BASE_BUILDING, longRunTarget: 12, weeklyMileageTarget: 24 },
  { weekNumber: 3, phase: Phase.BASE_BUILDING, longRunTarget: 13, weeklyMileageTarget: 25 },
  {
    weekNumber: 4,
    phase: Phase.BASE_BUILDING,
    longRunTarget: 13,
    weeklyMileageTarget: 25,
    notes: "Christmas week - maintain consistency",
  },
  {
    weekNumber: 5,
    phase: Phase.BASE_BUILDING,
    longRunTarget: 14,
    weeklyMileageTarget: 26,
    notes: "New Year week",
  },
  {
    weekNumber: 6,
    phase: Phase.BASE_BUILDING,
    longRunTarget: 14,
    weeklyMileageTarget: 26,
    notes: "Base building complete",
  },

  // BASE_EXTENSION (Weeks 7-14): Extending endurance, 15km → 18km long runs
  { weekNumber: 7, phase: Phase.BASE_EXTENSION, longRunTarget: 15, weeklyMileageTarget: 28 },
  { weekNumber: 8, phase: Phase.BASE_EXTENSION, longRunTarget: 15, weeklyMileageTarget: 28 },
  { weekNumber: 9, phase: Phase.BASE_EXTENSION, longRunTarget: 16, weeklyMileageTarget: 30 },
  { weekNumber: 10, phase: Phase.BASE_EXTENSION, longRunTarget: 16, weeklyMileageTarget: 30 },
  { weekNumber: 11, phase: Phase.BASE_EXTENSION, longRunTarget: 17, weeklyMileageTarget: 32 },
  {
    weekNumber: 12,
    phase: Phase.BASE_EXTENSION,
    longRunTarget: 15,
    weeklyMileageTarget: 28,
    notes: "Recovery week - reduce volume",
  },
  { weekNumber: 13, phase: Phase.BASE_EXTENSION, longRunTarget: 17, weeklyMileageTarget: 32 },
  {
    weekNumber: 14,
    phase: Phase.BASE_EXTENSION,
    longRunTarget: 18,
    weeklyMileageTarget: 34,
    notes: "Base extension complete",
  },

  // SPEED_DEVELOPMENT (Weeks 15-21): Race-specific training, peak at 20km
  { weekNumber: 15, phase: Phase.SPEED_DEVELOPMENT, longRunTarget: 18, weeklyMileageTarget: 35 },
  { weekNumber: 16, phase: Phase.SPEED_DEVELOPMENT, longRunTarget: 19, weeklyMileageTarget: 36 },
  {
    weekNumber: 17,
    phase: Phase.SPEED_DEVELOPMENT,
    longRunTarget: 16,
    weeklyMileageTarget: 30,
    notes: "Recovery week",
  },
  { weekNumber: 18, phase: Phase.SPEED_DEVELOPMENT, longRunTarget: 19, weeklyMileageTarget: 37 },
  {
    weekNumber: 19,
    phase: Phase.SPEED_DEVELOPMENT,
    longRunTarget: 20,
    weeklyMileageTarget: 38,
    notes: "Peak long run - race distance simulation",
  },
  { weekNumber: 20, phase: Phase.SPEED_DEVELOPMENT, longRunTarget: 18, weeklyMileageTarget: 35 },
  {
    weekNumber: 21,
    phase: Phase.SPEED_DEVELOPMENT,
    longRunTarget: 20,
    weeklyMileageTarget: 38,
    notes: "Final peak week",
  },

  // PEAK_TAPER (Weeks 22-24): Taper for race day
  {
    weekNumber: 22,
    phase: Phase.PEAK_TAPER,
    longRunTarget: 16,
    weeklyMileageTarget: 30,
    notes: "Begin taper - reduce volume, maintain intensity",
  },
  { weekNumber: 23, phase: Phase.PEAK_TAPER, longRunTarget: 12, weeklyMileageTarget: 24 },
  {
    weekNumber: 24,
    phase: Phase.PEAK_TAPER,
    longRunTarget: 8,
    weeklyMileageTarget: 16,
    notes: "Race week - rest and prepare, race is Sunday May 17",
  },
];

/**
 * Weather preferences for each run type
 * Based on PRD specifications for weather tolerance thresholds
 */
const weatherPreferencesData: Array<{
  runType: RunType;
  maxPrecipitation: number;
  maxWindSpeed: number | null;
  minTemperature: number | null;
  maxTemperature: number | null;
  avoidConditions: string[];
}> = [
  {
    runType: RunType.LONG_RUN,
    maxPrecipitation: 20,
    maxWindSpeed: 25,
    minTemperature: 0,
    maxTemperature: 25,
    avoidConditions: ["Heavy Rain", "Thunderstorm", "Heavy Snow"],
  },
  {
    runType: RunType.EASY_RUN,
    maxPrecipitation: 50,
    maxWindSpeed: 35,
    minTemperature: -5,
    maxTemperature: 30,
    avoidConditions: ["Thunderstorm", "Heavy Snow"],
  },
  {
    runType: RunType.TEMPO_RUN,
    maxPrecipitation: 30,
    maxWindSpeed: 25,
    minTemperature: 5,
    maxTemperature: 25,
    avoidConditions: ["Heavy Rain", "Thunderstorm", "Heavy Snow"],
  },
  {
    runType: RunType.INTERVAL_RUN,
    maxPrecipitation: 30,
    maxWindSpeed: 25,
    minTemperature: 5,
    maxTemperature: 25,
    avoidConditions: ["Heavy Rain", "Thunderstorm", "Heavy Snow"],
  },
  {
    runType: RunType.RECOVERY_RUN,
    maxPrecipitation: 60,
    maxWindSpeed: 40,
    minTemperature: -5,
    maxTemperature: 30,
    avoidConditions: ["Thunderstorm"],
  },
  {
    runType: RunType.RACE,
    maxPrecipitation: 100,
    maxWindSpeed: null,
    minTemperature: null,
    maxTemperature: null,
    avoidConditions: [],
  },
];

/**
 * Calculate week start and end dates based on week number
 */
function getWeekDates(weekNumber: number): { weekStart: Date; weekEnd: Date } {
  const weekStart = new Date(TRAINING_START);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

async function seedUserSettings() {
  const userSettings = await prisma.userSettings.upsert({
    where: { id: "default-settings" },
    update: {},
    create: {
      id: "default-settings",
      defaultLocation: "Balbriggan, IE",
      latitude: 53.6108,
      longitude: -6.1817,
      raceDate: new Date("2026-05-17T10:00:00.000Z"),
      raceName: "Life Style Sports Fastlane Summer Edition 2026",
      targetTime: "2:00:00",
    },
  });
  console.log("✅ UserSettings created:", userSettings.id);
  return userSettings;
}

async function seedTrainingPlan() {
  // Delete existing training plan entries to allow re-seeding
  await prisma.trainingPlan.deleteMany({});

  // Create all 24 weeks of training plan
  const createdPlans = await Promise.all(
    trainingPlanData.map((data) => {
      const { weekStart, weekEnd } = getWeekDates(data.weekNumber);
      return prisma.trainingPlan.create({
        data: {
          phase: data.phase,
          weekNumber: data.weekNumber,
          weekStart,
          weekEnd,
          longRunTarget: data.longRunTarget,
          weeklyMileageTarget: data.weeklyMileageTarget,
          notes: data.notes,
        },
      });
    })
  );

  console.log(`✅ TrainingPlan created: ${createdPlans.length} weeks`);
  return createdPlans;
}

async function seedWeatherPreferences() {
  // Delete existing weather preferences to allow re-seeding
  await prisma.weatherPreference.deleteMany({});

  // Create weather preferences for all run types
  const createdPreferences = await Promise.all(
    weatherPreferencesData.map((data) =>
      prisma.weatherPreference.create({
        data: {
          runType: data.runType,
          maxPrecipitation: data.maxPrecipitation,
          maxWindSpeed: data.maxWindSpeed,
          minTemperature: data.minTemperature,
          maxTemperature: data.maxTemperature,
          avoidConditions: data.avoidConditions,
        },
      })
    )
  );

  console.log(`✅ WeatherPreference created: ${createdPreferences.length} run types`);
  return createdPreferences;
}

async function main() {
  console.log("🌱 Seeding database...");

  await seedUserSettings();
  await seedTrainingPlan();
  await seedWeatherPreferences();

  console.log("🌱 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
