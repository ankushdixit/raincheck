/**
 * Weather tRPC Router
 *
 * Provides weather data with cache-first strategy:
 * 1. Check database cache for fresh data (< 1 hour old)
 * 2. On cache miss or stale data, fetch from WeatherAPI.com
 * 3. Store fresh data in cache with 1-hour TTL
 */

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { fetchCurrentWeather } from "@/lib/weather-client";
import { WeatherAPIError, WeatherData } from "@/types/weather";

// Cache TTL in milliseconds (1 hour)
const CACHE_TTL_MS = 60 * 60 * 1000;

export const weatherRouter = createTRPCRouter({
  /**
   * Get current weather for a location
   *
   * Cache-first strategy:
   * - Returns cached data if fresh (< 1 hour old)
   * - Fetches from API and caches if stale or missing
   */
  getCurrentWeather: publicProcedure
    .input(
      z.object({
        location: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }): Promise<WeatherData> => {
      // Get location from input or default from UserSettings
      let location = input.location;

      if (!location) {
        const settings = await ctx.db.userSettings.findFirst();
        location = settings?.defaultLocation ?? "Balbriggan, IE";
      }

      const now = new Date();

      // Check cache for unexpired entry
      const cached = await ctx.db.weatherCache.findFirst({
        where: {
          location,
          expiresAt: {
            gt: now,
          },
        },
        orderBy: {
          cachedAt: "desc",
        },
      });

      if (cached) {
        // Cache hit - return cached data
        return {
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
        };
      }

      // Cache miss - fetch from API
      try {
        const weatherData = await fetchCurrentWeather(location);

        // Calculate expiration time (1 hour from now)
        const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

        // Store in cache (upsert to handle race conditions)
        await ctx.db.weatherCache.upsert({
          where: {
            location_datetime: {
              location: weatherData.location,
              datetime: weatherData.datetime,
            },
          },
          update: {
            latitude: weatherData.latitude,
            longitude: weatherData.longitude,
            condition: weatherData.condition,
            description: weatherData.description,
            temperature: weatherData.temperature,
            feelsLike: weatherData.feelsLike,
            precipitation: weatherData.precipitation,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            windDirection: weatherData.windDirection,
            cachedAt: now,
            expiresAt,
          },
          create: {
            location: weatherData.location,
            latitude: weatherData.latitude,
            longitude: weatherData.longitude,
            datetime: weatherData.datetime,
            condition: weatherData.condition,
            description: weatherData.description,
            temperature: weatherData.temperature,
            feelsLike: weatherData.feelsLike,
            precipitation: weatherData.precipitation,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            windDirection: weatherData.windDirection,
            cachedAt: now,
            expiresAt,
          },
        });

        return weatherData;
      } catch (error) {
        // Map WeatherAPIError to TRPCError
        if (error instanceof WeatherAPIError) {
          const statusCode = error.statusCode ?? 500;

          if (statusCode === 401) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Weather API key invalid",
            });
          }

          if (statusCode === 400 || error.message === "Location not found") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Location not found",
            });
          }

          if (statusCode === 429) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Rate limit exceeded",
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Weather service unavailable",
          });
        }

        // Unknown error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Weather service unavailable",
        });
      }
    }),
});
