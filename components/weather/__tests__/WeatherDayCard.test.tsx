import { render, screen, fireEvent } from "@testing-library/react";
import { WeatherDayCard } from "../WeatherDayCard";

// Sample day card props
const defaultProps = {
  datetime: new Date("2024-11-25T00:00:00Z"),
  condition: "Partly cloudy",
  temperature: 12.5,
  precipitation: 20,
  windSpeed: 15.3,
  isSelected: false,
  onSelect: jest.fn(),
};

describe("WeatherDayCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the card", () => {
      render(<WeatherDayCard {...defaultProps} />);

      expect(screen.getByTestId("weather-day-card")).toBeInTheDocument();
    });

    it("displays day name (Mon, Tue, etc.)", () => {
      render(<WeatherDayCard {...defaultProps} />);

      expect(screen.getByText("Mon")).toBeInTheDocument();
    });

    it("displays short date format", () => {
      render(<WeatherDayCard {...defaultProps} />);

      expect(screen.getByText("Nov 25")).toBeInTheDocument();
    });

    it("displays weather icon matching condition", () => {
      render(<WeatherDayCard {...defaultProps} />);

      expect(screen.getByRole("img", { name: "Partly cloudy" })).toBeInTheDocument();
    });

    it("displays temperature with degree symbol", () => {
      render(<WeatherDayCard {...defaultProps} />);

      expect(screen.getByText("13°C")).toBeInTheDocument(); // 12.5 rounds to 13
    });

    it("displays precipitation percentage", () => {
      render(<WeatherDayCard {...defaultProps} />);

      expect(screen.getByText("20%")).toBeInTheDocument();
    });

    it("displays wind speed", () => {
      render(<WeatherDayCard {...defaultProps} />);

      expect(screen.getByText("15")).toBeInTheDocument(); // 15.3 rounds to 15
    });

    it("displays precipitation emoji", () => {
      render(<WeatherDayCard {...defaultProps} />);

      expect(screen.getByRole("img", { name: "Precipitation" })).toBeInTheDocument();
    });

    it("displays wind emoji", () => {
      render(<WeatherDayCard {...defaultProps} />);

      expect(screen.getByRole("img", { name: "Wind" })).toBeInTheDocument();
    });
  });

  describe("different days", () => {
    it("displays correct day name for Tuesday", () => {
      const tuesdayProps = {
        ...defaultProps,
        datetime: new Date("2024-11-26T00:00:00Z"), // Tuesday
      };
      render(<WeatherDayCard {...tuesdayProps} />);

      expect(screen.getByText("Tue")).toBeInTheDocument();
    });

    it("displays correct day name for Sunday", () => {
      const sundayProps = {
        ...defaultProps,
        datetime: new Date("2024-11-24T00:00:00Z"), // Sunday
      };
      render(<WeatherDayCard {...sundayProps} />);

      expect(screen.getByText("Sun")).toBeInTheDocument();
    });
  });

  describe("selection state", () => {
    it("has different background when selected", () => {
      render(<WeatherDayCard {...defaultProps} isSelected={true} />);

      const card = screen.getByTestId("weather-day-card");
      expect(card).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.7)" });
    });

    it("has lighter background when not selected", () => {
      render(<WeatherDayCard {...defaultProps} isSelected={false} />);

      const card = screen.getByTestId("weather-day-card");
      expect(card).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.5)" });
    });

    it("has aria-pressed false when not selected", () => {
      render(<WeatherDayCard {...defaultProps} isSelected={false} />);

      const card = screen.getByTestId("weather-day-card");
      expect(card).toHaveAttribute("aria-pressed", "false");
    });

    it("has aria-pressed true when selected", () => {
      render(<WeatherDayCard {...defaultProps} isSelected={true} />);

      const card = screen.getByTestId("weather-day-card");
      expect(card).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("interactions", () => {
    it("calls onSelect when clicked", () => {
      const onSelect = jest.fn();
      render(<WeatherDayCard {...defaultProps} onSelect={onSelect} />);

      const card = screen.getByTestId("weather-day-card");
      fireEvent.click(card);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("is a button element for proper keyboard accessibility", () => {
      render(<WeatherDayCard {...defaultProps} />);

      const card = screen.getByTestId("weather-day-card");
      expect(card.tagName).toBe("BUTTON");
    });
  });

  describe("hover styling", () => {
    it("has hover scale classes for lift effect", () => {
      render(<WeatherDayCard {...defaultProps} />);

      const card = screen.getByTestId("weather-day-card");
      expect(card).toHaveClass("hover:scale-[1.02]");
    });

    it("has transition classes for smooth animation", () => {
      render(<WeatherDayCard {...defaultProps} />);

      const card = screen.getByTestId("weather-day-card");
      expect(card).toHaveClass("transition-all");
    });

    it("has backdrop blur for glass effect", () => {
      render(<WeatherDayCard {...defaultProps} />);

      const card = screen.getByTestId("weather-day-card");
      expect(card).toHaveClass("backdrop-blur-md");
    });

    it("has rounded corners for glass aesthetic", () => {
      render(<WeatherDayCard {...defaultProps} />);

      const card = screen.getByTestId("weather-day-card");
      expect(card).toHaveStyle({ borderRadius: "0.5rem" });
    });
  });

  describe("different weather conditions", () => {
    it("displays sunny icon for clear condition", () => {
      render(<WeatherDayCard {...defaultProps} condition="Clear" />);

      expect(screen.getByRole("img", { name: "Clear" })).toBeInTheDocument();
    });

    it("displays rain icon for rain condition", () => {
      render(<WeatherDayCard {...defaultProps} condition="Light rain" />);

      expect(screen.getByRole("img", { name: "Light rain" })).toBeInTheDocument();
    });
  });

  describe("temperature rounding", () => {
    it("rounds temperature down correctly", () => {
      render(<WeatherDayCard {...defaultProps} temperature={10.4} />);

      expect(screen.getByText("10°C")).toBeInTheDocument();
    });

    it("rounds temperature up correctly", () => {
      render(<WeatherDayCard {...defaultProps} temperature={10.6} />);

      expect(screen.getByText("11°C")).toBeInTheDocument();
    });
  });
});
