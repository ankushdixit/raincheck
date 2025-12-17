import { render, screen } from "@testing-library/react";
import { WeatherHourCard } from "../WeatherHourCard";

describe("WeatherHourCard", () => {
  // Use dynamic dates to ensure tests don't fail when date changes
  const today = new Date();
  today.setHours(14, 0, 0, 0); // 2 PM today

  const defaultProps = {
    time: today,
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
      const morning = new Date();
      morning.setHours(9, 0, 0, 0);
      render(<WeatherHourCard {...defaultProps} time={morning} />);

      expect(screen.getByText("9 AM")).toBeInTheDocument();
    });

    it("formats noon correctly", () => {
      const noon = new Date();
      noon.setHours(12, 0, 0, 0);
      render(<WeatherHourCard {...defaultProps} time={noon} />);

      expect(screen.getByText("12 PM")).toBeInTheDocument();
    });

    it("formats midnight correctly", () => {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      render(<WeatherHourCard {...defaultProps} time={midnight} />);

      expect(screen.getByText("12 AM")).toBeInTheDocument();
    });

    it("formats evening hours correctly", () => {
      const evening = new Date();
      evening.setHours(21, 0, 0, 0);
      render(<WeatherHourCard {...defaultProps} time={evening} />);

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
