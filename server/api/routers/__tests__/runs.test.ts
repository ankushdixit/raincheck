/**
 * Tests for Runs tRPC Router
 *
 * Tests both public (read) and protected (write) procedures.
 */
import { TRPCError } from "@trpc/server";
import { runsRouter } from "../runs";
import { createCallerFactory, createTRPCContext } from "../../trpc";
import { RunType } from "@prisma/client";

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
      run: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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

const mockFindMany = db.run.findMany as jest.Mock;
const mockFindUnique = db.run.findUnique as jest.Mock;
const mockCreate = db.run.create as jest.Mock;
const mockUpdate = db.run.update as jest.Mock;
const mockDelete = db.run.delete as jest.Mock;
const mockAuth = auth as jest.Mock;

describe("Runs Router", () => {
  const createCaller = createCallerFactory(runsRouter);

  const mockRun = {
    id: "run-1",
    date: new Date("2025-01-15"),
    distance: 10,
    pace: "5:30",
    duration: "55:00",
    type: RunType.LONG_RUN,
    notes: "Morning run",
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthenticatedSession = {
    user: { id: "owner", name: "Ankush" },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(null);
  });

  describe("getAll (public)", () => {
    it("returns all runs", async () => {
      mockFindMany.mockResolvedValue([mockRun]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getAll();

      expect(result).toEqual([mockRun]);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: undefined,
        take: undefined,
        orderBy: { date: "desc" },
      });
    });

    it("returns runs with limit", async () => {
      mockFindMany.mockResolvedValue([mockRun]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getAll({ limit: 5 });

      expect(result).toEqual([mockRun]);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: undefined,
        take: 5,
        orderBy: { date: "desc" },
      });
    });

    it("filters by completed status", async () => {
      mockFindMany.mockResolvedValue([mockRun]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getAll({ completed: false });

      expect(result).toEqual([mockRun]);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { completed: false },
        take: undefined,
        orderBy: { date: "desc" },
      });
    });

    it("filters completed runs", async () => {
      const completedRun = { ...mockRun, completed: true };
      mockFindMany.mockResolvedValue([completedRun]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getAll({ completed: true });

      expect(result).toEqual([completedRun]);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { completed: true },
        take: undefined,
        orderBy: { date: "desc" },
      });
    });

    it("works without authentication", async () => {
      mockAuth.mockResolvedValue(null);
      mockFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.getAll()).resolves.toEqual([]);
    });
  });

  describe("getById (public)", () => {
    it("returns run by ID", async () => {
      mockFindUnique.mockResolvedValue(mockRun);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getById("run-1");

      expect(result).toEqual(mockRun);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: "run-1" },
      });
    });

    it("returns null for non-existent run", async () => {
      mockFindUnique.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getById("non-existent");

      expect(result).toBeNull();
    });

    it("works without authentication", async () => {
      mockAuth.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.getById("run-1")).resolves.toBeNull();
    });
  });

  describe("getByDateRange (public)", () => {
    it("returns runs within date range", async () => {
      mockFindMany.mockResolvedValue([mockRun]);

      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getByDateRange({ startDate, endDate });

      expect(result).toEqual([mockRun]);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      });
    });

    it("returns empty array when no runs in range", async () => {
      mockFindMany.mockResolvedValue([]);

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getByDateRange({ startDate, endDate });

      expect(result).toEqual([]);
    });

    it("works without authentication", async () => {
      mockAuth.mockResolvedValue(null);
      mockFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(
        caller.getByDateRange({
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-01-31"),
        })
      ).resolves.toEqual([]);
    });
  });

  describe("create (protected)", () => {
    const validInput = {
      date: new Date("2025-01-20"),
      distance: 10,
      pace: "5:30",
      duration: "55:00",
      type: RunType.LONG_RUN,
      notes: "Morning run",
    };

    it("throws UNAUTHORIZED when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.create(validInput)).rejects.toThrow(TRPCError);
      await expect(caller.create(validInput)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    });

    it("creates run when authenticated", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(null); // No duplicate
      mockCreate.mockResolvedValue({ ...mockRun, ...validInput });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.create(validInput);

      expect(result.distance).toBe(10);
      expect(mockCreate).toHaveBeenCalledWith({
        data: { ...validInput, completed: false },
      });
    });

    it("throws CONFLICT for duplicate date", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(mockRun); // Duplicate exists

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.create(validInput)).rejects.toThrow(TRPCError);
      await expect(caller.create(validInput)).rejects.toMatchObject({
        code: "CONFLICT",
        message: "A run already exists on this date",
      });
    });

    it("validates pace format", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.create({ ...validInput, pace: "invalid" })).rejects.toThrow();

      await expect(caller.create({ ...validInput, pace: "5:60" })).rejects.toThrow();

      await expect(caller.create({ ...validInput, pace: "123:30" })).rejects.toThrow();
    });

    it("validates duration format", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.create({ ...validInput, duration: "invalid" })).rejects.toThrow();

      await expect(caller.create({ ...validInput, duration: "55:60" })).rejects.toThrow();
    });

    it("validates distance is positive", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.create({ ...validInput, distance: -5 })).rejects.toThrow();

      await expect(caller.create({ ...validInput, distance: 0 })).rejects.toThrow();
    });

    it("accepts valid pace formats", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockImplementation((args) => Promise.resolve({ ...mockRun, ...args.data }));

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      // Single digit minute
      await expect(caller.create({ ...validInput, pace: "5:30" })).resolves.toBeDefined();

      // Double digit minute
      mockFindUnique.mockResolvedValue(null);
      await expect(
        caller.create({ ...validInput, date: new Date("2025-01-21"), pace: "12:00" })
      ).resolves.toBeDefined();
    });

    it("accepts valid duration formats", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockImplementation((args) => Promise.resolve({ ...mockRun, ...args.data }));

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      // Single digit minute
      await expect(caller.create({ ...validInput, duration: "5:30" })).resolves.toBeDefined();

      // Double digit minute
      mockFindUnique.mockResolvedValue(null);
      await expect(
        caller.create({ ...validInput, date: new Date("2025-01-22"), duration: "55:30" })
      ).resolves.toBeDefined();

      // Triple digit minute (for long runs)
      mockFindUnique.mockResolvedValue(null);
      await expect(
        caller.create({ ...validInput, date: new Date("2025-01-23"), duration: "120:00" })
      ).resolves.toBeDefined();
    });

    it("defaults completed to false", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ ...mockRun, completed: false });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      await caller.create(validInput);

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ completed: false }),
      });
    });

    it("allows setting completed to true", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ ...mockRun, completed: true });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      await caller.create({ ...validInput, completed: true });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ completed: true }),
      });
    });
  });

  describe("update (protected)", () => {
    const updateInput = {
      id: "run-1",
      data: {
        distance: 12,
        notes: "Updated notes",
      },
    };

    it("throws UNAUTHORIZED when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.update(updateInput)).rejects.toThrow(TRPCError);
      await expect(caller.update(updateInput)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("updates run when authenticated", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(mockRun);
      mockUpdate.mockResolvedValue({ ...mockRun, ...updateInput.data });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.update(updateInput);

      expect(result.distance).toBe(12);
      expect(result.notes).toBe("Updated notes");
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "run-1" },
        data: updateInput.data,
      });
    });

    it("throws NOT_FOUND when run doesn't exist", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.update(updateInput)).rejects.toThrow(TRPCError);
      await expect(caller.update(updateInput)).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Run not found",
      });
    });

    it("throws CONFLICT when updating to existing date", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      const newDate = new Date("2025-01-25");

      // First call returns the run being updated
      // Second call returns a conflicting run
      mockFindUnique
        .mockResolvedValueOnce(mockRun)
        .mockResolvedValueOnce({ ...mockRun, id: "run-2", date: newDate });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.update({ id: "run-1", data: { date: newDate } })).rejects.toMatchObject({
        code: "CONFLICT",
        message: "A run already exists on this date",
      });
    });

    it("allows updating to same date (no conflict with self)", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      const sameDate = new Date("2025-01-15");

      // Both calls return the same run (updating to its own date)
      mockFindUnique.mockResolvedValueOnce(mockRun).mockResolvedValueOnce(mockRun);
      mockUpdate.mockResolvedValue({ ...mockRun, date: sameDate });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.update({ id: "run-1", data: { date: sameDate } });

      expect(result).toBeDefined();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("validates pace format on update", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(mockRun);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.update({ id: "run-1", data: { pace: "invalid" } })).rejects.toThrow();
    });

    it("validates distance is positive on update", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(mockRun);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.update({ id: "run-1", data: { distance: -5 } })).rejects.toThrow();
    });
  });

  describe("delete (protected)", () => {
    it("throws UNAUTHORIZED when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.delete("run-1")).rejects.toThrow(TRPCError);
      await expect(caller.delete("run-1")).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("deletes run when authenticated", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(mockRun);
      mockDelete.mockResolvedValue(mockRun);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.delete("run-1");

      expect(result).toEqual({ success: true });
      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: "run-1" },
      });
    });

    it("throws NOT_FOUND when run doesn't exist", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.delete("non-existent")).rejects.toThrow(TRPCError);
      await expect(caller.delete("non-existent")).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Run not found",
      });
    });
  });

  describe("markComplete (protected)", () => {
    it("throws UNAUTHORIZED when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.markComplete({ id: "run-1", completed: true })).rejects.toThrow(
        TRPCError
      );
      await expect(caller.markComplete({ id: "run-1", completed: true })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("marks run as complete", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(mockRun);
      mockUpdate.mockResolvedValue({ ...mockRun, completed: true });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.markComplete({ id: "run-1", completed: true });

      expect(result.completed).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "run-1" },
        data: { completed: true },
      });
    });

    it("marks run as incomplete", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue({ ...mockRun, completed: true });
      mockUpdate.mockResolvedValue({ ...mockRun, completed: false });

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.markComplete({ id: "run-1", completed: false });

      expect(result.completed).toBe(false);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "run-1" },
        data: { completed: false },
      });
    });

    it("throws NOT_FOUND when run doesn't exist", async () => {
      mockAuth.mockResolvedValue(mockAuthenticatedSession);
      mockFindUnique.mockResolvedValue(null);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.markComplete({ id: "non-existent", completed: true })).rejects.toThrow(
        TRPCError
      );
      await expect(
        caller.markComplete({ id: "non-existent", completed: true })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Run not found",
      });
    });
  });

  describe("getProgressStats (public)", () => {
    const mockLongRuns = [
      {
        ...mockRun,
        id: "run-1",
        distance: 16,
        pace: "6:30",
        type: RunType.LONG_RUN,
        completed: true,
      },
      {
        ...mockRun,
        id: "run-2",
        distance: 18,
        pace: "6:45",
        type: RunType.LONG_RUN,
        completed: true,
      },
      {
        ...mockRun,
        id: "run-3",
        distance: 14,
        pace: "6:15",
        type: RunType.LONG_RUN,
        completed: true,
      },
    ];

    const mockAllCompletedRuns = [
      { ...mockRun, id: "run-1", distance: 18, completed: true },
      { ...mockRun, id: "run-2", distance: 16, completed: true },
      { ...mockRun, id: "run-3", distance: 10, completed: true },
    ];

    it("returns longest run distance", async () => {
      mockFindMany
        .mockResolvedValueOnce(mockAllCompletedRuns) // completed runs
        .mockResolvedValueOnce(mockLongRuns); // completed long runs

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getProgressStats();

      expect(result.longestRunDistance).toBe(18);
    });

    it("returns best (fastest) long run pace", async () => {
      mockFindMany
        .mockResolvedValueOnce(mockAllCompletedRuns) // completed runs
        .mockResolvedValueOnce(mockLongRuns); // completed long runs

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getProgressStats();

      // 6:15 is the fastest pace among long runs
      expect(result.bestLongRunPace).toBe("6:15");
    });

    it("returns null when no completed runs exist", async () => {
      mockFindMany
        .mockResolvedValueOnce([]) // no completed runs
        .mockResolvedValueOnce([]); // no completed long runs

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getProgressStats();

      expect(result.longestRunDistance).toBeNull();
      expect(result.bestLongRunPace).toBeNull();
    });

    it("returns null for pace when no completed long runs exist", async () => {
      const easyRuns = [
        { ...mockRun, id: "run-1", distance: 10, type: RunType.EASY_RUN, completed: true },
      ];

      mockFindMany
        .mockResolvedValueOnce(easyRuns) // completed runs (only easy)
        .mockResolvedValueOnce([]); // no completed long runs

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getProgressStats();

      expect(result.longestRunDistance).toBe(10);
      expect(result.bestLongRunPace).toBeNull();
    });

    it("works without authentication (public procedure)", async () => {
      mockAuth.mockResolvedValue(null); // Not authenticated
      mockFindMany.mockResolvedValueOnce(mockAllCompletedRuns).mockResolvedValueOnce(mockLongRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getProgressStats();

      expect(result.longestRunDistance).toBe(18);
      expect(result.bestLongRunPace).toBe("6:15");
    });

    it("only considers completed runs", async () => {
      const mixedRuns = [
        { ...mockRun, id: "run-1", distance: 20, completed: false }, // Not completed - should be ignored
        { ...mockRun, id: "run-2", distance: 15, completed: true }, // Completed
      ];

      // Query for completed runs (ordered by distance desc)
      mockFindMany
        .mockResolvedValueOnce([mixedRuns[1]]) // Only the completed run
        .mockResolvedValueOnce([]); // No long runs

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getProgressStats();

      expect(result.longestRunDistance).toBe(15); // Not 20 (incomplete run)
    });
  });
});
