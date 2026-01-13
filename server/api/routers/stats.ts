/**
 * Stats tRPC Router
 *
 * Provides stat aggregation endpoints for training analytics dashboard.
 * All procedures are public (read-only analytics).
 *
 * Procedures:
 * - getWeeklyMileage: Weekly totals with targets
 * - getPaceProgression: Pace data points over time
 * - getLongRunProgression: Long run distances with targets
 * - getCompletionRate: Completion statistics overall and by phase
 * - getSummary: Aggregate stats (totalRuns, totalDistance, avgPace, streak, longestRun)
 */

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { Phase, RunType } from "@prisma/client";

/**
 * Convert pace string to seconds for calculations
 * @param pace - Pace in "M:SS" or "MM:SS" format
 * @returns Total seconds, or NaN for invalid input
 */
function paceToSeconds(pace: string): number {
  if (!pace || typeof pace !== "string") return NaN;
  const parts = pace.split(":");
  if (parts.length < 2) return NaN;
  const minutes = parseInt(parts[0] ?? "", 10);
  const seconds = parseInt(parts[1] ?? "", 10);
  if (isNaN(minutes) || isNaN(seconds)) return NaN;
  return minutes * 60 + seconds;
}

/**
 * Convert seconds to pace string format
 * @param totalSeconds - Total seconds
 * @returns Pace in "M:SS" format, or empty string for invalid input
 */
function secondsToPace(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds <= 0) return "";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Training reference start date - September 21, 2025
 * This is when week counting begins for all training statistics.
 */
const TRAINING_START_DATE = new Date("2025-09-21T00:00:00");

/**
 * Get the training week number for a given date
 * Training starts Sep 21, 2025 - weeks are Sun-Sat
 */
function getWeekNumberForDate(date: Date, trainingStart: Date = TRAINING_START_DATE): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffMs = date.getTime() - trainingStart.getTime();
  return Math.floor(diffMs / msPerWeek) + 1;
}

/**
 * Calculate target weekly mileage based on week number
 * Linear progression: 10km in week 1 → 25km by week 11 → continues to ~45km peak
 * Then tapers in final weeks before race
 */
function calculateWeeklyTarget(weekNum: number): number {
  if (weekNum < 1) return 0; // Pre-training weeks have no target

  // Base building (weeks 1-11): 10km → 25km (1.5km/week increase)
  if (weekNum <= 11) {
    return 10 + (weekNum - 1) * 1.5;
  }

  // Continue building (weeks 12-26): 25km → 45km (slower ~1.4km/week)
  if (weekNum <= 26) {
    return 25 + (weekNum - 11) * 1.33;
  }

  // Taper (weeks 27-34): Reduce to 60-70% of peak
  const peakTarget = 45;
  const taperWeeks = weekNum - 26;
  const taperReduction = taperWeeks * 3; // Reduce by 3km per taper week
  return Math.max(25, peakTarget - taperReduction);
}

/**
 * Calculate target long run distance based on week number
 * Progressive increase: 7km in week 1 → 21km (race distance) by week 30
 */
function calculateLongRunTarget(weekNum: number): number {
  if (weekNum < 1) return 0;

  // Linear progression: 7km to 21km over 30 weeks
  const startDistance = 7;
  const raceDistance = 21.1;
  const buildWeeks = 30;

  if (weekNum <= buildWeeks) {
    return startDistance + ((raceDistance - startDistance) / buildWeeks) * weekNum;
  }

  // After week 30, taper down slightly
  return raceDistance * 0.8;
}

/**
 * External resource link for phase content
 */
interface PhaseResource {
  title: string;
  url: string;
  source: string;
}

/**
 * Table column configuration for phase-specific display
 */
type TableColumnKey =
  | "week"
  | "dates"
  | "longRun"
  | "weeklyMileage"
  | "runsCompleted"
  | "volumeTrend"
  | "qualityWorkouts"
  | "avgPace"
  | "volumePercent"
  | "status";

/**
 * Extended phase metadata for rich content display
 */
