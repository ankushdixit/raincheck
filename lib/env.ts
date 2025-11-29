/**
 * Environment Variable Validation
 *
 * This file validates environment variables at runtime using Zod.
 * It ensures that all required environment variables are present and valid
 * before the application starts.
 *
 * Benefits:
 * - Fail fast if env vars are missing or invalid
 * - Type-safe environment variables throughout the app
 * - Clear error messages for misconfiguration
 */

import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1, "DATABASE_URL is required"),

  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Weather API
  WEATHER_API_KEY: z.string().min(1, "WEATHER_API_KEY is required"),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  AUTH_PASSWORD: z.string().min(8, "AUTH_PASSWORD must be at least 8 characters"),
  NEXTAUTH_URL: z.string().url().optional(),
});

// Validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  throw new Error("Invalid environment variables");
}

/**
 * Validated environment variables
 *
 * Usage:
 * import { env } from "@/lib/env";
 * const dbUrl = env.DATABASE_URL;
 */
export const env = parsed.data;
