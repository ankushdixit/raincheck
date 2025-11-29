/**
 * Settings tRPC Router
 *
 * Provides user settings management with protected mutations.
 * Read operations are public, write operations require authentication.
 */

import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const settingsRouter = createTRPCRouter({
  /**
   * Get current user settings
   *
   * Public - anyone can view settings
   */
  get: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.userSettings.findFirst();

    if (!settings) {
      return null;
    }

    return {
      defaultLocation: settings.defaultLocation,
      raceDate: settings.raceDate,
      raceName: settings.raceName,
      targetTime: settings.targetTime,
    };
  }),

  /**
   * Update default location
   *
   * Protected - requires authentication
   */
  updateLocation: protectedProcedure
    .input(
      z.object({
        location: z.string().min(1, "Location is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find existing settings or create new
      const existing = await ctx.db.userSettings.findFirst();

      let settings;
      if (existing) {
        settings = await ctx.db.userSettings.update({
          where: { id: existing.id },
          data: { defaultLocation: input.location },
        });
      } else {
        settings = await ctx.db.userSettings.create({
          data: {
            defaultLocation: input.location,
          },
        });
      }

      return {
        defaultLocation: settings.defaultLocation,
      };
    }),

  /**
   * Update race configuration
   *
   * Protected - requires authentication
   */
  updateRace: protectedProcedure
    .input(
      z.object({
        raceDate: z.date().optional(),
        raceName: z.string().min(1).optional(),
        targetTime: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find existing settings or create new
      const existing = await ctx.db.userSettings.findFirst();

      let settings;
      if (existing) {
        settings = await ctx.db.userSettings.update({
          where: { id: existing.id },
          data: {
            ...(input.raceDate && { raceDate: input.raceDate }),
            ...(input.raceName && { raceName: input.raceName }),
            ...(input.targetTime && { targetTime: input.targetTime }),
          },
        });
      } else {
        settings = await ctx.db.userSettings.create({
          data: {
            raceDate: input.raceDate,
            raceName: input.raceName,
            targetTime: input.targetTime,
          },
        });
      }

      return {
        raceDate: settings.raceDate,
        raceName: settings.raceName,
        targetTime: settings.targetTime,
      };
    }),
});
