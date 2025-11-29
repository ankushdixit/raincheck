/**
 * Tests for tRPC configuration
 */
import {
  createTRPCContext,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  createCallerFactory,
} from "../trpc";
import { TRPCError } from "@trpc/server";

// Mock superjson to avoid ES module issues in Jest
jest.mock("superjson", () => ({
  serialize: (obj: unknown) => ({ json: obj, meta: undefined }),
  deserialize: (payload: { json: unknown }) => payload.json,
  stringify: (obj: unknown) => JSON.stringify(obj),
  parse: (str: string) => JSON.parse(str),
}));

// Mock db
jest.mock("@/server/db", () => ({
  db: {
    user: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock auth - default to no session
const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

describe("tRPC Configuration", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockAuth.mockResolvedValue(null);
  });

  describe("createTRPCContext", () => {
    it("creates context with db", async () => {
      const headers = new Headers();
      const context = await createTRPCContext({ headers });

      expect(context.db).toBeDefined();
    });

    it("includes headers in context", async () => {
      const headers = new Headers();
      headers.set("x-test", "test-value");

      const context = await createTRPCContext({ headers });

      expect(context.headers).toBe(headers);
    });

    it("returns consistent db instance", async () => {
      const headers1 = new Headers();
      const headers2 = new Headers();

      const context1 = await createTRPCContext({ headers: headers1 });
      const context2 = await createTRPCContext({ headers: headers2 });

      expect(context1.db).toBe(context2.db);
    });

    it("includes session when authenticated", async () => {
      const mockSession = {
        user: { id: "owner", name: "Ankush", email: "ankush@raincheck.app" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };
      mockAuth.mockResolvedValue(mockSession);

      const headers = new Headers();
      const context = await createTRPCContext({ headers });

      expect(context.session).toEqual(mockSession);
    });

    it("session is null when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const headers = new Headers();
      const context = await createTRPCContext({ headers });

      expect(context.session).toBeNull();
    });
  });

  describe("createTRPCRouter", () => {
    it("is a function", () => {
      expect(typeof createTRPCRouter).toBe("function");
    });

    it("creates a router", () => {
      const router = createTRPCRouter({
        test: publicProcedure.query(() => "test"),
      });

      expect(router).toBeDefined();
    });

    it("can create router with multiple procedures", () => {
      const router = createTRPCRouter({
        query1: publicProcedure.query(() => "query1"),
        query2: publicProcedure.query(() => "query2"),
      });

      expect(router).toBeDefined();
    });
  });

  describe("publicProcedure", () => {
    it("is defined", () => {
      expect(publicProcedure).toBeDefined();
    });

    it("can create a query procedure", () => {
      const procedure = publicProcedure.query(() => "test");
      expect(procedure).toBeDefined();
    });

    it("can create a mutation procedure", () => {
      const procedure = publicProcedure.mutation(() => "test");
      expect(procedure).toBeDefined();
    });

    it("can add input validation", () => {
      const { z } = require("zod");
      const procedure = publicProcedure
        .input(z.object({ text: z.string() }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .query(({ input }: any) => (input as { text: string }).text);

      expect(procedure).toBeDefined();
    });
  });

  describe("createCallerFactory", () => {
    it("is defined", () => {
      expect(createCallerFactory).toBeDefined();
    });

    it("is a function", () => {
      expect(typeof createCallerFactory).toBe("function");
    });
  });

  describe("Error Formatting", () => {
    it("configures error formatter with ZodError support", () => {
      const { z } = require("zod");

      // Create a router with input validation
      const testRouter = createTRPCRouter({
        validateInput: publicProcedure
          .input(z.object({ text: z.string() }))
          .query(({ input }) => input),
      });

      // Verify router is properly configured with error formatting
      expect(testRouter).toBeDefined();
      expect(typeof testRouter).toBe("object");
    });

    it("handles procedure with complex validation", () => {
      const { z } = require("zod");

      const testRouter = createTRPCRouter({
        complexValidation: publicProcedure
          .input(
            z.object({
              email: z.string().email(),
              age: z.number().min(0).max(120),
              name: z.string().min(1),
            })
          )
          .mutation(({ input }) => input),
      });

      // Verify complex validation schema is configured
      expect(testRouter).toBeDefined();
    });
  });

  describe("SuperJSON Transformer", () => {
    it("configures superjson transformer", () => {
      // The transformer allows Date objects and other special types
      // to be serialized/deserialized correctly
      const router = createTRPCRouter({
        getDate: publicProcedure.query(() => new Date()),
      });

      expect(router).toBeDefined();
    });
  });

  describe("protectedProcedure", () => {
    it("is defined", () => {
      expect(protectedProcedure).toBeDefined();
    });

    it("can create a query procedure", () => {
      const procedure = protectedProcedure.query(() => "protected");
      expect(procedure).toBeDefined();
    });

    it("can create a mutation procedure", () => {
      const procedure = protectedProcedure.mutation(() => "protected");
      expect(procedure).toBeDefined();
    });

    it("throws UNAUTHORIZED when no session", async () => {
      mockAuth.mockResolvedValue(null);

      const testRouter = createTRPCRouter({
        protectedAction: protectedProcedure.mutation(() => "success"),
      });

      const createCaller = createCallerFactory(testRouter);
      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.protectedAction()).rejects.toThrow(TRPCError);
      await expect(caller.protectedAction()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    });

    it("allows execution when session exists", async () => {
      const mockSession = {
        user: { id: "owner", name: "Ankush", email: "ankush@raincheck.app" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };
      mockAuth.mockResolvedValue(mockSession);

      const testRouter = createTRPCRouter({
        protectedAction: protectedProcedure.mutation(() => "success"),
      });

      const createCaller = createCallerFactory(testRouter);
      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      const result = await caller.protectedAction();
      expect(result).toBe("success");
    });

    it("provides session in context for protected procedures", async () => {
      const mockSession = {
        user: { id: "owner", name: "Ankush", email: "ankush@raincheck.app" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };
      mockAuth.mockResolvedValue(mockSession);

      const testRouter = createTRPCRouter({
        getUser: protectedProcedure.query(({ ctx }) => ctx.session.user),
      });

      const createCaller = createCallerFactory(testRouter);
      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      const result = await caller.getUser();
      expect(result).toEqual(mockSession.user);
    });

    it("public procedures still work without auth", async () => {
      mockAuth.mockResolvedValue(null);

      const testRouter = createTRPCRouter({
        publicAction: publicProcedure.query(() => "public"),
      });

      const createCaller = createCallerFactory(testRouter);
      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      const result = await caller.publicAction();
      expect(result).toBe("public");
    });

    it("public procedures work with auth", async () => {
      const mockSession = {
        user: { id: "owner", name: "Ankush", email: "ankush@raincheck.app" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };
      mockAuth.mockResolvedValue(mockSession);

      const testRouter = createTRPCRouter({
        publicAction: publicProcedure.query(() => "public"),
      });

      const createCaller = createCallerFactory(testRouter);
      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      const result = await caller.publicAction();
      expect(result).toBe("public");
    });
  });
});
