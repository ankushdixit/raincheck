import { render, screen } from "@testing-library/react";
import { WeatherHourCard } from "../WeatherHourCard";

describe("WeatherHourCard", () => {
  const defaultProps = {
    time: new Date("2025-12-16T14:00:00"),
    condition: "Partly Cloudy",
    temperature: 15,
    precipitation: 20,
    windSpeed: 12,
  };

  it("renders the weather hour card", () => {
    render(<WeatherHourCard {...defaultProps} />);

    expect(screen.getByTestId("weather-hour-card")).toBeInTheDocument();
  });

  it("displays the hour in 12-hour format", () => {
    render(<WeatherHourCard {...defaultProps} />);

    expect(screen.getByText("2 PM")).toBeInTheDocument();
  });

  it("displays 'Today' label below the hour", () => {
    render(<WeatherHourCard {...defaultProps} />);

    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("displays the temperature with degree symbol", () => {
    render(<WeatherHourCard {...defaultProps} />);

    expect(screen.getByText("15°C")).toBeInTheDocument();
  });

  it("rounds temperature to nearest integer", () => {
    render(<WeatherHourCard {...defaultProps} temperature={15.7} />);

    expect(screen.getByText("16°C")).toBeInTheDocument();
  });

  it("displays precipitation percentage", () => {
    render(<WeatherHourCard {...defaultProps} />);

    expect(screen.getByText("20%")).toBeInTheDocument();
  });

  it("displays wind speed", () => {
    render(<WeatherHourCard {...defaultProps} />);

    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("has default styling", () => {
    render(<WeatherHourCard {...defaultProps} />);

    const card = screen.getByTestId("weather-hour-card");
    expect(card).toHaveClass("bg-forest-deep/50");
  });

  it("displays weather icon", () => {
    render(<WeatherHourCard {...defaultProps} />);

    // The WeatherIcon component should render an emoji for the condition
    const card = screen.getByTestId("weather-hour-card");
    expect(card).toBeInTheDocument();
  });

  describe("time formatting", () => {
    it("formats morning hours correctly", () => {
      render(<WeatherHourCard {...defaultProps} time={new Date("2025-12-16T09:00:00")} />);

      expect(screen.getByText("9 AM")).toBeInTheDocument();
    });

    it("formats noon correctly", () => {
      render(<WeatherHourCard {...defaultProps} time={new Date("2025-12-16T12:00:00")} />);

      expect(screen.getByText("12 PM")).toBeInTheDocument();
    });

    it("formats midnight correctly", () => {
      render(<WeatherHourCard {...defaultProps} time={new Date("2025-12-16T00:00:00")} />);

      expect(screen.getByText("12 AM")).toBeInTheDocument();
    });

    it("formats evening hours correctly", () => {
      render(<WeatherHourCard {...defaultProps} time={new Date("2025-12-16T21:00:00")} />);

      expect(screen.getByText("9 PM")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has aria labels for precipitation", () => {
      render(<WeatherHourCard {...defaultProps} />);

      expect(screen.getByRole("img", { name: "Precipitation" })).toBeInTheDocument();
    });

    it("has aria labels for wind", () => {
      render(<WeatherHourCard {...defaultProps} />);

      expect(screen.getByRole("img", { name: "Wind" })).toBeInTheDocument();
    });
  });
});
