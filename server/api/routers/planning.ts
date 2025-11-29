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
 * Uses the same caching strategy as the weather router.
 */
async function getWeatherForecast(
  db: PrismaClient,
  days: number,
  location: string
): Promise<WeatherData[]> {
  const now = new Date();
  const results: WeatherData[] = [];
  const missingDates: Date[] = [];

  // Generate date keys for each day we need
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    // Check cache for this date
    const cached = await db.weatherCache.findFirst({
      where: {
        location,
        datetime: date,
        expiresAt: {
          gt: now,
        },
      },
    });

    if (cached) {
      results.push({
        location: cached.location,
        latitude: cached.latitude,
        longitude: cached.longitude,
        datetime: cached.datetime,
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

    // Cache each day's data and add to results
    for (const dayData of forecastData) {
      // Normalize datetime to midnight for consistent cache keys
      const normalizedDate = new Date(dayData.datetime);
      normalizedDate.setHours(0, 0, 0, 0);

      // Check if this is one of the missing dates
      const isMissing = missingDates.some((d) => d.getTime() === normalizedDate.getTime());

      if (isMissing) {
        // Cache this day's data
        await db.weatherCache.upsert({
          where: {
            location_datetime: {
              location: dayData.location,
              datetime: normalizedDate,
            },
          },
          update: {
            latitude: dayData.latitude,
            longitude: dayData.longitude,
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
            datetime: normalizedDate,
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
        });

        results.push({
          ...dayData,
          datetime: normalizedDate,
        });
      }
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
   * Generate run suggestions based on weather and training plan.
   *
   * Orchestrates:
   * 1. Fetching current training plan week
   * 2. Getting weather forecast (with cache)
   * 3. Loading weather preferences
   * 4. Calling the planning algorithm
   * 5. Returning formatted suggestions
   *
   * @param days - Number of days to plan (1-14, default 7)
   * @param location - Location for weather forecast (defaults to user settings)
   * @returns Array of run suggestions
   */
  generateSuggestions: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(14).default(7),
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

      // If no training plan found, return empty array (graceful degradation)
      if (!trainingPlan) {
        return [];
      }

      // 3. Get weather forecast (uses cache)
      const forecast = await getWeatherForecast(ctx.db, input.days, location);

      // 4. Get weather preferences
      const preferences = await ctx.db.weatherPreference.findMany();

      // 5. Generate and return suggestions
      // Note: existingRuns would come from a Runs table if we had one
      // For now, we pass an empty array as the spec doesn't define a Run model
      const suggestions = generateSuggestions({
        forecast,
        trainingPlan,
        preferences,
        existingRuns: [],
      });

      return suggestions;
    }),
});
