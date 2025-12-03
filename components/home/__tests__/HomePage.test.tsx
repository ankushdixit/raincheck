import { render, screen, act } from "@testing-library/react";
import { HomePage } from "../HomePage";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

/** Selected day type for callback */
interface SelectedDay {
  condition: string;
  datetime: Date;
}

// Store the onDaySelect callback so we can trigger it in tests
let capturedOnDaySelect: ((_day: SelectedDay, _index: number) => void) | undefined;

// Mock tRPC api
const mockGetCurrentWeather = jest.fn();
const mockGetCurrentPhase = jest.fn();
const mockGetProgressStats = jest.fn();
const mockGetSettings = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    weather: {
      getCurrentWeather: {
        useQuery: () => mockGetCurrentWeather(),
      },
    },
    planning: {
      getCurrentPhase: {
        useQuery: () => mockGetCurrentPhase(),
      },
    },
    runs: {
      getProgressStats: {
        useQuery: () => mockGetProgressStats(),
      },
    },
    settings: {
      get: {
        useQuery: () => mockGetSettings(),
      },
    },
  },
}));

// Mock the weather components
jest.mock("@/components/weather", () => ({
  CurrentWeather: () => <div data-testid="current-weather-mock">Weather Component</div>,
  WeatherForecast: ({
    onDaySelect,
  }: {
    onDaySelect?: (_day: SelectedDay, _index: number) => void;
  }) => {
    // Capture the callback for testing
    capturedOnDaySelect = onDaySelect;
    return <div data-testid="weather-forecast-mock">Forecast Component</div>;
  },
}));

// Mock the suggestions component
jest.mock("@/components/suggestions", () => ({
  RunSuggestions: ({ isAuthenticated }: { isAuthenticated?: boolean }) => (
    <div data-testid="run-suggestions-mock" data-authenticated={isAuthenticated}>
      Run Suggestions
    </div>
  ),
}));

// Mock the calendar component
jest.mock("@/components/calendar", () => ({
  TrainingCalendar: () => <div data-testid="training-calendar-mock">Training Calendar</div>,
}));

// Mock the countdown component
jest.mock("@/components/countdown", () => ({
  RaceCountdown: () => <div data-testid="race-countdown-mock">Race Countdown</div>,
}));

// Mock the stats component
jest.mock("@/components/stats", () => ({
  WeeklyMileageChart: () => <div data-testid="weekly-mileage-chart-mock">Weekly Mileage Chart</div>,
}));

// Mock the hooks
jest.mock("@/hooks", () => ({
  useIsAuthenticated: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
  useDeviceCapabilities: () => ({
    isMobile: false,
    prefersReducedMotion: false,
    hardwareConcurrency: 8,
    tier: "high",
    isLoading: false,
  }),
  useFPSMonitor: () => ({
    fps: 60,
    isLowFPS: false,
    start: jest.fn(),
    stop: jest.fn(),
    isMonitoring: true,
  }),
  useEffectsPreference: () => ({
    effectsEnabled: true,
    toggleEffects: jest.fn(),
    setEffectsEnabled: jest.fn(),
    isLoaded: true,
  }),
}));

