import { render, screen } from "@testing-library/react";
import { HomePage } from "../HomePage";

// Mock the tRPC api
jest.mock("@/lib/api", () => ({
  api: {
    weather: {
      getCurrentWeather: {
        useQuery: jest.fn(() => ({
          data: { condition: "Sunny" },
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
          isFetching: false,
        })),
      },
    },
  },
}));

// Mock the weather components
jest.mock("@/components/weather", () => ({
  CurrentWeather: () => <div data-testid="current-weather-mock">Weather Component</div>,
  WeatherForecast: () => <div data-testid="weather-forecast-mock">Forecast Component</div>,
}));

describe("HomePage", () => {
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

  it("applies weather-reactive background for sunny condition", () => {
    render(<HomePage />);
    const main = screen.getByTestId("trail-background");
    expect(main.style.backgroundImage).toContain("sunny-trail.webp");
    expect(main.style.backgroundImage).toContain("linear-gradient");
  });

  it("renders the CurrentWeather component", () => {
    render(<HomePage />);
    expect(screen.getByTestId("current-weather-mock")).toBeInTheDocument();
  });

  it("renders the WeatherForecast component", () => {
    render(<HomePage />);
    expect(screen.getByTestId("weather-forecast-mock")).toBeInTheDocument();
  });

  it("uses default background when weather data is not loaded", () => {
    // Override the mock to return no data
    const apiMock = require("@/lib/api").api;
    apiMock.weather.getCurrentWeather.useQuery.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      isFetching: false,
    });

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

  it("has transition classes for smooth animation", () => {
    render(<HomePage />);
    const main = screen.getByTestId("trail-background");
    expect(main).toHaveClass("duration-[2000ms]");
    expect(main).toHaveClass("transition-all");
  });
});
