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
 * @returns Total seconds
 */
function paceToSeconds(pace: string): number {
  const parts = pace.split(":");
  const minutes = parseInt(parts[0] ?? "0", 10);
  const seconds = parseInt(parts[1] ?? "0", 10);
  return minutes * 60 + seconds;
}

/**
 * Convert seconds to pace string format
 * @param totalSeconds - Total seconds
 * @returns Pace in "M:SS" format
 */
function secondsToPace(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0:00";
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

      // Get the training plan to determine week structure
      const trainingPlans = await ctx.db.trainingPlan.findMany({
        orderBy: { weekNumber: "asc" },
      });

      // Get all completed runs
      const runs = await ctx.db.run.findMany({
        where: { completed: true },
        orderBy: { date: "asc" },
      });

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

      const now = new Date();
      const currentWeekNum = getWeekNumberForDate(now, trainingStart);

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
          avgPaceSeconds = weekData.totalTime / weekData.totalDistance;
          avgPace = secondsToPace(avgPaceSeconds);
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
    // Get completed long runs
    const longRuns = await ctx.db.run.findMany({
      where: {
        completed: true,
        type: RunType.LONG_RUN,
      },
      orderBy: { date: "asc" },
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

      // Get all runs scheduled up to today (excludes future runs)
      const allRuns = await ctx.db.run.findMany({
        where: {
          date: { lte: now },
        },
      });

      // Get training plans for phase filtering
      const trainingPlans = await ctx.db.trainingPlan.findMany({
        orderBy: { weekNumber: "asc" },
      });

      // Filter by phase if specified
      let filteredRuns = allRuns;

      if (input?.phase && trainingPlans.length > 0) {
        const phasePlans = trainingPlans.filter((p) => p.phase === input.phase);

        filteredRuns = allRuns.filter((run) => {
          const weekNum = getWeekNumberForDate(run.date);
          return phasePlans.some((p) => p.weekNumber === weekNum);
        });
      }

      const total = filteredRuns.length;
      const completed = filteredRuns.filter((r) => r.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate by phase (also only counting runs up to today)
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

        for (const phase of phases) {
          const phasePlans = trainingPlans.filter((p) => p.phase === phase);
          const phaseRuns = allRuns.filter((run) => {
            const weekNum = getWeekNumberForDate(run.date);
            return phasePlans.some((p) => p.weekNumber === weekNum);
          });

          const phaseTotal = phaseRuns.length;
          const phaseCompleted = phaseRuns.filter((r) => r.completed).length;
          const phaseRate = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;

          byPhase.push({
            phase,
            total: phaseTotal,
            completed: phaseCompleted,
            rate: phaseRate,
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
    const completedRuns = await ctx.db.run.findMany({
      where: { completed: true },
      orderBy: { date: "desc" },
    });

    if (completedRuns.length === 0) {
      return {
        totalRuns: 0,
        totalDistance: 0,
        avgPace: "",
        streak: 0,
        longestRun: 0,
      };
    }

    // Total runs
    const totalRuns = completedRuns.length;

    // Total distance
    const totalDistance =
      Math.round(completedRuns.reduce((sum, run) => sum + run.distance, 0) * 100) / 100;

    // Average pace (weighted by distance)
    let totalWeightedSeconds = 0;
    let totalDistanceForPace = 0;
    for (const run of completedRuns) {
      const paceSeconds = paceToSeconds(run.pace);
      totalWeightedSeconds += paceSeconds * run.distance;
      totalDistanceForPace += run.distance;
    }
    const avgPaceSeconds =
      totalDistanceForPace > 0 ? totalWeightedSeconds / totalDistanceForPace : 0;
    const avgPace = avgPaceSeconds > 0 ? secondsToPace(avgPaceSeconds) : "";

    // Longest run
    const longestRun = Math.max(...completedRuns.map((r) => r.distance));

    // Current streak (consecutive weeks with >10km total mileage)
    let streak = 0;
    const now = new Date();
    const currentWeekNum = getWeekNumberForDate(now);

    // Group runs by week and sum mileage
    const weeklyMileage = new Map<number, number>();
    for (const run of completedRuns) {
      const weekNum = getWeekNumberForDate(run.date);
      const existing = weeklyMileage.get(weekNum) ?? 0;
      weeklyMileage.set(weekNum, existing + run.distance);
    }

    // Count consecutive weeks backwards from current week with >10km
    // A week counts if it has more than 10km total mileage
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
});