interface PhaseMetadata {
  name: string;
  description: string;
  focus: string[];
  color: string;
  // Rich content
  science: string;
  successCriteria: string[];
  commonMistakes: string[];
  coachTip: string;
  // Table configuration
  tableColumns: TableColumnKey[];
  // External resources
  resources: PhaseResource[];
}

/**
 * Phase metadata for display - extended with rich content
 */
const PHASE_METADATA: Record<Phase, PhaseMetadata> = {
  [Phase.BASE_BUILDING]: {
    name: "Base Building",
    description:
      "Establish your aerobic foundation with consistent, easy-paced running. Focus on building weekly mileage gradually while keeping intensity low.",
    focus: [
      "Build aerobic base",
      "Establish running habit",
      "Gradual mileage increase",
      "Easy conversational pace",
    ],
    color: "emerald",
    science:
      "Zone 2 training builds mitochondrial density and capillary networks, improving oxygen delivery to muscles. This aerobic foundation is the bedrock of endurance performance - research shows 80% of training should be at conversational pace.",
    successCriteria: [
      "Complete 80%+ of scheduled runs",
      "Maintain conversational pace on easy days",
      "Increase weekly mileage by no more than 10%",
      "Build consistent weekly running habit",
    ],
    commonMistakes: [
      "Running too fast (most common mistake!)",
      "Increasing volume too quickly",
      "Skipping rest days",
      "Comparing pace to others",
    ],
    coachTip:
      "If you can't hold a conversation while running, you're going too fast. Slow down - the aerobic benefits come from time on feet, not speed.",
    tableColumns: ["week", "dates", "longRun", "weeklyMileage", "runsCompleted", "status"],
    resources: [
      {
        title: "The Science of Aerobic Base Training",
        url: "https://www.trainingpeaks.com/blog/science-of-aerobic-base-training/",
        source: "TrainingPeaks",
      },
      {
        title: "Why Zone 2 Training Matters",
        url: "https://www.trainingpeaks.com/blog/zone-2-training-for-endurance-athletes/",
        source: "TrainingPeaks",
      },
    ],
  },
  [Phase.BASE_EXTENSION]: {
    name: "Base Extension",
    description:
      "Extend your endurance capacity with longer runs and increased weekly volume. Introduce variety while maintaining aerobic focus.",
    focus: [
      "Extend long run distance",
      "Increase weekly volume",
      "Build mental toughness",
      "Practice race nutrition",
    ],
    color: "blue",
    science:
      "This phase extends aerobic capacity by gradually increasing training volume. The body adapts to longer efforts, improving fat oxidation and mental resilience for race day.",
    successCriteria: [
      "Reach 16-18km long runs",
      "Maintain 3+ runs per week consistently",
      "Practice race-day nutrition on long runs",
      "Build to target weekly volume",
    ],
    commonMistakes: [
      "Neglecting recovery between long runs",
      "Not practicing nutrition strategy",
      "Ignoring early fatigue signs",
      "Increasing long run and volume simultaneously",
    ],
    coachTip:
      "Start experimenting with gels and hydration on runs over 13km. Race day is not the time to try something new!",
    tableColumns: ["week", "dates", "longRun", "weeklyMileage", "volumeTrend", "status"],
    resources: [
      {
        title: "Half Marathon Nutrition Guide",
        url: "https://marathonhandbook.com/half-marathon-nutrition/",
        source: "Marathon Handbook",
      },
      {
        title: "Building Endurance Safely",
        url: "https://www.runnersworld.com/training/a20843627/half-marathon-training-for-beginners/",
        source: "Runner's World",
      },
    ],
  },
  [Phase.SPEED_DEVELOPMENT]: {
    name: "Speed Development",
    description:
      "Develop race-specific fitness with tempo runs, intervals, and race-pace work. Build confidence in your target pace.",
    focus: [
      "Tempo runs at race pace",
      "Interval training",
      "Build speed endurance",
      "Race simulation runs",
    ],
    color: "amber",
    science:
      "Tempo and interval training improves lactate threshold and VO2max. These workouts teach your body to run faster more efficiently by recruiting fast-twitch muscle fibers and improving running economy.",
    successCriteria: [
      "Complete 1-2 quality workouts per week",
      "Hit target paces in tempo/interval sessions",
      "Maintain long run distance",
      "Feel confident at goal race pace",
    ],
    commonMistakes: [
      "Too many hard days in a row",
      "Treating easy days as tempo days",
      "Neglecting recovery between quality sessions",
      "Sacrificing long runs for speedwork",
    ],
    coachTip:
      "The magic happens in recovery. Your hard days should be HARD, and your easy days should be genuinely EASY.",
    tableColumns: ["week", "dates", "longRun", "weeklyMileage", "avgPace", "status"],
    resources: [
      {
        title: "VDOT Running Calculator",
        url: "https://runsmartproject.com/calculator/",
        source: "Jack Daniels",
      },
      {
        title: "Understanding Tempo Runs",
        url: "https://www.runnersworld.com/training/a20812270/tempo-runs-made-easy/",
        source: "Runner's World",
      },
    ],
  },
  [Phase.PEAK_TAPER]: {
    name: "Peak & Taper",
    description:
      "Reach peak fitness then gradually reduce volume while maintaining intensity. Arrive at race day fresh and ready.",
    focus: [
      "Final long run (21km)",
      "Gradual volume reduction",
      "Maintain sharpness",
      "Race day preparation",
    ],
    color: "purple",
    science:
      "Tapering reduces training volume while maintaining intensity, allowing muscles to repair and glycogen stores to maximize. Research shows optimal tapers improve race performance by 2-3%. Fitness doesn't disappear - fatigue does.",
    successCriteria: [
      "Reduce volume by 40-60% over 2-3 weeks",
      "Maintain some intensity (strides, short tempos)",
      "Arrive at race day feeling fresh and eager",
      "Complete race prep logistics",
    ],
    commonMistakes: [
      "Panicking about 'losing fitness' (you won't!)",
      "Doing extra runs 'just in case'",
      "Trying new gear or nutrition race week",
      "Not trusting the taper process",
    ],
    coachTip:
      "Feeling restless and full of energy during taper? That's exactly how you should feel. Trust the process - your body is absorbing all that hard work.",
    tableColumns: ["week", "dates", "longRun", "volumePercent", "status"],
    resources: [
      {
        title: "Master Your Half Marathon Taper",
        url: "https://lauranorrisrunning.com/taper-half-marathon/",
        source: "Laura Norris Running",
      },
      {
        title: "The Science of Tapering",
        url: "https://www.runnersworld.com/advanced/a20851566/the-art-and-science-of-the-taper/",
        source: "Runner's World",
      },
    ],
  },
};

