import { render, screen, fireEvent } from "@testing-library/react";
import {
  RaceCountdown,
  calculateDaysUntil,
  formatRaceDate,
  isRaceWeek,
  shouldShowRaceWeather,
  getTaperReminder,
} from "../RaceCountdown";

// Mock the tRPC api
const mockRefetch = jest.fn();
const mockUseQuery = jest.fn();
const mockProgressStatsQuery = jest.fn();
const mockGetCurrentPhaseQuery = jest.fn();
const mockWeatherForecastQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    settings: {
      get: {
        useQuery: () => mockUseQuery(),
      },
    },
    runs: {
      getProgressStats: {
        useQuery: () => mockProgressStatsQuery(),
      },
    },
    planning: {
      getCurrentPhase: {
        useQuery: () => mockGetCurrentPhaseQuery(),
      },
    },
    weather: {
      getForecast: {
        useQuery: (input: unknown, options: { enabled: boolean }) => {
          if (!options.enabled) {
            return { data: undefined, isLoading: false };
          }
          return mockWeatherForecastQuery();
        },
      },
    },
  },
}));

// Sample settings data matching UserSettings model
const mockSettingsData = {
  defaultLocation: "Balbriggan, IE",
  raceDate: new Date("2026-05-17T10:00:00Z"),
  raceName: "Life Style Sports Fastlane Summer Edition 2026",
  targetTime: "2:00:00",
};

describe("calculateDaysUntil", () => {
  it("calculates days correctly for future date", () => {
    const targetDate = new Date("2026-05-17");
    const fromDate = new Date("2025-11-30");

    const days = calculateDaysUntil(targetDate, fromDate);

    expect(days).toBe(168); // 168 days from Nov 30, 2025 to May 17, 2026
  });

  it("returns 0 on race day", () => {
    const targetDate = new Date("2026-05-17");
    const fromDate = new Date("2026-05-17");

    const days = calculateDaysUntil(targetDate, fromDate);

    expect(days).toBe(0);
  });

  it("returns negative for past dates", () => {
    const targetDate = new Date("2025-05-17");
    const fromDate = new Date("2025-05-20");

    const days = calculateDaysUntil(targetDate, fromDate);

    expect(days).toBe(-3);
  });

  it("returns 1 for tomorrow", () => {
    const targetDate = new Date("2026-05-18");
    const fromDate = new Date("2026-05-17");

    const days = calculateDaysUntil(targetDate, fromDate);

    expect(days).toBe(1);
  });

  it("normalizes time components to avoid edge cases", () => {
    // Same day but different times should return 0 when using local dates
    const targetDate = new Date(2026, 4, 17, 23, 59, 59); // May 17, 2026 11:59:59 PM local
    const fromDate = new Date(2026, 4, 17, 0, 0, 1); // May 17, 2026 00:00:01 AM local

    const days = calculateDaysUntil(targetDate, fromDate);

    expect(days).toBe(0);
  });

  it("handles date arithmetic correctly across months", () => {
    // End of one month to start of next should calculate correctly
    const targetDate = new Date(2026, 5, 1); // June 1, 2026
    const fromDate = new Date(2026, 4, 31); // May 31, 2026

    const days = calculateDaysUntil(targetDate, fromDate);

    expect(days).toBe(1);
  });
});

describe("formatRaceDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2026-05-17");

    const formatted = formatRaceDate(date);

    expect(formatted).toBe("May 17, 2026");
  });

  it("formats different months correctly", () => {
    const date = new Date("2025-12-25");

    const formatted = formatRaceDate(date);

    expect(formatted).toBe("December 25, 2025");
  });
});

describe("isRaceWeek", () => {
  it("returns true for 0 days (race day)", () => {
    expect(isRaceWeek(0)).toBe(true);
  });

  it("returns true for 1 day", () => {
    expect(isRaceWeek(1)).toBe(true);
  });

  it("returns true for 7 days", () => {
    expect(isRaceWeek(7)).toBe(true);
  });

  it("returns false for 8 days", () => {
    expect(isRaceWeek(8)).toBe(false);
  });

  it("returns false for negative days (past race)", () => {
    expect(isRaceWeek(-1)).toBe(false);
  });
});

describe("shouldShowRaceWeather", () => {
  it("returns true for 0 days (race day)", () => {
    expect(shouldShowRaceWeather(0)).toBe(true);
  });

  it("returns true for 10 days", () => {
    expect(shouldShowRaceWeather(10)).toBe(true);
  });

  it("returns false for 11 days", () => {
    expect(shouldShowRaceWeather(11)).toBe(false);
  });

  it("returns false for negative days (past race)", () => {
    expect(shouldShowRaceWeather(-1)).toBe(false);
  });
});