describe("HomePage", () => {
  beforeEach(() => {
    capturedOnDaySelect = undefined;

    // Mock current weather API response
    mockGetCurrentWeather.mockReturnValue({
      data: {
        location: "Test Location",
        latitude: 0,
        longitude: 0,
        datetime: new Date(),
        condition: "Partly cloudy",
        description: "Test weather",
        temperature: 15,
        feelsLike: 15,
        precipitation: 0,
        humidity: 50,
        windSpeed: 10,
        windDirection: 180,
      },
      isLoading: false,
      isError: false,
    });

    // Mock planning phase API response
    mockGetCurrentPhase.mockReturnValue({
      data: {
        currentPhase: "BASE",
        weekNumber: 4,
        totalWeeks: 12,
        description: "Building aerobic base",
      },
      isLoading: false,
      isError: false,
    });

    // Mock progress stats API response
    mockGetProgressStats.mockReturnValue({
      data: {
        totalDistance: 50,
        targetDistance: 100,
        completedRuns: 10,
        totalRuns: 20,
      },
      isLoading: false,
      isError: false,
    });

    // Mock settings API response
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);
    mockGetSettings.mockReturnValue({
      data: {
        raceDate: futureDate,
        targetTime: "2:00:00",
      },
      isLoading: false,
      isError: false,
    });
  });

  it("renders the RainCheck logo", () => {
    render(<HomePage />);
    const logo = screen.getByAltText("RainCheck - Weather-aware Marathon Training");
    expect(logo).toBeInTheDocument();
  });

  it("renders the header component", () => {
    render(<HomePage />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders with trail-background data-testid", () => {
    render(<HomePage />);
    expect(screen.getByTestId("trail-background")).toBeInTheDocument();
  });

  it("renders the Weather section heading", () => {
    render(<HomePage />);
    expect(screen.getByText("Weather")).toBeInTheDocument();
  });

  it("renders the WeatherForecast component", () => {
    render(<HomePage />);
    expect(screen.getByTestId("weather-forecast-mock")).toBeInTheDocument();
  });

  it("renders the Suggested Runs section heading", () => {
    render(<HomePage />);
    expect(screen.getByText("Suggested Runs")).toBeInTheDocument();
  });

  it("renders the RunSuggestions component", () => {
    render(<HomePage />);
    expect(screen.getByTestId("run-suggestions-mock")).toBeInTheDocument();
  });

  it("passes isAuthenticated prop to RunSuggestions", () => {
    render(<HomePage />);
    const suggestions = screen.getByTestId("run-suggestions-mock");
    expect(suggestions).toHaveAttribute("data-authenticated", "true");
  });

  it("renders the Calendar section heading", () => {
    render(<HomePage />);
    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("renders the TrainingCalendar component", () => {
    render(<HomePage />);
    expect(screen.getByTestId("training-calendar-mock")).toBeInTheDocument();
  });

  it("renders two background layers for cross-fade transitions", () => {
    render(<HomePage />);
    expect(screen.getByTestId("background-layer-0")).toBeInTheDocument();
    expect(screen.getByTestId("background-layer-1")).toBeInTheDocument();
  });

  it("uses default background on initial render", () => {
    render(<HomePage />);
    const layer0 = screen.getByTestId("background-layer-0");
    expect(layer0.style.backgroundImage).toContain("default-trail.webp");
  });

  it("has full viewport layout for main element", () => {
    render(<HomePage />);
    const main = screen.getByRole("main");
    expect(main).toHaveClass("h-screen");
    expect(main).toHaveClass("w-screen");
    expect(main).toHaveClass("overflow-hidden");
  });

  describe("layered background transitions", () => {
    it("starts with current weather background after loading", () => {
      render(<HomePage />);
      const main = screen.getByTestId("trail-background");
      // After current weather loads, background updates to match weather condition
      // Our mock has "Partly cloudy" condition, which maps to cloudy-trail.webp
      expect(main.getAttribute("data-layer1-image")).toContain("cloudy-trail.webp");
    });

    it("has transition classes for smooth cross-fade", () => {
      render(<HomePage />);
      const layer0 = screen.getByTestId("background-layer-0");
      expect(layer0).toHaveClass("transition-opacity");
      expect(layer0).toHaveClass("duration-[2000ms]");
    });

    it("updates background when day is selected", () => {
      render(<HomePage />);

      // Initially displays current weather (cloudy from our mock)
      const main = screen.getByTestId("trail-background");
      expect(main.getAttribute("data-layer1-image")).toContain("cloudy-trail.webp");

      // Simulate forecast calling onDaySelect with sunny condition
      act(() => {
        capturedOnDaySelect?.({ condition: "Sunny", datetime: new Date() }, 1);
      });

      // After selection, the background should update to sunny
      // The active layer toggles, so now it uses the other layer
      const newActiveLayer = main.getAttribute("data-active-layer");
      expect(newActiveLayer).toBeDefined();

      // The appropriate layer should have the sunny background
      const layer0Image = main.getAttribute("data-layer0-image");
      const layer1Image = main.getAttribute("data-layer1-image");
      const hasSunnyBg =
        layer0Image?.includes("sunny-trail.webp") || layer1Image?.includes("sunny-trail.webp");
      expect(hasSunnyBg).toBe(true);
    });

    it("alternates between layers on multiple selections", () => {
      render(<HomePage />);

      const main = screen.getByTestId("trail-background");
      const initialActiveLayer = main.getAttribute("data-active-layer");

      // First selection
      act(() => {
        capturedOnDaySelect?.({ condition: "Sunny", datetime: new Date() }, 1);
      });

      const afterFirstSelection = main.getAttribute("data-active-layer");
      // Should toggle from initial layer
      expect(afterFirstSelection).not.toBe(initialActiveLayer);

      // Second selection
      act(() => {
        capturedOnDaySelect?.({ condition: "Rain", datetime: new Date() }, 2);
      });

      const afterSecondSelection = main.getAttribute("data-active-layer");
      // Should toggle again
      expect(afterSecondSelection).not.toBe(afterFirstSelection);

      // One of the layers should have rainy background
      const layer0Image = main.getAttribute("data-layer0-image");
      const layer1Image = main.getAttribute("data-layer1-image");
      const hasRainyBg =
        layer0Image?.includes("rainy-trail.webp") || layer1Image?.includes("rainy-trail.webp");
      expect(hasRainyBg).toBe(true);
    });
  });

  describe("background updates based on selected day", () => {
    it("updates background when sunny day is selected", () => {
      render(<HomePage />);

      act(() => {
        capturedOnDaySelect?.({ condition: "Sunny", datetime: new Date() }, 1);
      });

      const main = screen.getByTestId("trail-background");
      const layer0Image = main.getAttribute("data-layer0-image");
      const layer1Image = main.getAttribute("data-layer1-image");
      const hasSunnyBg =
        layer0Image?.includes("sunny-trail.webp") || layer1Image?.includes("sunny-trail.webp");
      expect(hasSunnyBg).toBe(true);
    });

    it("updates background when rainy day is selected", () => {
      render(<HomePage />);

      act(() => {
        capturedOnDaySelect?.({ condition: "Light rain", datetime: new Date() }, 1);
      });

      const main = screen.getByTestId("trail-background");
      const layer0Image = main.getAttribute("data-layer0-image");
      const layer1Image = main.getAttribute("data-layer1-image");
      const hasRainyBg =
        layer0Image?.includes("rainy-trail.webp") || layer1Image?.includes("rainy-trail.webp");
      expect(hasRainyBg).toBe(true);
    });

    it("updates background when cloudy day is selected", () => {
      render(<HomePage />);

      act(() => {
        capturedOnDaySelect?.({ condition: "Overcast", datetime: new Date() }, 1);
      });

      const main = screen.getByTestId("trail-background");
      const layer0Image = main.getAttribute("data-layer0-image");
      const layer1Image = main.getAttribute("data-layer1-image");
      const hasCloudyBg =
        layer0Image?.includes("cloudy-trail.webp") || layer1Image?.includes("cloudy-trail.webp");
      expect(hasCloudyBg).toBe(true);
    });

    it("updates background when snowy day is selected", () => {
      render(<HomePage />);

      act(() => {
        capturedOnDaySelect?.({ condition: "Snow", datetime: new Date() }, 1);
      });

      const main = screen.getByTestId("trail-background");
      const layer0Image = main.getAttribute("data-layer0-image");
      const layer1Image = main.getAttribute("data-layer1-image");
      const hasSnowyBg =
        layer0Image?.includes("snowy-trail.webp") || layer1Image?.includes("snowy-trail.webp");
      expect(hasSnowyBg).toBe(true);
    });

    it("updates background with correct tint for each condition", () => {
      render(<HomePage />);

      act(() => {
        capturedOnDaySelect?.({ condition: "Sunny", datetime: new Date() }, 1);
      });

      // Check that one of the layers has been updated with sunny background
      const layer0 = screen.getByTestId("background-layer-0");
      const layer1 = screen.getByTestId("background-layer-1");

      // One of the layers should have sunny tint
      const layer0HasSunnyTint = layer0.style.backgroundImage.includes("rgba(255, 183, 77, 0.15)");
      const layer1HasSunnyTint = layer1.style.backgroundImage.includes("rgba(255, 183, 77, 0.15)");

      expect(layer0HasSunnyTint || layer1HasSunnyTint).toBe(true);
    });

    it("passes onDaySelect callback to WeatherForecast", () => {
      render(<HomePage />);

      // The callback should have been captured
      expect(capturedOnDaySelect).toBeDefined();
    });
  });
});
