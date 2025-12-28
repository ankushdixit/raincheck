/**
 * Planning tRPC Router
 *
 * Exposes the run suggestion algorithm to the frontend. Orchestrates fetching
 * training plan data, weather forecasts, and weather preferences, then calls
 * the planning algorithm and returns formatted suggestions.
 *
 * @example
 * ```typescript
 * const { data: suggestions } = api.planning.generateSuggestions.useQuery({
 *   days: 7,
 *   location: 'Dublin, IE',
 * });
 * ```
 */

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateSuggestions, type Suggestion } from "@/lib/planning-algorithm";
import { fetchHybridForecast } from "@/lib/weather-client";
import { WeatherAPIError, type WeatherData } from "@/types/weather";
import type { PrismaClient } from "@prisma/client";

// Cache TTL in milliseconds (1 hour)
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Fetch weather forecast with cache support.
 * Uses batch queries for optimal performance.
 */
async function getWeatherForecast(
  db: PrismaClient,
  days: number,
  location: string
): Promise<WeatherData[]> {
  const now = new Date();

  // Generate all dates we need
  const datesToFetch: Date[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    datesToFetch.push(date);
  }

  // BATCH QUERY: Check cache for all dates at once (instead of N queries)
  const cachedEntries = await db.weatherCache.findMany({
    where: {
      location,
      datetime: { in: datesToFetch },
      expiresAt: { gt: now },
    },
  });

  // Build a map of cached dates for quick lookup
  const cachedByDate = new Map<number, (typeof cachedEntries)[0]>();
  for (const cached of cachedEntries) {
    cachedByDate.set(cached.datetime.getTime(), cached);
  }

  // Separate cached results and missing dates
  const results: WeatherData[] = [];
  const missingDates: Date[] = [];

  for (const date of datesToFetch) {
    const cached = cachedByDate.get(date.getTime());
    if (cached) {
      results.push({
        location: cached.location,
        latitude: cached.latitude,
        longitude: cached.longitude,
        datetime: cached.datetime,
        timezone: cached.timezone,
        condition: cached.condition,
        description: cached.description,
        temperature: cached.temperature,
        feelsLike: cached.feelsLike,
        precipitation: cached.precipitation,
        humidity: cached.humidity,
        windSpeed: cached.windSpeed,
        windDirection: cached.windDirection,
      });
    } else {
      missingDates.push(date);
    }
  }

  // If all days are cached, return them sorted by date
  if (missingDates.length === 0) {
    return results.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  }

  // Fetch from API for missing days
  try {
    const forecastData = await fetchHybridForecast(location, days);
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

    // Collect data to cache
    const dataToCache: WeatherData[] = [];
    for (const dayData of forecastData) {
      const normalizedDate = new Date(dayData.datetime);
      normalizedDate.setHours(0, 0, 0, 0);

      const isMissing = missingDates.some((d) => d.getTime() === normalizedDate.getTime());
      if (isMissing) {
        dataToCache.push({ ...dayData, datetime: normalizedDate });
        results.push({ ...dayData, datetime: normalizedDate });
      }
    }

    // BATCH UPSERT: Use transaction for all cache updates
    if (dataToCache.length > 0) {
      await db.$transaction(
        dataToCache.map((dayData) =>
          db.weatherCache.upsert({
            where: {
              location_datetime: {
                location: dayData.location,
                datetime: dayData.datetime,
              },
            },
            update: {
              latitude: dayData.latitude,
              longitude: dayData.longitude,
              timezone: dayData.timezone,
              condition: dayData.condition,
              description: dayData.description,
              temperature: dayData.temperature,
              feelsLike: dayData.feelsLike,
              precipitation: dayData.precipitation,
              humidity: dayData.humidity,
              windSpeed: dayData.windSpeed,
              windDirection: dayData.windDirection,
              cachedAt: now,
              expiresAt,
            },
            create: {
              location: dayData.location,
              latitude: dayData.latitude,
              longitude: dayData.longitude,
              datetime: dayData.datetime,
              timezone: dayData.timezone,
              condition: dayData.condition,
              description: dayData.description,
              temperature: dayData.temperature,
              feelsLike: dayData.feelsLike,
              precipitation: dayData.precipitation,
              humidity: dayData.humidity,
              windSpeed: dayData.windSpeed,
              windDirection: dayData.windDirection,
              cachedAt: now,
              expiresAt,
            },
          })
        )
      );
    }

    // Return sorted by date
    return results.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  } catch (error) {
    // Map WeatherAPIError to TRPCError
    if (error instanceof WeatherAPIError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Weather service unavailable. Please try again later.",
      });
    }

    // Unknown error
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Weather service unavailable. Please try again later.",
    });
  }
}

