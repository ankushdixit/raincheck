import { render, screen } from "@testing-library/react";
import {
  TrainingProgress,
  parseTimeToMinutes,
  formatPace,
  calculateTargetPace,
  calculateDistanceProgress,
  calculatePaceProgress,
} from "../TrainingProgress";

// Mock the tRPC api
const mockProgressStatsQuery = jest.fn();
const mockSettingsQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    runs: {
      getProgressStats: {
        useQuery: () => mockProgressStatsQuery(),
      },
    },
    settings: {
      get: {
        useQuery: () => mockSettingsQuery(),
      },
    },
  },
}));

// Sample data
const mockProgressStats = {
  longestRunDistance: 16.5,
  bestLongRunPace: "6:30",
};

const mockSettings = {
  targetTime: "2:00:00",
  raceName: "Half Marathon",
  raceDate: new Date("2026-05-17"),
};

describe("parseTimeToMinutes", () => {
  it("parses H:MM:SS format correctly", () => {
    expect(parseTimeToMinutes("2:00:00")).toBe(120);
    expect(parseTimeToMinutes("1:30:00")).toBe(90);
    expect(parseTimeToMinutes("2:15:30")).toBeCloseTo(135.5, 1);
  });

  it("parses M:SS pace format correctly", () => {
    expect(parseTimeToMinutes("6:30")).toBeCloseTo(6.5, 1);
    expect(parseTimeToMinutes("5:00")).toBe(5);
    expect(parseTimeToMinutes("7:45")).toBeCloseTo(7.75, 1);
  });

  it("returns 0 for invalid format", () => {
    expect(parseTimeToMinutes("invalid")).toBe(0);
    expect(parseTimeToMinutes("")).toBe(0);
  });
});

describe("formatPace", () => {
  it("formats pace correctly", () => {
    expect(formatPace(6.5)).toBe("6:30");
    expect(formatPace(5)).toBe("5:00");
    expect(formatPace(7.75)).toBe("7:45");
  });

  it("handles edge cases", () => {
    expect(formatPace(0)).toBe("0:00");
    expect(formatPace(10)).toBe("10:00");
  });
});

describe("calculateTargetPace", () => {
  it("calculates target pace for 2 hour half marathon", () => {
    // 120 minutes / 21.1 km = 5.687 min/km = 5:41
    const pace = calculateTargetPace("2:00:00");
    expect(pace).toBe("5:41");
  });

  it("calculates target pace for 1:45 half marathon", () => {
    // 105 minutes / 21.1 km = 4.976 min/km = 4:59
    const pace = calculateTargetPace("1:45:00");
    expect(pace).toBe("4:59");
  });

  it("calculates target pace for 2:30 half marathon", () => {
    // 150 minutes / 21.1 km = 7.109 min/km = 7:07
    const pace = calculateTargetPace("2:30:00");
    expect(pace).toBe("7:07");
  });
});

describe("calculateDistanceProgress", () => {
  it("calculates correct progress for various distances", () => {
    expect(calculateDistanceProgress(0)).toBe(0);
    expect(calculateDistanceProgress(10.55)).toBeCloseTo(50, 0); // 50% of 21.1
    expect(calculateDistanceProgress(15.825)).toBeCloseTo(75, 0); // 75% of 21.1
  });

  it("returns 100 when distance equals or exceeds target", () => {
    expect(calculateDistanceProgress(21.1)).toBe(100);
    expect(calculateDistanceProgress(25)).toBe(100);
  });

  it("returns 0 for negative or zero distance", () => {
    expect(calculateDistanceProgress(0)).toBe(0);
    expect(calculateDistanceProgress(-5)).toBe(0);
  });
});

describe("calculatePaceProgress", () => {
  it("returns 100 when pace is at or faster than target", () => {
    expect(calculatePaceProgress("5:30", "5:41")).toBe(100);
    expect(calculatePaceProgress("5:41", "5:41")).toBe(100);
  });

  it("calculates progress between max pace and target", () => {
    // With 10:00 max and 5:41 target (4.317 range)
    // 7:50 = 7.833 min, improvement from 10 = 2.167, progress = 50.2%
    const progress = calculatePaceProgress("7:50", "5:41");
    expect(progress).toBeGreaterThan(40);
    expect(progress).toBeLessThan(60);
  });

  it("returns 0 for invalid paces", () => {
    expect(calculatePaceProgress("", "5:41")).toBe(0);
    expect(calculatePaceProgress("6:30", "")).toBe(0);
  });
});

