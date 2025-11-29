import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { healthRouter } from "@/server/api/routers/health";
import { weatherRouter } from "@/server/api/routers/weather";
import { settingsRouter } from "@/server/api/routers/settings";
import { planningRouter } from "@/server/api/routers/planning";
import { runsRouter } from "@/server/api/routers/runs";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
  weather: weatherRouter,
  settings: settingsRouter,
  planning: planningRouter,
  runs: runsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
