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
 * Get the training week number for a given date
 * Training starts Nov 23, 2025 - weeks are Sun-Sat
 */
function getWeekNumberForDate(date: Date, trainingStart: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffMs = date.getTime() - trainingStart.getTime();
  return Math.floor(diffMs / msPerWeek) + 1;
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

      if (trainingPlans.length === 0) {
        return [];
      }

      // Get all completed runs
      const runs = await ctx.db.run.findMany({
        where: { completed: true },
        orderBy: { date: "asc" },
      });

      if (runs.length === 0) {
        return [];
      }

      // Group runs by training week
      const trainingStart = trainingPlans[0]!.weekStart;
      const runsByWeek = new Map<number, number>();

      for (const run of runs) {
        const weekNum = getWeekNumberForDate(run.date, trainingStart);
        if (weekNum >= 1) {
          const currentMileage = runsByWeek.get(weekNum) ?? 0;
          runsByWeek.set(weekNum, currentMileage + run.distance);
        }
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
        const plan = trainingPlans.find((p) => p.weekNumber === weekNum);
        const mileage = runsByWeek.get(weekNum) ?? 0;

        result.push({
          week: `Week ${weekNum}`,
          weekStart:
            plan?.weekStart ??
            new Date(trainingStart.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000),
          mileage: Math.round(mileage * 100) / 100,
          target: plan?.weeklyMileageTarget ?? 0,
          isCurrentWeek: weekNum === currentWeekNum,
        });
      }

      return result;
    }),

  /**
   * Get pace progression data
   *
   * Returns pace data points with dates and run types for charting.
   * Optionally filter by run type.
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

      return runs.map((run) => ({
        date: run.date,
        pace: run.pace,
        paceSeconds: paceToSeconds(run.pace),
        type: run.type,
      }));
    }),

  /**
   * Get long run progression data
   *
   * Returns long run distances with training plan targets.
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

    // Get training plans for target data
    const trainingPlans = await ctx.db.trainingPlan.findMany({
      orderBy: { weekNumber: "asc" },
    });

    if (trainingPlans.length === 0 || longRuns.length === 0) {
      return [];
    }

    const trainingStart = trainingPlans[0]!.weekStart;

    return longRuns.map((run) => {
      const weekNum = getWeekNumberForDate(run.date, trainingStart);
      const plan = trainingPlans.find((p) => p.weekNumber === weekNum);

      return {
        date: run.date,
        distance: run.distance,
        target: plan?.longRunTarget ?? 0,
      };
    });
  }),

  /**
   * Get completion rate statistics
   *
   * Returns completion statistics overall and broken down by training phase.
   * Calculates based on scheduled runs (future + completed).
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
      // Get all runs (scheduled and completed)
      const allRuns = await ctx.db.run.findMany();

      // Filter by phase if specified
      let filteredRuns = allRuns;
      const trainingPlans = await ctx.db.trainingPlan.findMany({
        orderBy: { weekNumber: "asc" },
      });

      if (input?.phase && trainingPlans.length > 0) {
        const trainingStart = trainingPlans[0]!.weekStart;
        const phasePlans = trainingPlans.filter((p) => p.phase === input.phase);

        filteredRuns = allRuns.filter((run) => {
          const weekNum = getWeekNumberForDate(run.date, trainingStart);
          return phasePlans.some((p) => p.weekNumber === weekNum);
        });
      }

      const total = filteredRuns.length;
      const completed = filteredRuns.filter((r) => r.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate by phase
      const byPhase: Array<{
        phase: Phase;
        total: number;
        completed: number;
        rate: number;
      }> = [];

      if (trainingPlans.length > 0) {
        const trainingStart = trainingPlans[0]!.weekStart;
        const phases = [
          Phase.BASE_BUILDING,
          Phase.BASE_EXTENSION,
          Phase.SPEED_DEVELOPMENT,
          Phase.PEAK_TAPER,
        ];

        for (const phase of phases) {
          const phasePlans = trainingPlans.filter((p) => p.phase === phase);
          const phaseRuns = allRuns.filter((run) => {
            const weekNum = getWeekNumberForDate(run.date, trainingStart);
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

    // Current streak (consecutive days with runs ending today or yesterday)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort runs by date descending (most recent first)
    const sortedRuns = [...completedRuns].sort((a, b) => b.date.getTime() - a.date.getTime());

    // Check if most recent run is today or yesterday
    const mostRecentRun = sortedRuns[0];
    if (mostRecentRun) {
      const runDate = new Date(mostRecentRun.date);
      runDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - runDate.getTime()) / (24 * 60 * 60 * 1000));

      // Only count streak if most recent run is within last day
      if (daysDiff <= 1) {
        // Build set of dates with runs
        const runDates = new Set<string>();
        for (const run of sortedRuns) {
          const d = new Date(run.date);
          d.setHours(0, 0, 0, 0);
          runDates.add(d.toISOString());
        }

        // Count consecutive days backwards from most recent run
        const checkDate = new Date(mostRecentRun.date);
        checkDate.setHours(0, 0, 0, 0);

        while (runDates.has(checkDate.toISOString())) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
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