export const planningRouter = createTRPCRouter({
  /**
   * Get the current training phase based on today's date.
   *
   * @returns Current phase info including next two phases with dates, or null if no training plan exists for today
   */
  getCurrentPhase: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Use noon to avoid timezone edge cases

    // Find plan where today falls between weekStart and weekEnd
    // Use multiple queries as fallback for timezone robustness
    let currentPlan = await ctx.db.trainingPlan.findFirst({
      where: {
        weekStart: { lte: today },
        weekEnd: { gte: today },
      },
      orderBy: { weekNumber: "asc" },
    });

    // Fallback: If no exact match, find the plan with weekEnd >= today (earliest that hasn't ended)
    if (!currentPlan) {
      currentPlan = await ctx.db.trainingPlan.findFirst({
        where: {
          weekEnd: { gte: today },
        },
        orderBy: { weekNumber: "asc" },
      });
    }

    // Another fallback: Find the most recent plan that has started
    if (!currentPlan) {
      currentPlan = await ctx.db.trainingPlan.findFirst({
        where: {
          weekStart: { lte: today },
        },
        orderBy: { weekNumber: "desc" },
      });
    }

    if (!currentPlan) {
      return null;
    }

    // Find all future phases (distinct phases after current plan by week number)
    const futurePlans = await ctx.db.trainingPlan.findMany({
      where: {
        weekNumber: { gt: currentPlan.weekNumber },
      },
      orderBy: {
        weekNumber: "asc",
      },
    });

    // Group by phase to get start/end dates for each phase
    // Filter out the current phase - we only want phases that are DIFFERENT from current
    const phaseMap = new Map<string, { start: Date; end: Date }>();
    for (const plan of futurePlans) {
      // Skip weeks that are still part of the current phase
      if (plan.phase === currentPlan.phase) {
        continue;
      }
      const existing = phaseMap.get(plan.phase);
      if (!existing) {
        phaseMap.set(plan.phase, { start: plan.weekStart, end: plan.weekEnd });
      } else {
        // Extend the end date if this week is later
        if (plan.weekEnd > existing.end) {
          existing.end = plan.weekEnd;
        }
      }
    }

    // Convert to array and take first two distinct phases
    const nextPhases = Array.from(phaseMap.entries())
      .slice(0, 2)
      .map(([phase, dates]) => ({
        phase,
        startDate: dates.start,
        endDate: dates.end,
      }));

    return {
      phase: currentPlan.phase,
      weekNumber: currentPlan.weekNumber,
      nextPhases,
      // Keep legacy fields for backward compatibility
      nextPhaseStart: nextPhases[0]?.startDate ?? null,
      nextPhase: nextPhases[0]?.phase ?? null,
    };
  }),

  /**
   * Generate run suggestions based on weather and training plan.
   *
   * Orchestrates:
   * 1. Fetching current training plan week
   * 2. Getting weather forecast (with cache)
   * 3. Loading weather preferences
   * 4. Loading accepted runs (scheduled but not completed)
   * 5. Getting longest completed distance (for progression)
   * 6. Getting last completed run (for rest calculation)
   * 7. Calling the planning algorithm
   * 8. Returning formatted suggestions
   *
   * @param days - Number of days to plan (1-21, default 14)
   * @param location - Location for weather forecast (defaults to user settings)
   * @returns Array of run suggestions
   */
  generateSuggestions: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(21).default(14),
        location: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }): Promise<Suggestion[]> => {
      // 1. Resolve location from input or user settings
      let location = input.location;

      if (!location) {
        const settings = await ctx.db.userSettings.findFirst();
        location = settings?.defaultLocation ?? "Balbriggan, IE";
      }

      // 2. Get current training plan week
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const trainingPlan = await ctx.db.trainingPlan.findFirst({
        where: {
          weekStart: { lte: today },
          weekEnd: { gte: today },
        },
      });

      // Training plan is optional - algorithm uses defaults if not found

      // 3. Get weather forecast (uses cache)
      const forecast = await getWeatherForecast(ctx.db, input.days, location);

      // 4. Get weather preferences
      const preferences = await ctx.db.weatherPreference.findMany();

      // 5. Get accepted runs (scheduled but not completed)
      const acceptedRuns = await ctx.db.run.findMany({
        where: { completed: false },
        orderBy: { date: "asc" },
      });

      // 6. Get longest run distance from ALL runs (completed + scheduled) for progression
      const longestRun = await ctx.db.run.findFirst({
        orderBy: { distance: "desc" },
        select: { distance: true },
      });
      const longestCompletedDistance = longestRun?.distance ?? 0;

      // 7. Get last completed run (for rest calculation)
      const lastCompletedRun = await ctx.db.run.findFirst({
        where: { completed: true },
        orderBy: { date: "desc" },
        select: { date: true, distance: true },
      });

      // 8. Generate and return suggestions
      const suggestions = generateSuggestions({
        forecast,
        trainingPlan,
        preferences,
        existingRuns: [],
        acceptedRuns: acceptedRuns.map((r) => ({
          id: r.id,
          date: r.date,
          runType: r.type,
          completed: r.completed,
          distance: r.distance,
        })),
        longestCompletedDistance,
        lastCompletedRun: lastCompletedRun
          ? {
              date: lastCompletedRun.date,
              distance: lastCompletedRun.distance,
            }
          : null,
      });

      return suggestions;
    }),
});
