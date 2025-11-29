import { render, screen, act } from "@testing-library/react";
import { HomePage } from "../HomePage";

/** Selected day type for callback */
interface SelectedDay {
  condition: string;
  datetime: Date;
}

// Store the onDaySelect callback so we can trigger it in tests
// eslint-disable-next-line no-unused-vars
let capturedOnDaySelect: ((day: SelectedDay) => void) | undefined;

// Mock the weather components
jest.mock("@/components/weather", () => ({
  CurrentWeather: () => <div data-testid="current-weather-mock">Weather Component</div>,
  // eslint-disable-next-line no-unused-vars
  WeatherForecast: ({ onDaySelect }: { onDaySelect?: (day: SelectedDay) => void }) => {
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

// Mock the useIsAuthenticated hook
jest.mock("@/hooks", () => ({
  useIsAuthenticated: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe("HomePage", () => {
  beforeEach(() => {
    capturedOnDaySelect = undefined;
  });

  it("renders the RainCheck title", () => {
    render(<HomePage />);
    expect(screen.getByText("RainCheck")).toBeInTheDocument();
  });

  it("displays the subtitle", () => {
    render(<HomePage />);
    expect(screen.getByText("Weather-aware half-marathon training")).toBeInTheDocument();
  });

  it("renders heading as h1", () => {
    render(<HomePage />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("RainCheck");
  });

  it("renders with trail-background data-testid", () => {
    render(<HomePage />);
    expect(screen.getByTestId("trail-background")).toBeInTheDocument();
  });

  it("renders the CurrentWeather component", () => {
    render(<HomePage />);
    expect(screen.getByTestId("current-weather-mock")).toBeInTheDocument();
  });

  it("renders the WeatherForecast component", () => {
    render(<HomePage />);
    expect(screen.getByTestId("weather-forecast-mock")).toBeInTheDocument();
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

  it("renders the Suggested Runs heading", () => {
    render(<HomePage />);
    expect(screen.getByText("Suggested Runs")).toBeInTheDocument();
  });

  it("renders the Training Calendar heading", () => {
    render(<HomePage />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    const calendarHeading = headings.find((h) => h.textContent === "Training Calendar");
    expect(calendarHeading).toBeInTheDocument();
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

  it("has centered layout for main element", () => {
    render(<HomePage />);
    const main = screen.getByRole("main");
    expect(main).toHaveClass("flex");
    expect(main).toHaveClass("min-h-screen");
    expect(main).toHaveClass("items-center");
    expect(main).toHaveClass("justify-center");
  });

  describe("layered background transitions", () => {
    it("starts with layer 0 active (opacity 1)", () => {
      render(<HomePage />);
      const layer0 = screen.getByTestId("background-layer-0");
      const layer1 = screen.getByTestId("background-layer-1");
      expect(layer0.style.opacity).toBe("1");
      expect(layer1.style.opacity).toBe("0");
    });

    it("has transition classes for smooth cross-fade", () => {
      render(<HomePage />);
      const layer0 = screen.getByTestId("background-layer-0");
      expect(layer0).toHaveClass("transition-opacity");
      expect(layer0).toHaveClass("duration-[2000ms]");
    });

    it("updates inactive layer and toggles active layer on day select", () => {
      render(<HomePage />);

      // Simulate forecast calling onDaySelect with sunny condition
      act(() => {
        capturedOnDaySelect?.({ condition: "Sunny", datetime: new Date() });
      });

      // After selection, layer 1 should become active and contain the new background
      const main = screen.getByTestId("trail-background");
      const layer1 = screen.getByTestId("background-layer-1");

      expect(main.getAttribute("data-active-layer")).toBe("1");
      expect(layer1.style.backgroundImage).toContain("sunny-trail.webp");
      expect(layer1.style.opacity).toBe("1");
    });

    it("alternates between layers on multiple selections", () => {
      render(<HomePage />);

      // First selection - switches to layer 1
      act(() => {
        capturedOnDaySelect?.({ condition: "Sunny", datetime: new Date() });
      });

      const main = screen.getByTestId("trail-background");
      expect(main.getAttribute("data-active-layer")).toBe("1");

      // Second selection - switches back to layer 0
      act(() => {
        capturedOnDaySelect?.({ condition: "Rain", datetime: new Date() });
      });

      expect(main.getAttribute("data-active-layer")).toBe("0");
      const layer0 = screen.getByTestId("background-layer-0");
      expect(layer0.style.backgroundImage).toContain("rainy-trail.webp");
    });
  });

  describe("background updates based on selected day", () => {
    it("updates background when sunny day is selected", () => {
      render(<HomePage />);

      act(() => {
        capturedOnDaySelect?.({ condition: "Sunny", datetime: new Date() });
      });

      const layer1 = screen.getByTestId("background-layer-1");
      expect(layer1.style.backgroundImage).toContain("sunny-trail.webp");
    });

    it("updates background when rainy day is selected", () => {
      render(<HomePage />);

      act(() => {
        capturedOnDaySelect?.({ condition: "Light rain", datetime: new Date() });
      });

      const layer1 = screen.getByTestId("background-layer-1");
      expect(layer1.style.backgroundImage).toContain("rainy-trail.webp");
    });

    it("updates background when cloudy day is selected", () => {
      render(<HomePage />);

      act(() => {
        capturedOnDaySelect?.({ condition: "Overcast", datetime: new Date() });
      });

      const layer1 = screen.getByTestId("background-layer-1");
      expect(layer1.style.backgroundImage).toContain("cloudy-trail.webp");
    });

    it("updates background when snowy day is selected", () => {
      render(<HomePage />);

      act(() => {
        capturedOnDaySelect?.({ condition: "Snow", datetime: new Date() });
      });

      const layer1 = screen.getByTestId("background-layer-1");
      expect(layer1.style.backgroundImage).toContain("snowy-trail.webp");
    });

    it("updates background with correct tint for each condition", () => {
      render(<HomePage />);

      act(() => {
        capturedOnDaySelect?.({ condition: "Sunny", datetime: new Date() });
      });

      const layer1 = screen.getByTestId("background-layer-1");
      // Sunny tint is golden rgba(255, 183, 77, 0.15)
      expect(layer1.style.backgroundImage).toContain("linear-gradient");
      expect(layer1.style.backgroundImage).toContain("rgba(255, 183, 77, 0.15)");
    });

    it("passes onDaySelect callback to WeatherForecast", () => {
      render(<HomePage />);

      // The callback should have been captured
      expect(capturedOnDaySelect).toBeDefined();
    });
  });
});
