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
        findFirst: jest.fn(),
        aggregate: jest.fn(),
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
const mockRunFindFirst = db.run.findFirst as jest.Mock;
const mockRunAggregate = db.run.aggregate as jest.Mock;
const mockTrainingPlanFindMany = db.trainingPlan.findMany as jest.Mock;
const mockAuth = auth as jest.Mock;

describe("Stats Router", () => {
  const createCaller = createCallerFactory(statsRouter);

  // Training starts September 21, 2025 (fixed date in stats router)
  // Mock training plan data - aligned with Sep 21 start
  const mockTrainingPlans = [
    {
      id: "plan-1",
      phase: Phase.BASE_BUILDING,
      weekNumber: 1,
      weekStart: new Date("2025-09-21T00:00:00.000Z"),
      weekEnd: new Date("2025-09-27T23:59:59.999Z"),
      longRunTarget: 10,
      weeklyMileageTarget: 20,
    },
    {
      id: "plan-10",
      phase: Phase.BASE_BUILDING,
      weekNumber: 10,
      weekStart: new Date("2025-11-23T00:00:00.000Z"),
      weekEnd: new Date("2025-11-29T23:59:59.999Z"),
      longRunTarget: 12,
      weeklyMileageTarget: 24,
    },
    {
      id: "plan-11",
      phase: Phase.BASE_BUILDING,
      weekNumber: 11,
      weekStart: new Date("2025-11-30T00:00:00.000Z"),
      weekEnd: new Date("2025-12-06T23:59:59.999Z"),
      longRunTarget: 13,
      weeklyMileageTarget: 26,
    },
  ];

  // Mock run data - aligned with Sep 21 start (Week 10 = Nov 23, Week 11 = Nov 30)
  const mockCompletedRuns = [
    {
      id: "run-1",
      date: new Date("2025-11-23T08:00:00.000Z"), // Week 10
      distance: 11.48,
      pace: "6:45",
      duration: "77:32",
      type: RunType.LONG_RUN,
      completed: true,
    },
    {
      id: "run-2",
      date: new Date("2025-11-26T08:00:00.000Z"), // Week 10
      distance: 6.15,
      pace: "6:39",
      duration: "40:53",
      type: RunType.EASY_RUN,
      completed: true,
    },
    {
      id: "run-3",
      date: new Date("2025-11-30T08:00:00.000Z"), // Week 11
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
      // Mock Promise.all: training plans and runs (with only selected fields)
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check structure of Week 10 (Nov 23-29, containing runs 1 and 2)
      const week10 = result.find((w) => w.week === "Week 10");
      expect(week10).toBeDefined();
      expect(week10?.mileage).toBeCloseTo(17.63, 1); // 11.48 + 6.15
      // Target is now calculated: 10 + (10-1) * 1.5 = 23.5
      expect(week10?.target).toBeCloseTo(23.5, 1);
    });

    it("returns mileage data with calculated targets (no db dependency)", async () => {
      // Mock Promise.all: no training plans, runs with selected fields
      mockTrainingPlanFindMany.mockResolvedValue([]);
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage();

      // Should still return mileage data with calculated targets
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // Targets are calculated based on week number, not from DB
      const week10 = result.find((w) => w.week === "Week 10");
      expect(week10?.target).toBeCloseTo(23.5, 1); // 10 + (10-1) * 1.5
    });

    it("returns empty array when no runs exist", async () => {
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage();

      expect(result).toEqual([]);
    });

    it("respects weeks parameter", async () => {
      // Mock Promise.all: training plans and runs with selected fields
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage({ weeks: 4 });

      expect(result.length).toBeLessThanOrEqual(4);
    });

    it("marks current week correctly", async () => {
      // Mock Promise.all: training plans and runs with selected fields
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getWeeklyMileage();

      // Current week (Dec 1) should be week 11 (Sep 21 start + 10 weeks)
      const currentWeek = result.find((w) => w.isCurrentWeek);
      expect(currentWeek?.week).toBe("Week 11");
    });

    it("includes pre-training weeks with 'Pre' label", async () => {
      // Mock Promise.all: training plans and pre-training runs
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      // Add runs from before training plan start (Sep 21)
      const preTrainingRuns = [
        {
          date: new Date("2025-09-14T08:00:00.000Z"), // 1 week before training (Sep 14-20)
          distance: 7,
        },
        {
          date: new Date("2025-09-07T08:00:00.000Z"), // 2 weeks before training (Sep 7-13)
          distance: 10.82,
        },
        ...mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance })),
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

      // Pre 1 should be the week before Week 1 (Sep 14-20)
      const pre1 = result.find((w) => w.week === "Pre 1");
      expect(pre1).toBeDefined();
      expect(pre1?.mileage).toBeCloseTo(7, 1);
    });

    it("works without authentication (public)", async () => {
      mockAuth.mockResolvedValue(null);
      // Mock Promise.all: training plans and runs with selected fields
      mockTrainingPlanFindMany.mockResolvedValue(mockTrainingPlans);
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.getWeeklyMileage()).resolves.toBeDefined();
    });
  });

  describe("getPaceProgression", () => {
    it("returns weekly average pace data for all weeks", async () => {
      // Mock runs with only selected fields
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance, pace: r.pace }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getPaceProgression();

      // Current week (Dec 1) is week 11, so should return 11 weeks
      expect(result).toHaveLength(11);
      expect(result[0]).toHaveProperty("week");
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("pace");
      expect(result[0]).toHaveProperty("paceSeconds");
    });

    it("calculates weighted average pace for each week", async () => {
      // Mock runs with only selected fields
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance, pace: r.pace }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getPaceProgression();

      // Week 10 has runs with different paces - should be weighted average
      const week10 = result.find((r) => r.week === 10);
      expect(week10?.paceSeconds).not.toBeNull();
      expect(week10?.pace).not.toBeNull();
    });

    it("shows null pace for weeks without runs", async () => {
      // Mock runs with only selected fields
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance, pace: r.pace }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getPaceProgression();

      // Week 5 has no runs
      const week5 = result.find((r) => r.week === 5);
      expect(week5?.paceSeconds).toBeNull();
      expect(week5?.pace).toBeNull();
    });

    it("filters by run type when specified", async () => {
      const longRuns = mockCompletedRuns.filter((r) => r.type === RunType.LONG_RUN);
      mockRunFindMany.mockResolvedValue(
        longRuns.map((r) => ({ date: r.date, distance: r.distance, pace: r.pace }))
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

    it("returns all weeks with null paces when no runs exist", async () => {
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getPaceProgression();

      // Should still return 11 weeks, all with null pace
      expect(result).toHaveLength(11);
      result.forEach((week) => {
        expect(week.paceSeconds).toBeNull();
      });
    });

    it("works without authentication (public)", async () => {
      mockAuth.mockResolvedValue(null);
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getPaceProgression();

      // Returns weeks with null paces
      expect(result).toHaveLength(11);
    });
  });

  describe("getLongRunProgression", () => {
    const longRuns = mockCompletedRuns.filter((r) => r.type === RunType.LONG_RUN);

    it("returns all weeks from week 1 to current week with distances", async () => {
      // Mock runs with only selected fields
      mockRunFindMany.mockResolvedValue(
        longRuns.map((r) => ({ date: r.date, distance: r.distance }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getLongRunProgression();

      // Current week (Dec 1) is week 11, so should return 11 weeks
      expect(result).toHaveLength(11);
      expect(result[0]).toHaveProperty("week");
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("distance");
      expect(result[0]).toHaveProperty("target");
    });

    it("shows 0 distance for weeks without long runs", async () => {
      // Mock runs with only selected fields
      mockRunFindMany.mockResolvedValue(
        longRuns.map((r) => ({ date: r.date, distance: r.distance }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getLongRunProgression();

      // Weeks 1-9 have no long runs, should be 0
      const week5 = result.find((r) => r.week === 5);
      expect(week5?.distance).toBe(0);

      // Week 10 (Nov 23) has a long run of 11.48km
      const week10 = result.find((r) => r.week === 10);
      expect(week10?.distance).toBe(11.48);
    });

    it("calculates target based on week number", async () => {
      // Mock runs with only selected fields
      mockRunFindMany.mockResolvedValue(
        longRuns.map((r) => ({ date: r.date, distance: r.distance }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getLongRunProgression();

      // Target = 7 + (21.1 - 7) / 30 * weekNum
      // Week 10 target = 7 + 14.1/30 * 10 ≈ 11.7
      const week10 = result.find((r) => r.week === 10);
      expect(week10?.target).toBeCloseTo(11.7, 0);
    });

    it("returns all weeks even when no long runs exist", async () => {
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getLongRunProgression();

      // Should still return 11 weeks with 0 distance
      expect(result).toHaveLength(11);
      result.forEach((week) => {
        expect(week.distance).toBe(0);
      });
    });

    it("only queries LONG_RUN type from database", async () => {
      mockRunFindMany.mockResolvedValue(longRuns);

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
      // Mock Promise.all: runs and training plans with selected fields
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, completed: r.completed }))
      );
      mockTrainingPlanFindMany.mockResolvedValue(
        mockTrainingPlans.map((p) => ({ phase: p.phase, weekNumber: p.weekNumber }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getCompletionRate();

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("completed");
      expect(result).toHaveProperty("rate");
      expect(result).toHaveProperty("byPhase");
    });

    it("calculates correct completion rate", async () => {
      const mixedRuns = [
        { date: mockCompletedRuns[0].date, completed: true },
        { date: mockCompletedRuns[1].date, completed: true },
        { date: mockCompletedRuns[2].date, completed: false },
      ];
      // Mock Promise.all: runs and training plans with selected fields
      mockRunFindMany.mockResolvedValue(mixedRuns);
      mockTrainingPlanFindMany.mockResolvedValue(
        mockTrainingPlans.map((p) => ({ phase: p.phase, weekNumber: p.weekNumber }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getCompletionRate();

      expect(result.total).toBe(3);
      expect(result.completed).toBe(2);
      expect(result.rate).toBe(67); // 2/3 ≈ 67%
    });

    it("returns 0% rate when no runs completed", async () => {
      const noCompletedRuns = mockCompletedRuns.map((r) => ({ date: r.date, completed: false }));
      // Mock Promise.all: runs and training plans with selected fields
      mockRunFindMany.mockResolvedValue(noCompletedRuns);
      mockTrainingPlanFindMany.mockResolvedValue(
        mockTrainingPlans.map((p) => ({ phase: p.phase, weekNumber: p.weekNumber }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getCompletionRate();

      expect(result.rate).toBe(0);
    });

    it("returns 0% rate when no runs exist", async () => {
      // Mock Promise.all: empty runs, training plans with selected fields
      mockRunFindMany.mockResolvedValue([]);
      mockTrainingPlanFindMany.mockResolvedValue(
        mockTrainingPlans.map((p) => ({ phase: p.phase, weekNumber: p.weekNumber }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getCompletionRate();

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.rate).toBe(0);
    });

    it("includes breakdown by phase", async () => {
      // Mock Promise.all: runs and training plans with selected fields
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, completed: r.completed }))
      );
      mockTrainingPlanFindMany.mockResolvedValue(
        mockTrainingPlans.map((p) => ({ phase: p.phase, weekNumber: p.weekNumber }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getCompletionRate();

      expect(result.byPhase).toHaveLength(4);
      expect(result.byPhase[0]).toHaveProperty("phase");
      expect(result.byPhase[0]).toHaveProperty("total");
      expect(result.byPhase[0]).toHaveProperty("completed");
      expect(result.byPhase[0]).toHaveProperty("rate");
    });

    it("filters by phase when specified", async () => {
      // Mock Promise.all: runs and training plans with selected fields
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, completed: r.completed }))
      );
      mockTrainingPlanFindMany.mockResolvedValue(
        mockTrainingPlans.map((p) => ({ phase: p.phase, weekNumber: p.weekNumber }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const filteredResult = await caller.getCompletionRate({ phase: Phase.BASE_BUILDING });

      // Only runs from BASE_BUILDING phase weeks should be counted
      expect(filteredResult.total).toBeLessThanOrEqual(mockCompletedRuns.length);
    });
  });

  describe("getSummary", () => {
    it("returns summary statistics", async () => {
      // Mock Promise.all: aggregate, findFirst, findMany
      mockRunAggregate.mockResolvedValue({
        _count: { id: 3 },
        _sum: { distance: 29.63 },
      });
      mockRunFindFirst.mockResolvedValue({ distance: 12 });
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance, pace: r.pace }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      expect(result).toHaveProperty("totalRuns");
      expect(result).toHaveProperty("totalDistance");
      expect(result).toHaveProperty("avgPace");
      expect(result).toHaveProperty("streak");
      expect(result).toHaveProperty("longestRun");
    });

    it("calculates correct total runs", async () => {
      // Mock Promise.all: aggregate returns count
      mockRunAggregate.mockResolvedValue({
        _count: { id: 3 },
        _sum: { distance: 29.63 },
      });
      mockRunFindFirst.mockResolvedValue({ distance: 12 });
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance, pace: r.pace }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      expect(result.totalRuns).toBe(3);
    });

    it("calculates correct total distance", async () => {
      // Mock Promise.all: aggregate returns sum
      mockRunAggregate.mockResolvedValue({
        _count: { id: 3 },
        _sum: { distance: 29.63 },
      });
      mockRunFindFirst.mockResolvedValue({ distance: 12 });
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance, pace: r.pace }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      // 11.48 + 6.15 + 12 = 29.63
      expect(result.totalDistance).toBeCloseTo(29.63, 1);
    });

    it("calculates weighted average pace", async () => {
      // Mock Promise.all: aggregate, findFirst, findMany
      mockRunAggregate.mockResolvedValue({
        _count: { id: 3 },
        _sum: { distance: 29.63 },
      });
      mockRunFindFirst.mockResolvedValue({ distance: 12 });
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance, pace: r.pace }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      // Average pace should be a valid pace string
      expect(result.avgPace).toMatch(/^\d{1,2}:\d{2}$/);
    });

    it("finds longest run distance", async () => {
      // Mock Promise.all: aggregate, findFirst returns longest
      mockRunAggregate.mockResolvedValue({
        _count: { id: 3 },
        _sum: { distance: 29.63 },
      });
      mockRunFindFirst.mockResolvedValue({ distance: 12 });
      mockRunFindMany.mockResolvedValue(
        mockCompletedRuns.map((r) => ({ date: r.date, distance: r.distance, pace: r.pace }))
      );

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      expect(result.longestRun).toBe(12);
    });

    it("returns zeros and empty string when no runs exist", async () => {
      // Mock Promise.all: all empty/null
      mockRunAggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { distance: null },
      });
      mockRunFindFirst.mockResolvedValue(null);
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      expect(result.totalRuns).toBe(0);
      expect(result.totalDistance).toBe(0);
      expect(result.avgPace).toBe("");
      expect(result.streak).toBe(0);
      expect(result.longestRun).toBe(0);
    });

    it("calculates streak as consecutive weeks with >10km", async () => {
      // Create runs across multiple weeks, each week with >10km
      // Training starts Sep 21, 2025
      // Week 11: Nov 30 - Dec 6 (current week based on mock date Dec 1)
      // Week 10: Nov 23-29
      // Week 9: Nov 16-22
      const weeklyRuns = [
        {
          date: new Date("2025-12-01T08:00:00.000Z"), // Week 11
          distance: 15, // >10km
          pace: "6:30",
        },
        {
          date: new Date("2025-11-25T08:00:00.000Z"), // Week 10
          distance: 12, // >10km
          pace: "6:40",
        },
        {
          date: new Date("2025-11-18T08:00:00.000Z"), // Week 9
          distance: 11, // >10km
          pace: "6:45",
        },
      ];

      // Mock Promise.all
      mockRunAggregate.mockResolvedValue({
        _count: { id: 3 },
        _sum: { distance: 38 },
      });
      mockRunFindFirst.mockResolvedValue({ distance: 15 });
      mockRunFindMany.mockResolvedValue(weeklyRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      // Should be 3 consecutive weeks with >10km each
      expect(result.streak).toBe(3);
    });

    it("returns 0 streak when current week has insufficient mileage", async () => {
      // Current week (week 11) has runs but less than 10km total
      const lowMileageRuns = [
        {
          date: new Date("2025-12-01T08:00:00.000Z"), // Week 11
          distance: 5, // Only 5km - below 10km threshold
          pace: "6:30",
        },
      ];

      // Mock Promise.all
      mockRunAggregate.mockResolvedValue({
        _count: { id: 1 },
        _sum: { distance: 5 },
      });
      mockRunFindFirst.mockResolvedValue({ distance: 5 });
      mockRunFindMany.mockResolvedValue(lowMileageRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      // Week 11 has <10km so streak is 0
      expect(result.streak).toBe(0);
    });

    it("breaks streak when a week has insufficient mileage", async () => {
      // Week 11: 15km (counts)
      // Week 10: 5km (breaks streak - below 10km)
      // Week 9: 20km (doesn't count - streak already broken)
      const mixedRuns = [
        {
          date: new Date("2025-12-01T08:00:00.000Z"), // Week 11
          distance: 15,
          pace: "6:30",
        },
        {
          date: new Date("2025-11-25T08:00:00.000Z"), // Week 10
          distance: 5, // Below threshold
          pace: "6:35",
        },
        {
          date: new Date("2025-11-18T08:00:00.000Z"), // Week 9
          distance: 20,
          pace: "6:40",
        },
      ];

      // Mock Promise.all
      mockRunAggregate.mockResolvedValue({
        _count: { id: 3 },
        _sum: { distance: 40 },
      });
      mockRunFindFirst.mockResolvedValue({ distance: 20 });
      mockRunFindMany.mockResolvedValue(mixedRuns);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));
      const result = await caller.getSummary();

      // Only week 11 counts, week 10 breaks the streak
      expect(result.streak).toBe(1);
    });

    it("works without authentication (public)", async () => {
      mockAuth.mockResolvedValue(null);
      // Mock Promise.all: all empty/null
      mockRunAggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { distance: null },
      });
      mockRunFindFirst.mockResolvedValue(null);
      mockRunFindMany.mockResolvedValue([]);

      const caller = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(caller.getSummary()).resolves.toBeDefined();
    });
  });
});