describe("TrainingProgress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loading state", () => {
    it("displays loading skeleton while fetching stats", () => {
      mockProgressStatsQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });
      mockSettingsQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });

      render(<TrainingProgress />);

      expect(screen.getByTestId("progress-skeleton")).toBeInTheDocument();
    });

    it("displays loading skeleton while fetching settings", () => {
      mockProgressStatsQuery.mockReturnValue({
        data: mockProgressStats,
        isLoading: false,
      });
      mockSettingsQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<TrainingProgress />);

      expect(screen.getByTestId("progress-skeleton")).toBeInTheDocument();
    });

    it("skeleton has animate-pulse class", () => {
      mockProgressStatsQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });
      mockSettingsQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<TrainingProgress />);

      const skeleton = screen.getByTestId("progress-skeleton");
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  describe("success state with data", () => {
    beforeEach(() => {
      mockProgressStatsQuery.mockReturnValue({
        data: mockProgressStats,
        isLoading: false,
      });
      mockSettingsQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });
    });

    it("displays training progress container", () => {
      render(<TrainingProgress />);

      expect(screen.getByTestId("training-progress")).toBeInTheDocument();
    });

    it("displays distance progress section", () => {
      render(<TrainingProgress />);

      expect(screen.getByTestId("distance-progress")).toBeInTheDocument();
      expect(screen.getByTestId("distance-label")).toHaveTextContent("Longest Run");
      expect(screen.getByTestId("distance-value")).toHaveTextContent("16.5 km / 21.1 km");
    });

    it("displays pace progress section", () => {
      render(<TrainingProgress />);

      expect(screen.getByTestId("pace-progress")).toBeInTheDocument();
      expect(screen.getByTestId("pace-label")).toHaveTextContent("Best Long Run Pace");
      expect(screen.getByTestId("pace-value")).toHaveTextContent("6:30 → 5:41/km");
    });

    it("has accessible progressbar roles", () => {
      render(<TrainingProgress />);

      const progressbars = screen.getAllByRole("progressbar");
      expect(progressbars).toHaveLength(2);

      progressbars.forEach((bar) => {
        expect(bar).toHaveAttribute("aria-valuenow");
        expect(bar).toHaveAttribute("aria-valuemin", "0");
        expect(bar).toHaveAttribute("aria-valuemax", "100");
      });
    });

    it("distance progress bar shows correct fill", () => {
      render(<TrainingProgress />);

      const fill = screen.getByTestId("distance-fill");
      // 16.5 / 21.1 = 78.2%
      const style = fill.getAttribute("style");
      expect(style).toMatch(/width:\s*78\.\d+%/);
    });
  });

  describe("no runs state", () => {
    beforeEach(() => {
      mockProgressStatsQuery.mockReturnValue({
        data: {
          longestRunDistance: null,
          bestLongRunPace: null,
        },
        isLoading: false,
      });
      mockSettingsQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });
    });

    it("displays 'No runs yet' for distance", () => {
      render(<TrainingProgress />);

      expect(screen.getByTestId("distance-value")).toHaveTextContent("No runs yet / 21.1 km");
    });

    it("displays 'No long runs' for pace", () => {
      render(<TrainingProgress />);

      expect(screen.getByTestId("pace-value")).toHaveTextContent("No long runs → 5:41/km");
    });

    it("shows empty progress bars", () => {
      render(<TrainingProgress />);

      const distanceFill = screen.getByTestId("distance-fill");
      const paceFill = screen.getByTestId("pace-fill");

      expect(distanceFill).toHaveStyle({ width: "0%" });
      expect(paceFill).toHaveStyle({ width: "0%" });
    });
  });

  describe("edge cases", () => {
    it("uses default target time when settings unavailable", () => {
      mockProgressStatsQuery.mockReturnValue({
        data: mockProgressStats,
        isLoading: false,
      });
      mockSettingsQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });

      render(<TrainingProgress />);

      // Default is 2:00:00 which gives 5:41/km
      expect(screen.getByTestId("pace-value")).toHaveTextContent("5:41/km");
    });

    it("handles completed half marathon distance", () => {
      mockProgressStatsQuery.mockReturnValue({
        data: {
          longestRunDistance: 21.1,
          bestLongRunPace: "5:30",
        },
        isLoading: false,
      });
      mockSettingsQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });

      render(<TrainingProgress />);

      const fill = screen.getByTestId("distance-fill");
      expect(fill).toHaveStyle({ width: "100%" });
    });

    it("handles pace faster than target", () => {
      mockProgressStatsQuery.mockReturnValue({
        data: {
          longestRunDistance: 18,
          bestLongRunPace: "5:30", // Faster than 5:41 target
        },
        isLoading: false,
      });
      mockSettingsQuery.mockReturnValue({
        data: mockSettings,
        isLoading: false,
      });

      render(<TrainingProgress />);

      const fill = screen.getByTestId("pace-fill");
      expect(fill).toHaveStyle({ width: "100%" });
    });
  });
});
