/**
 * Tests for Stats tRPC Router
 *
 * Tests all five public procedures for training analytics.
 */
import { statsRouter } from "../stats";
import { createCallerFactory, createTRPCContext } from "../../trpc";
import { RunType, Phase } from "@prisma/client";

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
      },
      trainingPlan: {
        findMany: jest.fn(),
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

const mockRunFindMany = db.run.findMany as jest.Mock;
const mockTrainingPlanFindMany = db.trainingPlan.findMany as jest.Mock;
const mockAuth = auth as jest.Mock;

describe("Stats Router", () => {
  const createCaller = createCallerFactory(statsRouter);

  // Mock training plan data
  const mockTrainingPlans = [
    {
      id: "plan-1",
      phase: Phase.BASE_BUILDING,
      weekNumber: 1,
      weekStart: new Date("2025-11-23T00:00:00.000Z"),
      weekEnd: new Date("2025-11-29T23:59:59.999Z"),
      longRunTarget: 12,
      weeklyMileageTarget: 24,
    },
    {
      id: "plan-2",
      phase: Phase.BASE_BUILDING,
      weekNumber: 2,
      weekStart: new Date("2025-11-30T00:00:00.000Z"),
      weekEnd: new Date("2025-12-06T23:59:59.999Z"),
      longRunTarget: 12,
      weeklyMileageTarget: 24,
    },
    {
      id: "plan-3",
      phase: Phase.BASE_EXTENSION,
      weekNumber: 7,
      weekStart: new Date("2026-01-05T00:00:00.000Z"),
      weekEnd: new Date("2026-01-11T23:59:59.999Z"),
      longRunTarget: 15,
      weeklyMileageTarget: 28,
    },
  ];

  // Mock run data
  const mockCompletedRuns = [
    {
      id: "run-1",
      date: new Date("2025-11-23T08:00:00.000Z"), // Week 1
      distance: 11.48,
      pace: "6:45",
      duration: "77:32",
      type: RunType.LONG_RUN,
      completed: true,
    },
    {
      id: "run-2",
      date: new Date("2025-11-26T08:00:00.000Z"), // Week 1
      distance: 6.15,
      pace: "6:39",
      duration: "40:53",
      type: RunType.EASY_RUN,
      completed: true,
    },
    {
      id: "run-3",
      date: new Date("2025-11-30T08:00:00.000Z"), // Week 2
      distance: 12,
      pace: "6:40",
      duration: "80:00",
      type: RunType.LONG_RUN,
      completed: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(null);

    // Mock Date.now to be within training plan
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-12-01T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getWeeklyMileage", () => {
    it("returns weekly mileage with targets", async () => {
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check structure of first week
      const week1 = result.find((w) => w.week === "Week 1");
      expect(week1).toBeDefined();
      expect(week1?.mileage).toBeCloseTo(17.63, 1); // 11.48 + 6.15
      expect(week1?.target).toBe(24);
    });

    it("returns mileage data without targets when no training plans exist", async () => {
      mockTrainingPlanFindMany.mockResolvedValue([]);
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage();

      // Should still return mileage data, just without targets
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // All targets should be 0 when no training plan
      result.forEach((week) => {
        expect(week.target).toBe(0);
      });
    });

    it("returns empty array when no runs exist", async () => {
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage();

      expect(result).toEqual([]);
    });

    it("respects weeks parameter", async () => {
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage({ weeks: 4 });

      expect(result.length).toBeLessThanOrEqual(4);
    });

    it("marks current week correctly", async () => {
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage();

      // Current week (Dec 1) should be week 2
      const currentWeek = result.find((w) => w.isCurrentWeek);
      expect(currentWeek?.week).toBe("Week 2");
    });

    it("includes pre-training weeks with 'Pre' label", async () => {
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      // Add runs from before training plan start (Nov 23)
      const preTrainingRuns = [
        {
          id: "pre-run-1",
          date: new Date("2025-09-23T08:00:00.000Z"), // 9 weeks before training
          distance: 7,
          pace: "6:20",
          duration: "44:20",
          type: RunType.LONG_RUN,
          completed: true,
        },
        {
          id: "pre-run-2",
          date: new Date("2025-11-16T08:00:00.000Z"), // 1 week before training
          distance: 10.82,
          pace: "6:42",
          duration: "72:25",
          type: RunType.LONG_RUN,
          completed: true,
        },
        ...mockCompletedRuns,
      ];
      mockRunFindMany.mockResolvedValue(preTrainingRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage({ weeks: 15 });

      // Should include pre-training weeks labeled "Pre X"
      const preWeeks = result.filter((w) => w.week.startsWith("Pre"));
      expect(preWeeks.length).toBeGreaterThan(0);

      // Pre-training weeks should have target 0
      preWeeks.forEach((week) => {
        expect(week.target).toBe(0);
      });

      // Pre 1 should be the week before Week 1 (Nov 16-22)
      const pre1 = result.find((w) => w.week === "Pre 1");
      expect(pre1).toBeDefined();
      expect(pre1?.mileage).toBeCloseTo(10.82, 1);
    });

    it("works without authentication (public)", async () => {
      mockAuth.mockResolvedValue(null);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.getWeeklyMileage()).resolves.toBeDefined();
    });
  });

  describe("getPaceProgression", () => {
    it("returns pace data for all runs", async () => {
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getPaceProgression();

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("pace");
      expect(result[0]).toHaveProperty("paceSeconds");
      expect(result[0]).toHaveProperty("type");
    });

    it("converts pace string to seconds correctly", async () => {
      mockRunFindMany.mockResolvedValue([mockCompletedRuns[0]]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getPaceProgression();

      // 6:45 = 6*60 + 45 = 405 seconds
      expect(result[0]?.paceSeconds).toBe(405);
    });

    it("filters by run type when specified", async () => {
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.filter((r) => r.type === RunType.LONG_RUN)
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      await caller.getPaceProgression({ runType: RunType.LONG_RUN });

      expect(mockRunFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: RunType.LONG_RUN,
          }),
        })
      );
    });

    it("returns empty array when no runs exist", async () => {
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getPaceProgression();

      expect(result).toEqual([]);
    });

    it("works without authentication (public)", async () => {
      mockAuth.mockResolvedValue(null);
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.getPaceProgression()).resolves.toEqual([]);
    });
  });

  describe("getLongRunProgression", () => {
    const longRuns = mockCompletedRuns.filter((r) => r.type === RunType.LONG_RUN);

    it("returns long run distances with targets", async () => {
      mockRunFindMany.mockResolvedValue(longRuns);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getLongRunProgression();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("distance");
      expect(result[0]).toHaveProperty("target");
    });

    it("matches target from training plan week", async () => {
      mockRunFindMany.mockResolvedValue([longRuns[0]]);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getLongRunProgression();

      // Run on Nov 23 (Week 1) should have target of 12km
      expect(result[0]?.target).toBe(12);
    });

    it("returns empty array when no long runs exist", async () => {
      mockRunFindMany.mockResolvedValue([]);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getLongRunProgression();

      expect(result).toEqual([]);
    });

    it("returns empty array when no training plans exist", async () => {
      mockRunFindMany.mockResolvedValue(longRuns);
      mockTrainingPlanFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getLongRunProgression();

      expect(result).toEqual([]);
    });

    it("only includes LONG_RUN type", async () => {
      mockRunFindMany.mockResolvedValue(longRuns);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      await caller.getLongRunProgression();

      expect(mockRunFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: RunType.LONG_RUN,
          }),
        })
      );
    });
  });

  describe("getCompletionRate", () => {
    it("returns completion statistics", async () => {
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getCompletionRate();

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("completed");
      expect(result).toHaveProperty("rate");
      expect(result).toHaveProperty("byPhase");
    });

    it("calculates correct completion rate", async () => {
      const mixedRuns = [
        { ...mockCompletedRuns[0], completed: true },
        { ...mockCompletedRuns[1], completed: true },
        { ...mockCompletedRuns[2], completed: false },
      ];
      mockRunFindMany.mockResolvedValue(mixedRuns);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getCompletionRate();

      expect(result.total).toBe(3);
      expect(result.completed).toBe(2);
      expect(result.rate).toBe(67); // 2/3 ≈ 67%
    });

    it("returns 0% rate when no runs completed", async () => {
      const noCompletedRuns = mockCompletedRuns.map((r) => ({ ...r, completed: false }));
      mockRunFindMany.mockResolvedValue(noCompletedRuns);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getCompletionRate();

      expect(result.rate).toBe(0);
    });

    it("returns 0% rate when no runs exist", async () => {
      mockRunFindMany.mockResolvedValue([]);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getCompletionRate();

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.rate).toBe(0);
    });

    it("includes breakdown by phase", async () => {
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getCompletionRate();

      expect(result.byPhase).toHaveLength(4);
      expect(result.byPhase[0]).toHaveProperty("phase");
      expect(result.byPhase[0]).toHaveProperty("total");
      expect(result.byPhase[0]).toHaveProperty("completed");
      expect(result.byPhase[0]).toHaveProperty("rate");
    });

    it("filters by phase when specified", async () => {
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const filteredResult = await caller.getCompletionRate({ phase: Phase.BASE_BUILDING });

      // Only runs from BASE_BUILDING phase weeks should be counted
      expect(filteredResult.total).toBeLessThanOrEqual(mockCompletedRuns.length);
    });
  });

  describe("getSummary", () => {
    it("returns summary statistics", async () => {
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      expect(result).toHaveProperty("totalRuns");
      expect(result).toHaveProperty("totalDistance");
      expect(result).toHaveProperty("avgPace");
      expect(result).toHaveProperty("streak");
      expect(result).toHaveProperty("longestRun");
    });

    it("calculates correct total runs", async () => {
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      expect(result.totalRuns).toBe(3);
    });

    it("calculates correct total distance", async () => {
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      // 11.48 + 6.15 + 12 = 29.63
      expect(result.totalDistance).toBeCloseTo(29.63, 1);
    });

    it("calculates weighted average pace", async () => {
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      // Average pace should be a valid pace string
      expect(result.avgPace).toMatch(/^\d{1,2}:\d{2}$/);
    });

    it("finds longest run distance", async () => {
      mockRunFindMany.mockResolvedValue(mockCompletedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      expect(result.longestRun).toBe(12);
    });

    it("returns zeros and empty string when no runs exist", async () => {
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      expect(result.totalRuns).toBe(0);
      expect(result.totalDistance).toBe(0);
      expect(result.avgPace).toBe("");
      expect(result.streak).toBe(0);
      expect(result.longestRun).toBe(0);
    });

    it("calculates streak for consecutive days", async () => {
      // Runs on Nov 29, Nov 30, Dec 1 (today)
      const consecutiveRuns = [
        {
          ...mockCompletedRuns[0],
          date: new Date("2025-12-01T08:00:00.000Z"),
        },
        {
          ...mockCompletedRuns[1],
          date: new Date("2025-11-30T08:00:00.000Z"),
        },
        {
          ...mockCompletedRuns[2],
          date: new Date("2025-11-29T08:00:00.000Z"),
        },
      ];
      mockRunFindMany.mockResolvedValue(consecutiveRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      expect(result.streak).toBe(3);
    });

    it("returns 0 streak when no recent runs", async () => {
      // Runs from over a week ago
      const oldRuns = mockCompletedRuns.map((r) => ({
        ...r,
        date: new Date("2025-11-20T08:00:00.000Z"),
      }));
      mockRunFindMany.mockResolvedValue(oldRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      expect(result.streak).toBe(0);
    });

    it("works without authentication (public)", async () => {
      mockAuth.mockResolvedValue(null);
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.getSummary()).resolves.toBeDefined();
    });
  });
});
