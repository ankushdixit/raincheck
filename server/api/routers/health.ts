import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const healthRouter = createTRPCRouter({
  check: publicProcedure.query(async ({ ctx }) => {
    try {
      await ctx.db.$queryRaw`SELECT 1`;
      return {
        status: "ok" as const,
        database: "connected" as const,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: "error" as const,
        database: "disconnected" as const,
        timestamp: new Date().toISOString(),
      };
    }
  }),
});
