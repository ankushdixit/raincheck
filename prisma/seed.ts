/**
 * Database Seed Script
 *
 * Seeds the database with initial data for the RainCheck application.
 * This creates:
 * - UserSettings: Singleton record with default race configuration
 * - TrainingPlan: 34 weeks of half-marathon training (Sep 21, 2025 - May 16, 2026)
 * - WeatherPreference: Weather tolerance thresholds for each run type
 * - Run: 22 historical runs from Sept-Nov 2025 (pre-training data)
 *
 * Training Plan Structure (weeks run Sun-Sat):
 * - Long run on Sundays
 * - Easy runs on Wednesdays and Fridays
 *
 * Phases:
 * - BASE_BUILDING (Weeks 1-15): Build from 7km → 14km long runs
 * - BASE_EXTENSION (Weeks 16-23): Extend to 15km → 18km long runs
 * - SPEED_DEVELOPMENT (Weeks 24-30): Peak at 20km long runs
 * - PEAK_TAPER (Weeks 31-34): Taper for race, 16km → 5km long runs
 *
 * Historical Runs (Sept-Nov 2025):
 * - 22 completed runs showing fitness progression
 * - Mix of LONG_RUN, EASY_RUN, TEMPO_RUN, RECOVERY_RUN types
 * - Distances from 5km to 12km
 * - Paces from 5:30 to 7:00 per km
 *
 * Race: May 17, 2026 (Sunday after week 34)
 *
 * Usage:
 *   npx prisma db seed
 */

import {
  PrismaClient,
  Phase,
  RunType,
  RecommendationCategory,
  RecommendationPriority,
} from "@prisma/client";

const prisma = new PrismaClient();

// Training plan start date: September 21, 2025 (Sunday, 34 weeks before race on May 17, 2026)
// Weeks run Sunday to Saturday
const TRAINING_START = new Date("2025-09-21T00:00:00.000Z");

/**
 * Training plan data for 34 weeks
 * Based on actual training progression
 * Current fitness: ~14km long run (as of Dec 2025)
 * Weekly structure: Long run (Sun) + Easy run (Wed) + Easy run (Fri)
 */
