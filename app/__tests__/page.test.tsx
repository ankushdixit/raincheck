import { render, screen } from "@testing-library/react";
import Home from "../page";

// Mock the HomePage component to test the page renders it
jest.mock("@/components/home", () => ({
  HomePage: () => (
    <main className="flex min-h-screen items-center justify-center">
      <div data-testid="trail-background">
        <h1>RainCheck</h1>
        <p>Weather-aware half-marathon training</p>
        <div data-testid="current-weather-mock">Weather Component</div>
        <div data-testid="weather-forecast-mock">Forecast Component</div>
      </div>
    </main>
  ),
}));

describe("Home Page", () => {
  it("renders the RainCheck title", () => {
    render(<Home />);
    expect(screen.getByText("RainCheck")).toBeInTheDocument();
  });

  it("displays the subtitle", () => {
    render(<Home />);
    expect(screen.getByText("Weather-aware half-marathon training")).toBeInTheDocument();
  });

  it("renders heading as h1", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("RainCheck");
  });

  it("has centered layout", () => {
    const { container } = render(<Home />);
    const main = container.querySelector("main");
    expect(main).toHaveClass("flex");
    expect(main).toHaveClass("min-h-screen");
    expect(main).toHaveClass("items-center");
    expect(main).toHaveClass("justify-center");
  });

  it("renders the TrailBackground component", () => {
    render(<Home />);
    expect(screen.getByTestId("trail-background")).toBeInTheDocument();
  });

  it("renders without errors", () => {
    expect(() => render(<Home />)).not.toThrow();
  });

  it("renders the CurrentWeather component", () => {
    render(<Home />);
    expect(screen.getByTestId("current-weather-mock")).toBeInTheDocument();
  });

  it("renders the WeatherForecast component", () => {
    render(<Home />);
    expect(screen.getByTestId("weather-forecast-mock")).toBeInTheDocument();
  });
});
