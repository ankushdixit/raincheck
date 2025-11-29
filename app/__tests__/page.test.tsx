import { render, screen } from "@testing-library/react";
import Home from "../page";

// Mock the weather components since they use tRPC hooks
jest.mock("@/components/weather", () => ({
  CurrentWeather: () => <div data-testid="current-weather-mock">Weather Component</div>,
  WeatherForecast: () => <div data-testid="weather-forecast-mock">Forecast Component</div>,
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

  it("has background image style", () => {
    const { container } = render(<Home />);
    const main = container.querySelector("main");
    expect(main).toHaveStyle({ backgroundImage: expect.stringContaining("default-trail.webp") });
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
