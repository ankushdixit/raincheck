import type { Run, RunType } from "@prisma/client";
import {
  formatDateKey,
  isSameDay,
  isPastDate,
  hasExistingRun,
  isValidDropTarget,
  getInvalidDropMessage,
} from "../calendar-utils";

// Helper to create mock runs
const createMockRun = (overrides?: Partial<Run>): Run => ({
  id: `run-${Math.random().toString(36).substring(7)}`,
  date: new Date(),
  distance: 10,
  pace: "5:30",
  duration: "55:00",
  type: "EASY_RUN" as RunType,
  notes: null,
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("formatDateKey", () => {
  it("formats date as YYYY-MM-DD", () => {
    const date = new Date(2024, 5, 15); // June 15, 2024
    expect(formatDateKey(date)).toBe("2024-06-15");
  });

  it("pads single digit month with zero", () => {
    const date = new Date(2024, 0, 10); // January 10, 2024
    expect(formatDateKey(date)).toBe("2024-01-10");
  });

  it("pads single digit day with zero", () => {
    const date = new Date(2024, 11, 5); // December 5, 2024
    expect(formatDateKey(date)).toBe("2024-12-05");
  });

  it("handles December correctly (month 11)", () => {
    const date = new Date(2024, 11, 25);
    expect(formatDateKey(date)).toBe("2024-12-25");
  });
});

describe("isSameDay", () => {
  it("returns true for same date", () => {
    const date1 = new Date(2024, 5, 15, 10, 30);
    const date2 = new Date(2024, 5, 15, 22, 45);
    expect(isSameDay(date1, date2)).toBe(true);
  });

  it("returns false for different days", () => {
    const date1 = new Date(2024, 5, 15);
    const date2 = new Date(2024, 5, 16);
    expect(isSameDay(date1, date2)).toBe(false);
  });

  it("returns false for different months", () => {
    const date1 = new Date(2024, 5, 15);
    const date2 = new Date(2024, 6, 15);
    expect(isSameDay(date1, date2)).toBe(false);
  });

  it("returns false for different years", () => {
    const date1 = new Date(2024, 5, 15);
    const date2 = new Date(2025, 5, 15);
    expect(isSameDay(date1, date2)).toBe(false);
  });
});

describe("isPastDate", () => {
  it("returns false for today", () => {
    const today = new Date();
    expect(isPastDate(today)).toBe(false);
  });

  it("returns true for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isPastDate(yesterday)).toBe(true);
  });

  it("returns false for tomorrow", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isPastDate(tomorrow)).toBe(false);
  });

  it("returns true for date far in the past", () => {
    const pastDate = new Date(2020, 0, 1);
    expect(isPastDate(pastDate)).toBe(true);
  });

  it("returns false for date in the future", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(isPastDate(futureDate)).toBe(false);
  });

  it("ignores time component when comparing dates", () => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    expect(isPastDate(todayMidnight)).toBe(false);

    const todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 59, 999);
    expect(isPastDate(todayEndOfDay)).toBe(false);
  });
});

describe("hasExistingRun", () => {
  it("returns false for date with no runs", () => {
    const date = new Date();
    const runs: Run[] = [];
    expect(hasExistingRun(date, runs)).toBe(false);
  });

  it("returns true for date with existing run", () => {
    const date = new Date(2024, 5, 15);
    const runs = [createMockRun({ date: new Date(2024, 5, 15) })];
    expect(hasExistingRun(date, runs)).toBe(true);
  });

  it("returns false for date without matching run", () => {
    const date = new Date(2024, 5, 15);
    const runs = [
      createMockRun({ date: new Date(2024, 5, 14) }),
      createMockRun({ date: new Date(2024, 5, 16) }),
    ];
    expect(hasExistingRun(date, runs)).toBe(false);
  });

  it("excludes specified run from check", () => {
    const date = new Date(2024, 5, 15);
    const runOnDate = createMockRun({ id: "run-123", date: new Date(2024, 5, 15) });
    const runs = [runOnDate];

    // Without exclude, should return true
    expect(hasExistingRun(date, runs)).toBe(true);

    // With exclude for that run, should return false
    expect(hasExistingRun(date, runs, "run-123")).toBe(false);
  });

  it("only excludes the specific run, not others", () => {
    const date = new Date(2024, 5, 15);
    const run1 = createMockRun({ id: "run-1", date: new Date(2024, 5, 15) });
    const run2 = createMockRun({ id: "run-2", date: new Date(2024, 5, 15) });
    const runs = [run1, run2];

    // Excluding run-1 should still find run-2
    expect(hasExistingRun(date, runs, "run-1")).toBe(true);
  });
});

describe("isValidDropTarget", () => {
  it("returns false for past dates", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isValidDropTarget(yesterday, [])).toBe(false);
  });

  it("returns false for dates with existing runs", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const runs = [createMockRun({ date: tomorrow })];
    expect(isValidDropTarget(tomorrow, runs)).toBe(false);
  });

  it("returns true for today if no run exists", () => {
    const today = new Date();
    expect(isValidDropTarget(today, [])).toBe(true);
  });

  it("returns true for future empty dates", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    expect(isValidDropTarget(futureDate, [])).toBe(true);
  });

  it("returns true when dragging run to its own date (same cell)", () => {
    const today = new Date();
    const run = createMockRun({ id: "run-123", date: today });
    const runs = [run];

    // Dragging to its own cell should be valid (treated as no-op)
    expect(isValidDropTarget(today, runs, "run-123")).toBe(true);
  });

  it("returns false for today if it has another run", () => {
    const today = new Date();
    const existingRun = createMockRun({ id: "existing", date: today });
    const runs = [existingRun];

    expect(isValidDropTarget(today, runs, "different-run")).toBe(false);
  });

  it("returns false for future date with existing run from another source", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const existingRun = createMockRun({ id: "existing", date: futureDate });
    const runs = [existingRun];

    expect(isValidDropTarget(futureDate, runs, "dragged-run")).toBe(false);
  });
});

describe("getInvalidDropMessage", () => {
  it("returns null for valid drop target", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(getInvalidDropMessage(tomorrow, [])).toBeNull();
  });

  it("returns past date message for past dates", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getInvalidDropMessage(yesterday, [])).toBe("Cannot schedule runs in the past");
  });

  it("returns existing run message for occupied dates", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const runs = [createMockRun({ date: tomorrow })];

    expect(getInvalidDropMessage(tomorrow, runs)).toBe("A run is already scheduled for this day");
  });

  it("prioritizes past date message over existing run message", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const runs = [createMockRun({ date: yesterday })];

    // Even if there's a run, past date takes priority
    expect(getInvalidDropMessage(yesterday, runs)).toBe("Cannot schedule runs in the past");
  });

  it("returns null when excluding the run on the target date", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const run = createMockRun({ id: "run-123", date: tomorrow });
    const runs = [run];

    expect(getInvalidDropMessage(tomorrow, runs, "run-123")).toBeNull();
  });
});
