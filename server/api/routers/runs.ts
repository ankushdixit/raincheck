/**
 * Runs tRPC Router
 *
 * Provides CRUD operations for runs with protected mutations.
 * Read operations are public (for portfolio visibility), write operations require authentication.
 */

import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { RunType } from "@prisma/client";

// Validation schemas
const paceRegex = /^[0-9]{1,2}:[0-5][0-9]$/; // M:SS or MM:SS
const durationRegex = /^[0-9]{1,3}:[0-5][0-9]$/; // M:SS, MM:SS, or MMM:SS

const runTypeEnum = z.nativeEnum(RunType);

const createRunInput = z.object({
  date: z.date(),
  distance: z.number().positive("Distance must be positive"),
  pace: z.string().regex(paceRegex, "Pace must be in format M:SS or MM:SS"),
  duration: z.string().regex(durationRegex, "Duration must be in format M:SS or MM:SS"),
  type: runTypeEnum,
  notes: z.string().optional(),
  completed: z.boolean().default(false),
});

const updateRunInput = z.object({
  id: z.string(),
  data: z.object({
    date: z.date().optional(),
    distance: z.number().positive("Distance must be positive").optional(),
    pace: z.string().regex(paceRegex, "Pace must be in format M:SS or MM:SS").optional(),
    duration: z
      .string()
      .regex(durationRegex, "Duration must be in format M:SS or MM:SS")
      .optional(),
    type: runTypeEnum.optional(),
    notes: z.string().optional(),
    completed: z.boolean().optional(),
  }),
});

export const runsRouter = createTRPCRouter({
  /**
   * Get all runs with optional filters
   *
   * Public - anyone can view runs
   */
  getAll: publicProcedure
    .input(
      z
        .object({
          limit: z.number().positive().optional(),
          completed: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.run.findMany({
        where: input?.completed !== undefined ? { completed: input.completed } : undefined,
        take: input?.limit,
        orderBy: { date: "desc" },
      });
    }),

  /**
   * Get a single run by ID
   *
   * Public - anyone can view runs
   */
  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.run.findUnique({
      where: { id: input },
    });
  }),

  /**
   * Get runs within a date range
   *
   * Public - anyone can view runs
   */
  getByDateRange: publicProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.run.findMany({
        where: {
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        orderBy: { date: "asc" },
      });
    }),

  /**
   * Create a new run
   *
   * Protected - requires authentication
   * Throws CONFLICT if a run already exists on the given date
   */
  create: protectedProcedure.input(createRunInput).mutation(async ({ ctx, input }) => {
    // Check for duplicate date
    const existingRun = await ctx.db.run.findUnique({
      where: { date: input.date },
    });

    if (existingRun) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A run already exists on this date",
      });
    }

    return ctx.db.run.create({
      data: input,
    });
  }),

  /**
   * Update an existing run
   *
   * Protected - requires authentication
   * Throws NOT_FOUND if run doesn't exist
   * Throws CONFLICT if updating to a date that already has a run
   */
  update: protectedProcedure.input(updateRunInput).mutation(async ({ ctx, input }) => {
    // Check if run exists
    const existingRun = await ctx.db.run.findUnique({
      where: { id: input.id },
    });

    if (!existingRun) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Run not found",
      });
    }

    // If updating date, check for conflicts
    if (input.data.date) {
      const conflictingRun = await ctx.db.run.findUnique({
        where: { date: input.data.date },
      });

      if (conflictingRun && conflictingRun.id !== input.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A run already exists on this date",
        });
      }
    }

    return ctx.db.run.update({
      where: { id: input.id },
      data: input.data,
    });
  }),

  /**
   * Delete a run
   *
   * Protected - requires authentication
   * Throws NOT_FOUND if run doesn't exist
   */
  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    // Check if run exists
    const existingRun = await ctx.db.run.findUnique({
      where: { id: input },
    });

    if (!existingRun) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Run not found",
      });
    }

    await ctx.db.run.delete({
      where: { id: input },
    });

    return { success: true };
  }),

  /**
   * Mark a run as complete or incomplete
   *
   * Protected - requires authentication
   * Throws NOT_FOUND if run doesn't exist
   */
  markComplete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if run exists
      const existingRun = await ctx.db.run.findUnique({
        where: { id: input.id },
      });

      if (!existingRun) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Run not found",
        });
      }

      return ctx.db.run.update({
        where: { id: input.id },
        data: { completed: input.completed },
      });
    }),

  /**
   * Get progress statistics for training
   *
   * Returns:
   * - longestRunDistance: The longest distance covered in any completed run
   * - bestLongRunPace: The fastest pace achieved on a completed long run
   *
   * Public - anyone can view progress stats
   */
  getProgressStats: publicProcedure.query(async ({ ctx }) => {
    // Get all completed runs
    const completedRuns = await ctx.db.run.findMany({
      where: { completed: true },
      orderBy: { distance: "desc" },
    });

    // Get all completed long runs for pace comparison
    const completedLongRuns = await ctx.db.run.findMany({
      where: {
        completed: true,
        type: RunType.LONG_RUN,
      },
    });

    // Find longest distance
    const longestRun = completedRuns[0];
    const longestRunDistance = longestRun?.distance ?? null;

    // Find best (fastest) pace on long runs
    // Pace format is "M:SS" or "MM:SS" - lower is faster
    let bestLongRunPace: string | null = null;

    if (completedLongRuns.length > 0) {
      // Convert pace strings to seconds for comparison
      const paceToSeconds = (pace: string): number => {
        const [minutes, seconds] = pace.split(":").map(Number);
        return (minutes ?? 0) * 60 + (seconds ?? 0);
      };

      // Find the run with the lowest (fastest) pace
      let bestPaceSeconds = Infinity;
      for (const run of completedLongRuns) {
        const paceSeconds = paceToSeconds(run.pace);
        if (paceSeconds < bestPaceSeconds) {
          bestPaceSeconds = paceSeconds;
          bestLongRunPace = run.pace;
        }
      }
    }

    return {
      longestRunDistance,
      bestLongRunPace,
    };
  }),
});