export const statsRouter = createTRPCRouter({
  /**
   * Get weekly mileage data with targets
   *
   * Returns weekly totals with training plan targets for the last N weeks.
   * Weeks are aligned to the training plan calendar (Sun-Sat).
   */
  getWeeklyMileage: publicProcedure
    .input(
      z
        .object({
          weeks: z.number().min(1).max(52).default(12),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const weeksToFetch = input?.weeks ?? 12;

      // Calculate date range - only fetch runs from the relevant time period
      const now = new Date();
      const currentWeekNum = getWeekNumberForDate(now);
      const startWeekNum = Math.max(1, currentWeekNum - weeksToFetch);
      const startDate = new Date(
        TRAINING_START_DATE.getTime() + (startWeekNum - 1) * 7 * 24 * 60 * 60 * 1000
      );

      // Parallel fetch: training plans and runs for the relevant time period only
      const [trainingPlans, runs] = await Promise.all([
        ctx.db.trainingPlan.findMany({
          where: {
            weekNumber: { gte: startWeekNum, lte: currentWeekNum },
          },
          orderBy: { weekNumber: "asc" },
        }),
        ctx.db.run.findMany({
          where: {
            completed: true,
            date: { gte: startDate },
          },
          orderBy: { date: "asc" },
          select: { date: true, distance: true }, // Only select needed fields
        }),
      ]);

      if (runs.length === 0) {
        return [];
      }

      // Use the fixed training start date (September 21, 2025)
      const trainingStart = TRAINING_START_DATE;

      // Group runs by week number (can be negative for pre-training weeks)
      const runsByWeek = new Map<number, number>();

      for (const run of runs) {
        const weekNum = getWeekNumberForDate(run.date, trainingStart);
        const currentMileage = runsByWeek.get(weekNum) ?? 0;
        runsByWeek.set(weekNum, currentMileage + run.distance);
      }

      // Build result for each week that has data or a training plan
      const result: Array<{
        week: string;
        weekStart: Date;
        mileage: number;
        target: number;
        isCurrentWeek: boolean;
      }> = [];

      // Get unique weeks that have runs or are in training plan
      const allWeeks = new Set<number>();
      for (const weekNum of runsByWeek.keys()) {
        allWeeks.add(weekNum);
      }
      for (const plan of trainingPlans) {
        allWeeks.add(plan.weekNumber);
      }

      // Sort and take the last N weeks with data
      const sortedWeeks = Array.from(allWeeks).sort((a, b) => a - b);

      // Filter to weeks up to current week and take last N
      const relevantWeeks = sortedWeeks.filter((w) => w <= currentWeekNum).slice(-weeksToFetch);

      for (const weekNum of relevantWeeks) {
        const mileage = runsByWeek.get(weekNum) ?? 0;

        // Label pre-training weeks differently
        const weekLabel = weekNum < 1 ? `Pre ${1 - weekNum}` : `Week ${weekNum}`;

        result.push({
          week: weekLabel,
          weekStart: new Date(trainingStart.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000),
          mileage: Math.round(mileage * 100) / 100,
          target: Math.round(calculateWeeklyTarget(weekNum) * 10) / 10, // Linear target based on week
          isCurrentWeek: weekNum === currentWeekNum,
        });
      }

      return result;
    }),

  /**
   * Get pace progression data
   *
   * Returns weekly average pace for all weeks from week 1 to current week.
   * Weeks without runs show null pace.
   */
  getPaceProgression: publicProcedure
    .input(
      z
        .object({
          runType: z.nativeEnum(RunType).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const runs = await ctx.db.run.findMany({
        where: {
          completed: true,
          ...(input?.runType && { type: input.runType }),
        },
        orderBy: { date: "asc" },
        select: { date: true, distance: true, pace: true }, // Only select needed fields
        take: 500, // Reasonable limit
      });

      // Get current week number
      const now = new Date();
      const currentWeekNum = getWeekNumberForDate(now);

      if (currentWeekNum < 1) {
        return [];
      }

      // Group runs by week and calculate weighted average pace
      const weeklyPaces = new Map<number, { totalDistance: number; totalTime: number }>();

      for (const run of runs) {
        const weekNum = getWeekNumberForDate(run.date);
        if (weekNum < 1 || weekNum > currentWeekNum) continue;

        const paceSeconds = paceToSeconds(run.pace);
        // Skip runs with invalid pace data
        if (!isFinite(paceSeconds) || paceSeconds <= 0) continue;

        const runTime = paceSeconds * run.distance; // Total time in seconds

        const existing = weeklyPaces.get(weekNum) ?? { totalDistance: 0, totalTime: 0 };
        weeklyPaces.set(weekNum, {
          totalDistance: existing.totalDistance + run.distance,
          totalTime: existing.totalTime + runTime,
        });
      }

      // Build result for each week from 1 to current
      const result: Array<{
        week: number;
        date: Date;
        paceSeconds: number | null;
        pace: string | null;
      }> = [];

      for (let weekNum = 1; weekNum <= currentWeekNum; weekNum++) {
        const weekStart = new Date(
          TRAINING_START_DATE.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000
        );

        const weekData = weeklyPaces.get(weekNum);
        let avgPaceSeconds: number | null = null;
        let avgPace: string | null = null;

        if (weekData && weekData.totalDistance > 0) {
          const calculatedPace = weekData.totalTime / weekData.totalDistance;
          if (isFinite(calculatedPace) && calculatedPace > 0) {
            avgPaceSeconds = calculatedPace;
            avgPace = secondsToPace(avgPaceSeconds);
          }
        }

        result.push({
          week: weekNum,
          date: weekStart,
          paceSeconds: avgPaceSeconds,
          pace: avgPace,
        });
      }

      return result;
    }),

  /**
   * Get long run progression data
   *
   * Returns long run distances for all weeks from week 1 to current week.
   * Weeks without long runs show distance of 0.
   */
  getLongRunProgression: publicProcedure.query(async ({ ctx }) => {
    // Get completed long runs with only needed fields
    const longRuns = await ctx.db.run.findMany({
      where: {
        completed: true,
        type: RunType.LONG_RUN,
      },
      orderBy: { date: "asc" },
      select: { date: true, distance: true }, // Only select needed fields
      take: 200, // Reasonable limit for long runs
    });

    // Get current week number
    const now = new Date();
    const currentWeekNum = getWeekNumberForDate(now);

    // Only show data for positive weeks (from training start)
    if (currentWeekNum < 1) {
      return [];
    }

    // Group long runs by week number
    const runsByWeek = new Map<number, number>();
    for (const run of longRuns) {
      const weekNum = getWeekNumberForDate(run.date);
      // Use the maximum distance if multiple long runs in same week
      const existing = runsByWeek.get(weekNum) ?? 0;
      if (run.distance > existing) {
        runsByWeek.set(weekNum, run.distance);
      }
    }

    // Build result for each week from 1 to current
    const result: Array<{
      week: number;
      date: Date;
      distance: number;
      target: number;
    }> = [];

    for (let weekNum = 1; weekNum <= currentWeekNum; weekNum++) {
      const weekStart = new Date(
        TRAINING_START_DATE.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000
      );

      result.push({
        week: weekNum,
        date: weekStart,
        distance: runsByWeek.get(weekNum) ?? 0, // 0 if no long run that week
        target: calculateLongRunTarget(weekNum),
      });
    }

    return result;
  }),

  /**
   * Get completion rate statistics
   *
   * Returns completion statistics overall and broken down by training phase.
   * Only counts scheduled runs up to the current date (excludes future runs).
   */
  getCompletionRate: publicProcedure
    .input(
      z
        .object({
          phase: z.nativeEnum(Phase).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      // Get current date at end of day for comparison
      const now = new Date();
      now.setHours(23, 59, 59, 999);

      // Parallel fetch: runs and training plans
      const [allRuns, trainingPlans] = await Promise.all([
        ctx.db.run.findMany({
          where: { date: { lte: now } },
          select: { date: true, completed: true }, // Only select needed fields
          take: 500, // Reasonable limit
        }),
        ctx.db.trainingPlan.findMany({
          orderBy: { weekNumber: "asc" },
          select: { phase: true, weekNumber: true }, // Only select needed fields
        }),
      ]);

      // Build a map of week numbers to phases for efficient lookup
      const weekToPhase = new Map<number, Phase>();
      for (const plan of trainingPlans) {
        weekToPhase.set(plan.weekNumber, plan.phase);
      }

      // Filter by phase if specified
      let filteredRuns = allRuns;
      if (input?.phase && trainingPlans.length > 0) {
        filteredRuns = allRuns.filter((run) => {
          const weekNum = getWeekNumberForDate(run.date);
          return weekToPhase.get(weekNum) === input.phase;
        });
      }

      const total = filteredRuns.length;
      const completed = filteredRuns.filter((r) => r.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate by phase using the precomputed map
      const byPhase: Array<{
        phase: Phase;
        total: number;
        completed: number;
        rate: number;
      }> = [];

      if (trainingPlans.length > 0) {
        const phases = [
          Phase.BASE_BUILDING,
          Phase.BASE_EXTENSION,
          Phase.SPEED_DEVELOPMENT,
          Phase.PEAK_TAPER,
        ];

        // Group runs by phase using the map (O(n) instead of O(n*m))
        const phaseStats = new Map<Phase, { total: number; completed: number }>();
        for (const phase of phases) {
          phaseStats.set(phase, { total: 0, completed: 0 });
        }

        for (const run of allRuns) {
          const weekNum = getWeekNumberForDate(run.date);
          const phase = weekToPhase.get(weekNum);
          if (phase) {
            const stats = phaseStats.get(phase)!;
            stats.total++;
            if (run.completed) stats.completed++;
          }
        }

        for (const phase of phases) {
          const stats = phaseStats.get(phase)!;
          byPhase.push({
            phase,
            total: stats.total,
            completed: stats.completed,
            rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
          });
        }
      }

      return {
        total,
        completed,
        rate,
        byPhase,
      };
    }),

  /**
   * Get summary statistics
   *
   * Returns aggregate stats:
   * - totalRuns: Count of completed runs
   * - totalDistance: Sum of all completed run distances (km)
   * - avgPace: Average pace across all completed runs
   * - streak: Current consecutive days with runs
   * - longestRun: Maximum distance from completed runs (km)
   */
  getSummary: publicProcedure.query(async ({ ctx }) => {
    const startTime = Date.now();

    // Use database aggregation for count and sum (more efficient than fetching all records)
    const [aggregates, longestRunResult, recentRuns] = await Promise.all([
      // Aggregate: count and sum in one query
      ctx.db.run.aggregate({
        where: { completed: true },
        _count: { id: true },
        _sum: { distance: true },
      }),
      // Get longest run distance
      ctx.db.run.findFirst({
        where: { completed: true },
        orderBy: { distance: "desc" },
        select: { distance: true },
      }),
      // Only fetch runs needed for pace calculation and streak (limit to recent weeks)
      ctx.db.run.findMany({
        where: { completed: true },
        orderBy: { date: "desc" },
        select: { date: true, distance: true, pace: true },
        take: 500, // Reasonable limit for stats calculation
      }),
    ]);

    console.log(`[stats.getSummary] DB queries took ${Date.now() - startTime}ms`);

    const totalRuns = aggregates._count.id ?? 0;
    const totalDistance = Math.round((aggregates._sum.distance ?? 0) * 100) / 100;
    const longestRun = longestRunResult?.distance ?? 0;

    if (totalRuns === 0) {
      return {
        totalRuns: 0,
        totalDistance: 0,
        avgPace: "",
        streak: 0,
        longestRun: 0,
      };
    }

    // Average pace (weighted by distance) - use the recent runs
    // Skip runs with invalid pace data
    let totalWeightedSeconds = 0;
    let totalDistanceForPace = 0;
    for (const run of recentRuns) {
      const paceSeconds = paceToSeconds(run.pace);
      if (!isFinite(paceSeconds) || paceSeconds <= 0) continue;
      totalWeightedSeconds += paceSeconds * run.distance;
      totalDistanceForPace += run.distance;
    }
    const avgPaceSeconds =
      totalDistanceForPace > 0 ? totalWeightedSeconds / totalDistanceForPace : 0;
    const avgPace =
      isFinite(avgPaceSeconds) && avgPaceSeconds > 0 ? secondsToPace(avgPaceSeconds) : "";

    // Current streak (consecutive weeks with >10km total mileage)
    let streak = 0;
    const now = new Date();
    const currentWeekNum = getWeekNumberForDate(now);

    // Group runs by week and sum mileage
    const weeklyMileage = new Map<number, number>();
    for (const run of recentRuns) {
      const weekNum = getWeekNumberForDate(run.date);
      const existing = weeklyMileage.get(weekNum) ?? 0;
      weeklyMileage.set(weekNum, existing + run.distance);
    }

    // Count consecutive weeks backwards from current week with >10km
    const STREAK_THRESHOLD_KM = 10;

    for (let weekNum = currentWeekNum; weekNum >= 1; weekNum--) {
      const mileage = weeklyMileage.get(weekNum) ?? 0;
      if (mileage > STREAK_THRESHOLD_KM) {
        streak++;
      } else {
        // Streak broken - stop counting
        break;
      }
    }

    return {
      totalRuns,
      totalDistance,
      avgPace,
      streak,
      longestRun,
    };
  }),

  /**
   * Get all training phases with weekly breakdown and actuals
   *
   * Returns comprehensive phase data including:
   * - Phase metadata (name, description, focus areas)
   * - Date ranges and duration
   * - Weekly targets vs actuals
   * - Completion rates per phase
   */
  getTrainingPhases: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const currentWeekNum = getWeekNumberForDate(now);

    // Fetch all training plan weeks and completed runs in parallel
    const [trainingPlans, completedRuns, settings] = await Promise.all([
      ctx.db.trainingPlan.findMany({
        orderBy: { weekNumber: "asc" },
      }),
      ctx.db.run.findMany({
        where: { completed: true },
        select: { date: true, distance: true, type: true },
      }),
      ctx.db.userSettings.findFirst(),
    ]);

    if (trainingPlans.length === 0) {
      return { phases: [], currentPhase: null, summary: null };
    }

    // Build a map of runs by week number for efficient lookup
    const runsByWeek = new Map<number, { totalDistance: number; longRunDistance: number }>();
    for (const run of completedRuns) {
      const weekNum = getWeekNumberForDate(run.date);
      const existing = runsByWeek.get(weekNum) ?? { totalDistance: 0, longRunDistance: 0 };
      existing.totalDistance += run.distance;
      if (run.type === RunType.LONG_RUN && run.distance > existing.longRunDistance) {
        existing.longRunDistance = run.distance;
      }
      runsByWeek.set(weekNum, existing);
    }

    // Group training plans by phase
    const phaseGroups = new Map<Phase, typeof trainingPlans>();
    for (const plan of trainingPlans) {
      const existing = phaseGroups.get(plan.phase) ?? [];
      existing.push(plan);
      phaseGroups.set(plan.phase, existing);
    }

    // Build phase data
    const phaseOrder: Phase[] = [
      Phase.BASE_BUILDING,
      Phase.BASE_EXTENSION,
      Phase.SPEED_DEVELOPMENT,
      Phase.PEAK_TAPER,
    ];

    const phases = phaseOrder
      .filter((phase) => phaseGroups.has(phase))
      .map((phase) => {
        const weeks = phaseGroups.get(phase)!;
        const metadata = PHASE_METADATA[phase];

        // Calculate phase date range
        const startDate = weeks[0]!.weekStart;
        const endDate = weeks[weeks.length - 1]!.weekEnd;

        // Determine phase status
        let status: "completed" | "in_progress" | "upcoming";
        if (currentWeekNum > weeks[weeks.length - 1]!.weekNumber) {
          status = "completed";
        } else if (currentWeekNum >= weeks[0]!.weekNumber) {
          status = "in_progress";
        } else {
          status = "upcoming";
        }

        // Build weekly data with actuals
        const weeklyData = weeks.map((week) => {
          const actuals = runsByWeek.get(week.weekNumber);
          let weekStatus: "completed" | "current" | "upcoming";
          if (week.weekNumber < currentWeekNum) {
            weekStatus = "completed";
          } else if (week.weekNumber === currentWeekNum) {
            weekStatus = "current";
          } else {
            weekStatus = "upcoming";
          }

          return {
            weekNumber: week.weekNumber,
            weekStart: week.weekStart,
            weekEnd: week.weekEnd,
            longRunTarget: week.longRunTarget,
            longRunActual: actuals?.longRunDistance ?? null,
            weeklyMileageTarget: week.weeklyMileageTarget,
            weeklyMileageActual: actuals ? Math.round(actuals.totalDistance * 100) / 100 : null,
            status: weekStatus,
          };
        });

        // Calculate completion rate for this phase
        const completedWeeks = weeklyData.filter(
          (w) => w.status === "completed" && w.weeklyMileageActual !== null
        );
        const weeksWithMileage = completedWeeks.filter((w) => (w.weeklyMileageActual ?? 0) > 0);
        const completionRate =
          completedWeeks.length > 0
            ? Math.round((weeksWithMileage.length / completedWeeks.length) * 100)
            : null;

        // Calculate mileage and long run ranges
        const mileageMin = Math.min(...weeks.map((w) => w.weeklyMileageTarget));
        const mileageMax = Math.max(...weeks.map((w) => w.weeklyMileageTarget));
        const longRunMin = Math.min(...weeks.map((w) => w.longRunTarget));
        const longRunMax = Math.max(...weeks.map((w) => w.longRunTarget));

        return {
          id: phase,
          name: metadata.name,
          description: metadata.description,
          focus: metadata.focus,
          color: metadata.color,
          // New rich content fields
          science: metadata.science,
          successCriteria: metadata.successCriteria,
          commonMistakes: metadata.commonMistakes,
          coachTip: metadata.coachTip,
          tableColumns: metadata.tableColumns,
          resources: metadata.resources,
          // Existing computed fields
          status,
          startDate,
          endDate,
          duration: `${weeks.length} weeks`,
          weekCount: weeks.length,
          mileageRange:
            mileageMin === mileageMax
              ? `${mileageMin} km/week`
              : `${mileageMin}-${mileageMax} km/week`,
          longRunRange:
            longRunMin === longRunMax ? `${longRunMin} km` : `${longRunMin}-${longRunMax} km`,
          completionRate,
          weeks: weeklyData,
        };
      });

    // Find current phase
    const currentPhaseData = phases.find((p) => p.status === "in_progress") ?? null;

    // Calculate summary stats
    const totalWeeks = trainingPlans.length;
    const weeksCompleted = Math.min(currentWeekNum - 1, totalWeeks);
    const totalCompletedRuns = completedRuns.length;

    // Calculate days until race
    const raceDate = settings?.raceDate ?? new Date("2026-05-17");
    const daysUntilRace = Math.max(
      0,
      Math.ceil((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Get overall completion rate from completed phases
    const completedPhaseWeeks = phases
      .filter((p) => p.status === "completed" || p.status === "in_progress")
      .flatMap((p) => p.weeks)
      .filter((w) => w.status === "completed");
    const weeksWithActivity = completedPhaseWeeks.filter((w) => (w.weeklyMileageActual ?? 0) > 0);
    const overallCompletionRate =
      completedPhaseWeeks.length > 0
        ? Math.round((weeksWithActivity.length / completedPhaseWeeks.length) * 100)
        : 0;

    // Current week info
    const currentWeekPlan = trainingPlans.find((p) => p.weekNumber === currentWeekNum);
    const currentWeekActuals = runsByWeek.get(currentWeekNum);

    return {
      phases,
      currentPhase: currentPhaseData
        ? {
            ...currentPhaseData,
            currentWeekNumber: currentWeekNum,
            weekInPhase:
              currentWeekNum -
              (phases.find((p) => p.status === "in_progress")?.weeks[0]?.weekNumber ?? 1) +
              1,
            thisWeekTarget: currentWeekPlan?.weeklyMileageTarget ?? 0,
            thisWeekLongRunTarget: currentWeekPlan?.longRunTarget ?? 0,
            thisWeekActual: currentWeekActuals?.totalDistance ?? 0,
          }
        : null,
      summary: {
        totalWeeks,
        weeksCompleted: Math.max(0, weeksCompleted),
        currentWeek: currentWeekNum,
        overallCompletionRate,
        daysUntilRace,
        raceDate,
        raceName: settings?.raceName ?? "Half Marathon",
        totalRuns: totalCompletedRuns,
      },
    };
  }),
});

// Export types for frontend use
export type { PhaseResource, PhaseMetadata, TableColumnKey };