const trainingPlanData: Array<{
  weekNumber: number;
  phase: Phase;
  longRunTarget: number;
  weeklyMileageTarget: number;
  notes?: string;
}> = [
  // BASE_BUILDING (Weeks 1-15): Building consistency, 7km → 14km long runs
  { weekNumber: 1, phase: Phase.BASE_BUILDING, longRunTarget: 7, weeklyMileageTarget: 15 },
  { weekNumber: 2, phase: Phase.BASE_BUILDING, longRunTarget: 8, weeklyMileageTarget: 16 },
  { weekNumber: 3, phase: Phase.BASE_BUILDING, longRunTarget: 8, weeklyMileageTarget: 17 },
  { weekNumber: 4, phase: Phase.BASE_BUILDING, longRunTarget: 9, weeklyMileageTarget: 18 },
  { weekNumber: 5, phase: Phase.BASE_BUILDING, longRunTarget: 9, weeklyMileageTarget: 19 },
  { weekNumber: 6, phase: Phase.BASE_BUILDING, longRunTarget: 10, weeklyMileageTarget: 20 },
  { weekNumber: 7, phase: Phase.BASE_BUILDING, longRunTarget: 10, weeklyMileageTarget: 21 },
  { weekNumber: 8, phase: Phase.BASE_BUILDING, longRunTarget: 11, weeklyMileageTarget: 22 },
  { weekNumber: 9, phase: Phase.BASE_BUILDING, longRunTarget: 11, weeklyMileageTarget: 23 },
  { weekNumber: 10, phase: Phase.BASE_BUILDING, longRunTarget: 12, weeklyMileageTarget: 24 },
  { weekNumber: 11, phase: Phase.BASE_BUILDING, longRunTarget: 12, weeklyMileageTarget: 25 },
  { weekNumber: 12, phase: Phase.BASE_BUILDING, longRunTarget: 13, weeklyMileageTarget: 26 },
  { weekNumber: 13, phase: Phase.BASE_BUILDING, longRunTarget: 13, weeklyMileageTarget: 26 },
  { weekNumber: 14, phase: Phase.BASE_BUILDING, longRunTarget: 14, weeklyMileageTarget: 27 },
  {
    weekNumber: 15,
    phase: Phase.BASE_BUILDING,
    longRunTarget: 14,
    weeklyMileageTarget: 27,
    notes: "Base building complete",
  },

  // BASE_EXTENSION (Weeks 16-23): Extending endurance, 15km → 18km long runs
  { weekNumber: 16, phase: Phase.BASE_EXTENSION, longRunTarget: 15, weeklyMileageTarget: 28 },
  { weekNumber: 17, phase: Phase.BASE_EXTENSION, longRunTarget: 15, weeklyMileageTarget: 29 },
  { weekNumber: 18, phase: Phase.BASE_EXTENSION, longRunTarget: 16, weeklyMileageTarget: 30 },
  { weekNumber: 19, phase: Phase.BASE_EXTENSION, longRunTarget: 16, weeklyMileageTarget: 31 },
  { weekNumber: 20, phase: Phase.BASE_EXTENSION, longRunTarget: 17, weeklyMileageTarget: 32 },
  {
    weekNumber: 21,
    phase: Phase.BASE_EXTENSION,
    longRunTarget: 15,
    weeklyMileageTarget: 28,
    notes: "Recovery week - reduce volume",
  },
  { weekNumber: 22, phase: Phase.BASE_EXTENSION, longRunTarget: 17, weeklyMileageTarget: 33 },
  {
    weekNumber: 23,
    phase: Phase.BASE_EXTENSION,
    longRunTarget: 18,
    weeklyMileageTarget: 34,
    notes: "Base extension complete",
  },

  // SPEED_DEVELOPMENT (Weeks 24-30): Race-specific training, peak at 20km
  { weekNumber: 24, phase: Phase.SPEED_DEVELOPMENT, longRunTarget: 18, weeklyMileageTarget: 35 },
  { weekNumber: 25, phase: Phase.SPEED_DEVELOPMENT, longRunTarget: 19, weeklyMileageTarget: 36 },
  {
    weekNumber: 26,
    phase: Phase.SPEED_DEVELOPMENT,
    longRunTarget: 16,
    weeklyMileageTarget: 30,
    notes: "Recovery week",
  },
  { weekNumber: 27, phase: Phase.SPEED_DEVELOPMENT, longRunTarget: 19, weeklyMileageTarget: 37 },
  {
    weekNumber: 28,
    phase: Phase.SPEED_DEVELOPMENT,
    longRunTarget: 20,
    weeklyMileageTarget: 38,
    notes: "Peak long run - race distance simulation",
  },
  { weekNumber: 29, phase: Phase.SPEED_DEVELOPMENT, longRunTarget: 18, weeklyMileageTarget: 35 },
  {
    weekNumber: 30,
    phase: Phase.SPEED_DEVELOPMENT,
    longRunTarget: 20,
    weeklyMileageTarget: 38,
    notes: "Final peak week",
  },

  // PEAK_TAPER (Weeks 31-34): Taper for race day
  {
    weekNumber: 31,
    phase: Phase.PEAK_TAPER,
    longRunTarget: 16,
    weeklyMileageTarget: 30,
    notes: "Begin taper - reduce volume, maintain intensity",
  },
  { weekNumber: 32, phase: Phase.PEAK_TAPER, longRunTarget: 12, weeklyMileageTarget: 24 },
  { weekNumber: 33, phase: Phase.PEAK_TAPER, longRunTarget: 8, weeklyMileageTarget: 16 },
  {
    weekNumber: 34,
    phase: Phase.PEAK_TAPER,
    longRunTarget: 5,
    weeklyMileageTarget: 10,
    notes: "Race week - rest and prepare, race is Sunday May 17",
  },
];

/**
 * Historical runs data (22 runs from Sept-Nov 2025)
 * Based on actual training data from runs.csv
 * Mix of LONG_RUN and EASY_RUN types
 * Distances: 4.51km to 11.48km
 * Paces: 6:17 to 6:53 per km
 */
