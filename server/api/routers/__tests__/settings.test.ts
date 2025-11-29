/**
 * Tests for Settings tRPC Router
 *
 * Tests both public (read) and protected (write) procedures.
 */
import { TRPCError } from "@trpc/server";
import { settingsRouter } from "../settings";
import { createCallerFactory, createTRPCContext } from "../../trpc";

// Mock superjson
jest.mock("superjson", () => ({
  serialize: (obj: unknown) => ({ json: obj, meta: undefined }),
  deserialize: (payload: { json: unknown }) => payload.json,
  stringify: (obj: unknown) => JSON.stringify(obj),
  parse: (str: string) => JSON.parse(str),
}));

// Mock db
jest.mock("@/server/db", () => {
  return {
    db: {
      userSettings: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    },
  };
});

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Get the mocked functions after imports
import { db } from "@/server/db";
import { auth } from "@/lib/auth";

const mockFindFirst = db.userSettings.findFirst as jest.Mock;
const mockUpdate = db.userSettings.update as jest.Mock;
const mockCreate = db.userSettings.create as jest.Mock;
const mockAuth = auth as jest.Mock;

describe("Settings Router", () => {
  const createCaller = createCallerFactory(settingsRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(null);
  });

  describe("get (public)", () => {
    it("returns null when no settings exist", async () => {
      mockFindFirst.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.get();

      expect(result).toBeNull();
    });

    it("returns settings when they exist", async () => {
      const mockSettings = {
        defaultLocation: "Dublin, IE",
        raceDate: new Date("2025-04-20"),
        raceName: "Dublin Half Marathon",
        targetTime: "01:45:00",
      };
      mockFindFirst.mockResolvedValue(mockSettings);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.get();

      expect(result).toEqual(mockSettings);
    });

    it("works without authentication", async () => {
      mockAuth.mockResolvedValue(null);
      mockFindFirst.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      // Should not throw
      await expect(caller.get()).resolves.toBeNull();
    });

    it("works with authentication", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner", name: "Ankush" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });
      mockFindFirst.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.get()).resolves.toBeNull();
    });
  });

  describe("updateLocation (protected)", () => {
    it("throws UNAUTHORIZED when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.updateLocation({ location: "Dublin, IE" })).rejects.toThrow(TRPCError);
      await expect(caller.updateLocation({ location: "Dublin, IE" })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    });

    it("updates location when authenticated", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner", name: "Ankush" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      // Existing settings found - update path
      mockFindFirst.mockResolvedValue({ id: "settings-1" });
      mockUpdate.mockResolvedValue({
        defaultLocation: "Dublin, IE",
      });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.updateLocation({ location: "Dublin, IE" });

      expect(result).toEqual({ defaultLocation: "Dublin, IE" });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "settings-1" },
        data: { defaultLocation: "Dublin, IE" },
      });
    });

    it("creates settings when none exist", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner", name: "Ankush" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      // No existing settings - create path
      mockFindFirst.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        defaultLocation: "Dublin, IE",
      });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.updateLocation({ location: "Dublin, IE" });

      expect(result).toEqual({ defaultLocation: "Dublin, IE" });
      expect(mockCreate).toHaveBeenCalledWith({
        data: { defaultLocation: "Dublin, IE" },
      });
    });

    it("rejects empty location", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner", name: "Ankush" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.updateLocation({ location: "" })).rejects.toThrow();
    });
  });

  describe("updateRace (protected)", () => {
    it("throws UNAUTHORIZED when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.updateRace({ raceName: "Dublin Half" })).rejects.toThrow(TRPCError);
      await expect(caller.updateRace({ raceName: "Dublin Half" })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("updates race details when authenticated", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner", name: "Ankush" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const raceDate = new Date("2025-04-20");
      // Existing settings found - update path
      mockFindFirst.mockResolvedValue({ id: "settings-1" });
      mockUpdate.mockResolvedValue({
        raceDate,
        raceName: "Dublin Half Marathon",
        targetTime: "01:45:00",
      });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.updateRace({
        raceDate,
        raceName: "Dublin Half Marathon",
        targetTime: "01:45:00",
      });

      expect(result).toEqual({
        raceDate,
        raceName: "Dublin Half Marathon",
        targetTime: "01:45:00",
      });
    });

    it("allows partial updates", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "owner", name: "Ankush" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      // Existing settings found - update path
      mockFindFirst.mockResolvedValue({ id: "settings-1" });
      mockUpdate.mockResolvedValue({
        raceDate: new Date(),
        raceName: "Updated Race",
        targetTime: "02:00:00",
      });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      // Only update raceName
      await expect(caller.updateRace({ raceName: "Updated Race" })).resolves.toBeDefined();
    });
  });
});
