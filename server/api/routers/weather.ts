/**
 * Weather tRPC Router
 *
 * Provides weather data with cache-first strategy:
 * 1. Check database cache for fresh data (< 1 hour old)
 * 2. On cache miss or stale data, fetch from Open-Meteo (free, no API key)
 * 3. Store fresh data in cache with 1-hour TTL
 */

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { fetchCurrentWeather, fetchForecast } from "@/lib/weather-client";
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

          if (statusCode === 404 || error.message === "Location not found") {
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

  /**
   * Get weather forecast for multiple days
   *
   * Cache-first strategy:
   * - Checks cache for each day's data
   * - Fetches from API for any missing/stale days
   * - Caches each day's data with 1-hour TTL
   */
  getForecast: publicProcedure
    .input(
      z.object({
        location: z.string().optional(),
        days: z.number().min(1).max(14).default(7),
      })
    )
    .query(async ({ ctx, input }): Promise<WeatherData[]> => {
      // Get location from input or default from UserSettings
      let location = input.location;

      if (!location) {
        const settings = await ctx.db.userSettings.findFirst();
        location = settings?.defaultLocation ?? "Balbriggan, IE";
      }

      const now = new Date();
      const results: WeatherData[] = [];
      const missingDates: Date[] = [];

      // Generate date keys for each day we need
      for (let i = 0; i < input.days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);

        // Check cache for this date
        const cached = await ctx.db.weatherCache.findFirst({
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
        const forecastData = await fetchForecast(location, input.days);
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
            await ctx.db.weatherCache.upsert({
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
          const statusCode = error.statusCode ?? 500;

          if (statusCode === 404 || error.message === "Location not found") {
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
