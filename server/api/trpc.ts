/**
 * This is the server-side tRPC API setup
 *
 * 1. CONTEXT
 * This section defines the "contexts" that are available in the backend API.
 * These allow you to access things when processing a request, like the database or session.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/server/db";
import { auth } from "@/lib/auth";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Get the session from NextAuth
  const session = await auth();

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE
 * These are the pieces you use to build your tRPC API. You should import these a lot.
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * Used for read operations that don't require authentication.
 * All queries should use this procedure to allow public access.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * Used for mutation operations that require authentication.
 * Throws UNAUTHORIZED error if no valid session exists.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Infers the `session` as non-nullable
      session: ctx.session,
    },
  });
});