const historicalRunsData: Array<{
  date: Date;
  distance: number;
  pace: string;
  duration: string;
  type: RunType;
  notes?: string;
}> = [
  // September 2025 runs (3 runs)
  {
    date: new Date("2025-09-23T08:00:00.000Z"),
    distance: 7,
    pace: "6:20",
    duration: "44:20",
    type: RunType.LONG_RUN,
  },
  {
    date: new Date("2025-09-26T08:00:00.000Z"),
    distance: 4.51,
    pace: "6:17",
    duration: "28:20",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-09-29T08:00:00.000Z"),
    distance: 5.38,
    pace: "6:34",
    duration: "35:20",
    type: RunType.EASY_RUN,
  },

  // October 2025 runs (10 runs)
  {
    date: new Date("2025-10-02T08:00:00.000Z"),
    distance: 6.03,
    pace: "6:42",
    duration: "40:25",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-10-05T08:00:00.000Z"),
    distance: 7.33,
    pace: "6:35",
    duration: "48:17",
    type: RunType.LONG_RUN,
  },
  {
    date: new Date("2025-10-08T08:00:00.000Z"),
    distance: 6.04,
    pace: "6:47",
    duration: "40:59",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-10-11T08:00:00.000Z"),
    distance: 6.03,
    pace: "6:33",
    duration: "39:33",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-10-15T08:00:00.000Z"),
    distance: 8.05,
    pace: "6:48",
    duration: "54:46",
    type: RunType.LONG_RUN,
  },
  {
    date: new Date("2025-10-17T08:00:00.000Z"),
    distance: 6,
    pace: "6:32",
    duration: "39:12",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-10-21T08:00:00.000Z"),
    distance: 9.01,
    pace: "6:33",
    duration: "59:06",
    type: RunType.LONG_RUN,
  },
  {
    date: new Date("2025-10-24T08:00:00.000Z"),
    distance: 5,
    pace: "6:53",
    duration: "34:25",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-10-27T08:00:00.000Z"),
    distance: 5,
    pace: "6:45",
    duration: "33:45",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-10-31T08:00:00.000Z"),
    distance: 9,
    pace: "6:41",
    duration: "60:09",
    type: RunType.LONG_RUN,
  },

  // November 2025 runs (9 runs - leading into training plan)
  {
    date: new Date("2025-11-03T08:00:00.000Z"),
    distance: 5.7,
    pace: "6:23",
    duration: "36:25",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-11-05T08:00:00.000Z"),
    distance: 5.71,
    pace: "6:46",
    duration: "38:41",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-11-07T08:00:00.000Z"),
    distance: 5.63,
    pace: "6:45",
    duration: "38:03",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-11-09T08:00:00.000Z"),
    distance: 10.1,
    pace: "6:38",
    duration: "66:59",
    type: RunType.LONG_RUN,
    notes: "First double-digit run",
  },
  {
    date: new Date("2025-11-12T08:00:00.000Z"),
    distance: 5.72,
    pace: "6:36",
    duration: "37:46",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-11-16T08:00:00.000Z"),
    distance: 10.82,
    pace: "6:42",
    duration: "72:25",
    type: RunType.LONG_RUN,
  },
  {
    date: new Date("2025-11-20T08:00:00.000Z"),
    distance: 6.01,
    pace: "6:37",
    duration: "39:42",
    type: RunType.EASY_RUN,
  },
  {
    date: new Date("2025-11-23T08:00:00.000Z"),
    distance: 11.48,
    pace: "6:45",
    duration: "77:32",
    type: RunType.LONG_RUN,
  },
  {
    date: new Date("2025-11-26T08:00:00.000Z"),
    distance: 6.15,
    pace: "6:39",
    duration: "40:53",
    type: RunType.EASY_RUN,
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

  // Create all 34 weeks of training plan
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

async function seedRuns() {
  // Delete existing runs to allow re-seeding
  await prisma.run.deleteMany({});

  // Create all historical runs (all marked as completed)
  const createdRuns = await Promise.all(
    historicalRunsData.map((data) =>
      prisma.run.create({
        data: {
          date: data.date,
          distance: data.distance,
          pace: data.pace,
          duration: data.duration,
          type: data.type,
          notes: data.notes,
          completed: true, // All historical runs are completed
        },
      })
    )
  );

  console.log(`✅ Run created: ${createdRuns.length} historical runs`);
  return createdRuns;
}

/**
 * Initial recommendations data (from Dec 30, 2025 training discussion)
 * These are personalized recommendations based on actual training experience
 */
const recommendationsData: Array<{
  title: string;
  description: string;
  category: RecommendationCategory;
  phase: Phase | null;
  priority: RecommendationPriority;
  source: string;
}> = [
  // Injury Prevention - General
  {
    title: "Arch Strengthening Exercises",
    description:
      "Roll a frozen water bottle under your arch for 10-15 minutes after runs. Perform towel scrunches, calf raises, and single-leg balance exercises daily to strengthen the arch and prevent plantar fasciitis.",
    category: RecommendationCategory.INJURY_PREVENTION,
    phase: null,
    priority: RecommendationPriority.HIGH,
    source: "Claude Code training discussion",
  },
  {
    title: "Monitor Shoe Mileage",
    description:
      "Track kilometers on your running shoes. After 500-800 km, the midsole compression reduces support. Consider replacing shoes before they cause injury, especially with increasing long run distances.",
    category: RecommendationCategory.GEAR,
    phase: null,
    priority: RecommendationPriority.MEDIUM,
    source: "Claude Code training discussion",
  },
  {
    title: "Calf and Plantar Fascia Stretches",
    description:
      "Perform calf stretches and plantar fascia stretches before bed. This helps prevent morning stiffness and reduces risk of arch pain during runs.",
    category: RecommendationCategory.INJURY_PREVENTION,
    phase: null,
    priority: RecommendationPriority.MEDIUM,
    source: "Claude Code training discussion",
  },

  // Pacing - General
  {
    title: "Negative Split Pacing is Correct",
    description:
      "Your pattern of starting slow (7:40-8:00/km) and finishing faster (6:50-7:00/km average) is excellent and exactly how experienced runners pace themselves. Don't try to 'fix' this - your body is naturally pacing itself well.",
    category: RecommendationCategory.PACING,
    phase: null,
    priority: RecommendationPriority.HIGH,
    source: "Claude Code training discussion",
  },
  {
    title: "The First Mile is a Liar",
    description:
      "Feeling tough in the first 1-3 km is completely normal. Your body needs 10-15 minutes for heart rate to stabilize, blood to redirect to muscles, and joints to lubricate. Trust the process.",
    category: RecommendationCategory.MENTAL,
    phase: null,
    priority: RecommendationPriority.MEDIUM,
    source: "Claude Code training discussion",
  },

  // Nutrition - Base Building
  {
    title: "Fuel During Long Runs Over 90 Minutes",
    description:
      "After 60-90 minutes of running, glycogen stores deplete significantly. Take 30-60g of carbohydrates (one gel or sports drink) around km 8-9 of your long runs to maintain energy and push through the difficult final kilometers.",
    category: RecommendationCategory.NUTRITION,
    phase: Phase.BASE_BUILDING,
    priority: RecommendationPriority.HIGH,
    source: "Claude Code training discussion",
  },
  {
    title: "Pre-Run Nutrition Timing",
    description:
      "Eat a carb-rich meal (oatmeal, toast, banana) 2-3 hours before long runs. This ensures adequate glycogen stores without stomach discomfort during your run.",
    category: RecommendationCategory.NUTRITION,
    phase: null,
    priority: RecommendationPriority.MEDIUM,
    source: "Claude Code training discussion",
  },

  // Recovery - General
  {
    title: "Hydration Affects Perceived Effort",
    description:
      "Even mild dehydration significantly increases perceived effort during runs. Ensure adequate hydration in the hours before your run, not just during.",
    category: RecommendationCategory.RECOVERY,
    phase: null,
    priority: RecommendationPriority.MEDIUM,
    source: "Claude Code training discussion",
  },

  // Mental - Base Building
  {
    title: "The Wall at km 10-11 is the Workout",
    description:
      "That tough phase in the final kilometers of your long runs IS the training stimulus. It's building race-day resilience and teaching your body to run on depleted glycogen. This is exactly what half marathon training is about.",
    category: RecommendationCategory.MENTAL,
    phase: Phase.BASE_BUILDING,
    priority: RecommendationPriority.HIGH,
    source: "Claude Code training discussion",
  },
];

async function seedRecommendations() {
  // Check if recommendations already exist - don't delete existing data
  const existingCount = await prisma.recommendation.count();
  if (existingCount > 0) {
    console.log(`⏭️  Recommendation skipped: ${existingCount} already exist (preserving data)`);
    return [];
  }

  // Create all recommendations only if table is empty
  const createdRecs = await Promise.all(
    recommendationsData.map((data) =>
      prisma.recommendation.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          phase: data.phase,
          priority: data.priority,
          source: data.source,
        },
      })
    )
  );

  console.log(`✅ Recommendation created: ${createdRecs.length} recommendations`);
  return createdRecs;
}

async function main() {
  console.log("🌱 Seeding database...");

  await seedUserSettings();
  await seedTrainingPlan();
  await seedWeatherPreferences();
  await seedRuns();
  await seedRecommendations();

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