describe("getTaperReminder", () => {
  it("returns race day message for 0 days", () => {
    expect(getTaperReminder(0)).toBe("Race day! Trust your training!");
  });

  it("returns tomorrow message for 1 day", () => {
    expect(getTaperReminder(1)).toBe("Rest up! Tomorrow is the big day!");
  });

  it("returns light runs message for 2-3 days", () => {
    expect(getTaperReminder(2)).toBe("Light runs only. Stay fresh!");
    expect(getTaperReminder(3)).toBe("Light runs only. Stay fresh!");
  });

  it("returns taper message for 4-7 days", () => {
    expect(getTaperReminder(4)).toBe("Taper time! Rest and recover.");
    expect(getTaperReminder(7)).toBe("Taper time! Rest and recover.");
  });

  it("returns null for more than 7 days", () => {
    expect(getTaperReminder(8)).toBeNull();
    expect(getTaperReminder(30)).toBeNull();
  });

  it("returns null for negative days (past race)", () => {
    expect(getTaperReminder(-1)).toBeNull();
  });
});

describe("RaceCountdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue({ data: mockSettingsData });
    // Default mock for TrainingProgress component's API call
    mockProgressStatsQuery.mockReturnValue({
      data: {
        longestRunDistance: 16.5,
        bestLongRunPace: "6:30",
      },
      isLoading: false,
    });
    // Default mock for PhaseBadge component's API call
    mockGetCurrentPhaseQuery.mockReturnValue({
      data: { phase: "BASE_BUILDING", weekNumber: 3 },
      isLoading: false,
    });
    // Default mock for weather forecast (disabled by default since race is far away)
    mockWeatherForecastQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
  });

  describe("loading state", () => {
    it("displays loading skeleton while fetching", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<RaceCountdown />);

      expect(screen.getByTestId("countdown-skeleton")).toBeInTheDocument();
    });

    it("skeleton has animate-pulse class for animation", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<RaceCountdown />);

      const skeleton = screen.getByTestId("countdown-skeleton");
      const animatedElement = skeleton.querySelector(".animate-pulse");
      expect(animatedElement).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    beforeEach(() => {
      // Mock a future date to get consistent test results
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2025-11-30T12:00:00Z"));

      mockUseQuery.mockReturnValue({
        data: mockSettingsData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("displays countdown card when data loads", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("countdown-card")).toBeInTheDocument();
    });

    it("displays the countdown number", () => {
      render(<RaceCountdown />);

      const daysElement = screen.getByTestId("countdown-days");
      expect(daysElement).toBeInTheDocument();
      // 168 days from Nov 30, 2025 to May 17, 2026
      expect(daysElement).toHaveTextContent("168");
    });

    it("displays 'days until race day' label", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("countdown-label")).toHaveTextContent("days until race day");
    });

    it("displays the race name", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("race-name")).toHaveTextContent(
        "Life Style Sports Fastlane Summer Edition 2026"
      );
    });

    it("displays the formatted race date", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("race-date")).toHaveTextContent("May 17, 2026");
    });

    it("displays the target time", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("target-time")).toHaveTextContent("Target: 2:00:00");
    });
  });

  describe("race day state", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-05-17T08:00:00Z")); // Race day

      mockUseQuery.mockReturnValue({
        data: mockSettingsData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("displays 'Race Day!' message on race day", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("countdown-label")).toHaveTextContent("Race Day!");
    });

    it("displays runner emoji instead of number on race day", () => {
      render(<RaceCountdown />);

      const daysElement = screen.getByTestId("countdown-days");
      expect(daysElement).toHaveTextContent("🏃");
    });
  });

  describe("1 day until race", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-05-16T12:00:00Z")); // 1 day before race

      mockUseQuery.mockReturnValue({
        data: mockSettingsData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("displays singular 'day' for 1 day", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("countdown-label")).toHaveTextContent("day until race day");
    });

    it("displays 1 as the countdown number", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("countdown-days")).toHaveTextContent("1");
    });
  });

  describe("past race date", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-05-20T12:00:00Z")); // 3 days after race

      mockUseQuery.mockReturnValue({
        data: mockSettingsData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("displays 'days since race day' for past dates", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("countdown-label")).toHaveTextContent("days since race day");
    });

    it("displays absolute value of days", () => {
      render(<RaceCountdown />);

      // Should show 3, not -3
      expect(screen.getByTestId("countdown-days")).toHaveTextContent("3");
    });
  });

  describe("error state", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    it("displays error message when API fails", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("countdown-error")).toBeInTheDocument();
      expect(screen.getByText("Unable to load race info")).toBeInTheDocument();
    });

    it("displays retry button on error", () => {
      render(<RaceCountdown />);

      expect(screen.getByTestId("retry-button")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    it("retry button triggers refetch when clicked", async () => {
      render(<RaceCountdown />);

      const retryButton = screen.getByTestId("retry-button");
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it("shows loading state on retry button while retrying", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
        isFetching: true, // Refetching
      });

      render(<RaceCountdown />);

      const retryButton = screen.getByTestId("retry-button");
      expect(retryButton).toHaveTextContent("Retrying...");
      expect(retryButton).toBeDisabled();
    });
  });

  describe("edge cases", () => {
    it("shows error state when data is null", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<RaceCountdown />);

      expect(screen.getByTestId("countdown-error")).toBeInTheDocument();
    });

    it("does not display target time if not provided", () => {
      mockUseQuery.mockReturnValue({
        data: {
          ...mockSettingsData,
          targetTime: null,
        },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<RaceCountdown />);

      expect(screen.queryByTestId("target-time")).not.toBeInTheDocument();
    });
  });

  describe("race week features", () => {
    describe("race week banner", () => {
      it("displays race week banner when race is 7 days away", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-10T12:00:00Z")); // 7 days before race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.getByTestId("race-week-banner")).toBeInTheDocument();
        expect(screen.getByText("RACE WEEK!")).toBeInTheDocument();

        jest.useRealTimers();
      });

      it("displays race week banner when race is 1 day away", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-16T12:00:00Z")); // 1 day before race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.getByTestId("race-week-banner")).toBeInTheDocument();

        jest.useRealTimers();
      });

      it("displays race week banner on race day", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-17T08:00:00Z")); // Race day

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.getByTestId("race-week-banner")).toBeInTheDocument();

        jest.useRealTimers();
      });

      it("does not display race week banner when race is 8 days away", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-09T12:00:00Z")); // 8 days before race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.queryByTestId("race-week-banner")).not.toBeInTheDocument();

        jest.useRealTimers();
      });

      it("does not display race week banner after race has passed", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-20T12:00:00Z")); // 3 days after race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.queryByTestId("race-week-banner")).not.toBeInTheDocument();

        jest.useRealTimers();
      });
    });

    describe("taper reminders", () => {
      it("displays taper reminder during race week", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-12T12:00:00Z")); // 5 days before race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.getByTestId("taper-reminder")).toBeInTheDocument();
        expect(screen.getByText("Taper time! Rest and recover.")).toBeInTheDocument();

        jest.useRealTimers();
      });

      it("displays light runs reminder 3 days before race", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-14T12:00:00Z")); // 3 days before race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.getByTestId("taper-reminder")).toBeInTheDocument();
        expect(screen.getByText("Light runs only. Stay fresh!")).toBeInTheDocument();

        jest.useRealTimers();
      });

      it("displays tomorrow reminder 1 day before race", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-16T12:00:00Z")); // 1 day before race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.getByTestId("taper-reminder")).toBeInTheDocument();
        expect(screen.getByText("Rest up! Tomorrow is the big day!")).toBeInTheDocument();

        jest.useRealTimers();
      });

      it("displays race day reminder on race day", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-17T08:00:00Z")); // Race day

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.getByTestId("taper-reminder")).toBeInTheDocument();
        expect(screen.getByText("Race day! Trust your training!")).toBeInTheDocument();

        jest.useRealTimers();
      });

      it("does not display taper reminder when race is far away", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2025-11-30T12:00:00Z")); // 168 days before race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.queryByTestId("taper-reminder")).not.toBeInTheDocument();

        jest.useRealTimers();
      });
    });

    describe("race day weather", () => {
      const mockWeatherData = [
        {
          datetime: new Date("2026-05-17T00:00:00Z"),
          condition: "Partly cloudy",
          temperature: 15,
          precipitation: 20,
          windSpeed: 12,
          location: "Balbriggan, IE",
          latitude: 53.6108,
          longitude: -6.1817,
          description: "Partly cloudy",
          feelsLike: 14,
          humidity: 65,
          windDirection: 180,
        },
      ];

      it("displays race day weather when race is within 10 days", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-10T12:00:00Z")); // 7 days before race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        mockWeatherForecastQuery.mockReturnValue({
          data: mockWeatherData,
          isLoading: false,
        });

        render(<RaceCountdown />);

        expect(screen.getByTestId("race-day-weather")).toBeInTheDocument();
        expect(screen.getByText("Race Day Forecast")).toBeInTheDocument();
        expect(screen.getByTestId("race-weather-temp")).toHaveTextContent("15°C");
        expect(screen.getByTestId("race-weather-details")).toHaveTextContent("20% rain");
        expect(screen.getByTestId("race-weather-details")).toHaveTextContent("12 km/h wind");
        expect(screen.getByTestId("race-weather-condition")).toHaveTextContent("Partly cloudy");

        jest.useRealTimers();
      });

      it("does not display race day weather when race is more than 10 days away", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2025-11-30T12:00:00Z")); // 168 days before race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.queryByTestId("race-day-weather")).not.toBeInTheDocument();

        jest.useRealTimers();
      });

      it("does not display race day weather when forecast data is not available", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-10T12:00:00Z")); // 7 days before race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        mockWeatherForecastQuery.mockReturnValue({
          data: undefined,
          isLoading: false,
        });

        render(<RaceCountdown />);

        expect(screen.queryByTestId("race-day-weather")).not.toBeInTheDocument();

        jest.useRealTimers();
      });

      it("does not display race day weather after race has passed", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-20T12:00:00Z")); // 3 days after race

        mockUseQuery.mockReturnValue({
          data: mockSettingsData,
          isLoading: false,
          isError: false,
          refetch: mockRefetch,
          isFetching: false,
        });

        render(<RaceCountdown />);

        expect(screen.queryByTestId("race-day-weather")).not.toBeInTheDocument();

        jest.useRealTimers();
      });
    });
  });
});
