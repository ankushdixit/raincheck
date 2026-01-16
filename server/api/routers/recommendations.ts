/**
 * Recommendations tRPC Router
 *
 * Provides CRUD operations for training recommendations.
 * Read operations are public, write operations require authentication.
 */

import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Phase, RecommendationCategory, RecommendationPriority } from "@prisma/client";

// Validation schemas
const categoryEnum = z.nativeEnum(RecommendationCategory);
const priorityEnum = z.nativeEnum(RecommendationPriority);
const phaseEnum = z.nativeEnum(Phase);

const createRecommendationInput = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: categoryEnum,
  phase: phaseEnum.nullable().optional(),
  priority: priorityEnum.default("MEDIUM"),
  source: z.string().optional(),
});

const updateRecommendationInput = z.object({
  id: z.string(),
  data: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    category: categoryEnum.optional(),
    phase: phaseEnum.nullable().optional(),
    priority: priorityEnum.optional(),
    source: z.string().nullable().optional(),
  }),
});

export const recommendationsRouter = createTRPCRouter({
  /**
   * Get all recommendations
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.recommendation.findMany({
      orderBy: [{ phase: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
    });
  }),

  /**
   * Get recommendations by phase (null for General)
   */
  getByPhase: publicProcedure
    .input(z.object({ phase: phaseEnum.nullable() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.recommendation.findMany({
        where: { phase: input.phase },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      });
    }),

  /**
   * Get recommendations grouped by phase for display
   */
  getGroupedByPhase: publicProcedure.query(async ({ ctx }) => {
    const recommendations = await ctx.db.recommendation.findMany({
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    // Group by phase
    const grouped: Record<string, typeof recommendations> = {
      GENERAL: [],
      BASE_BUILDING: [],
      BASE_EXTENSION: [],
      RECOVERY: [],
      SPEED_DEVELOPMENT: [],
      PEAK_TAPER: [],
    };

    for (const rec of recommendations) {
      const key = rec.phase ?? "GENERAL";
      grouped[key]?.push(rec);
    }

    // Get category counts
    const categoryCounts: Record<string, number> = {};
    for (const rec of recommendations) {
      categoryCounts[rec.category] = (categoryCounts[rec.category] ?? 0) + 1;
    }

    return {
      grouped,
      total: recommendations.length,
      categoryCounts,
    };
  }),

  /**
   * Get a single recommendation by ID
   */
  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.recommendation.findUnique({
      where: { id: input },
    });
  }),

  /**
   * Create a new recommendation
   */
  create: protectedProcedure.input(createRecommendationInput).mutation(async ({ ctx, input }) => {
    return ctx.db.recommendation.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        phase: input.phase ?? null,
        priority: input.priority,
        source: input.source,
      },
    });
  }),

  /**
   * Update a recommendation
   */
  update: protectedProcedure.input(updateRecommendationInput).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.recommendation.findUnique({
      where: { id: input.id },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Recommendation not found",
      });
    }

    return ctx.db.recommendation.update({
      where: { id: input.id },
      data: input.data,
    });
  }),

  /**
   * Delete a recommendation
   */
  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.recommendation.findUnique({
      where: { id: input },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Recommendation not found",
      });
    }

    await ctx.db.recommendation.delete({
      where: { id: input },
    });

    return { success: true };
  }),
});
