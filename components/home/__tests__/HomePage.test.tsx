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

  it("uses default background when no day is selected", () => {
    render(<HomePage />);
    const main = screen.getByTestId("trail-background");
    expect(main.style.backgroundImage).toContain("default-trail.webp");
  });

  it("has centered layout for main element", () => {
    render(<HomePage />);
    const main = screen.getByRole("main");
    expect(main).toHaveClass("flex");
    expect(main).toHaveClass("min-h-screen");
    expect(main).toHaveClass("items-center");
    expect(main).toHaveClass("justify-center");
  });

  describe("background updates based on selected day", () => {
    it("updates background when sunny day is selected", () => {
      render(<HomePage />);

      // Simulate forecast calling onDaySelect with sunny condition
      act(() => {
        capturedOnDaySelect?.({ condition: "Sunny", datetime: new Date() });
      });

      const main = screen.getByTestId("trail-background");
      expect(main.style.backgroundImage).toContain("sunny-trail.webp");
    });

    it("updates background when rainy day is selected", () => {
      render(<HomePage />);

      // Simulate forecast calling onDaySelect with rainy condition
      act(() => {
        capturedOnDaySelect?.({ condition: "Light rain", datetime: new Date() });
      });

      const main = screen.getByTestId("trail-background");
      expect(main.style.backgroundImage).toContain("rainy-trail.webp");
    });

    it("updates background when cloudy day is selected", () => {
      render(<HomePage />);

      // Simulate forecast calling onDaySelect with cloudy condition
      act(() => {
        capturedOnDaySelect?.({ condition: "Overcast", datetime: new Date() });
      });

      const main = screen.getByTestId("trail-background");
      expect(main.style.backgroundImage).toContain("cloudy-trail.webp");
    });

    it("updates background when snowy day is selected", () => {
      render(<HomePage />);

      // Simulate forecast calling onDaySelect with snowy condition
      act(() => {
        capturedOnDaySelect?.({ condition: "Snow", datetime: new Date() });
      });

      const main = screen.getByTestId("trail-background");
      expect(main.style.backgroundImage).toContain("snowy-trail.webp");
    });

    it("updates background with correct tint for each condition", () => {
      render(<HomePage />);

      // Select sunny day
      act(() => {
        capturedOnDaySelect?.({ condition: "Sunny", datetime: new Date() });
      });

      const main = screen.getByTestId("trail-background");
      // Sunny tint is golden rgba(255, 183, 77, 0.15)
      expect(main.style.backgroundImage).toContain("linear-gradient");
      expect(main.style.backgroundImage).toContain("rgba(255, 183, 77, 0.15)");
    });

    it("passes onDaySelect callback to WeatherForecast", () => {
      render(<HomePage />);

      // The callback should have been captured
      expect(capturedOnDaySelect).toBeDefined();
    });
  });
});
