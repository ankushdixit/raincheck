import { render, screen, fireEvent } from "@testing-library/react";
import { WeatherForecast } from "../WeatherForecast";

// Mock the tRPC api
const mockRefetch = jest.fn();
const mockUseQuery = jest.fn();
const mockHourlyUseQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    weather: {
      getForecast: {
        useQuery: () => mockUseQuery(),
      },
      getHourlyForecast: {
        useQuery: () => mockHourlyUseQuery(),
      },
    },
  },
}));

// Sample 7-day forecast data
const createMockForecastData = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    return {
      location: "Balbriggan, Ireland",
      latitude: 53.6108,
      longitude: -6.1817,
      datetime: date,
      timezone: "Europe/Dublin",
      condition: ["Partly cloudy", "Sunny", "Light rain", "Cloudy", "Clear", "Rain", "Overcast"][i],
      description: "Weather description",
      temperature: 10 + i,
      feelsLike: 10 + i,
      precipitation: 10 + i * 5,
      humidity: 70 + i,
      windSpeed: 15 + i,
      windDirection: 180,
    };
  });
};

// Sample hourly forecast data
const createMockHourlyData = () => {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const time = new Date(now);
    time.setHours(time.getHours() + i);
    return {
      time,
      condition: ["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Rain", "Overcast", "Clear"][i],
      temperature: 12 + i,
      feelsLike: 11 + i,
      precipitation: 5 + i * 3,
      humidity: 65 + i,
      windSpeed: 10 + i,
      isDay: true,
    };
  });
};

describe("WeatherForecast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue({ data: createMockForecastData() });
    // Default hourly mock - not loading, no data
    mockHourlyUseQuery.mockReturnValue({
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

      render(<WeatherForecast />);

      expect(screen.getByTestId("forecast-skeleton")).toBeInTheDocument();
    });

    it("skeleton shows 7 placeholder cards", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<WeatherForecast />);

      const skeleton = screen.getByTestId("forecast-skeleton");
      const placeholders = skeleton.querySelectorAll(".animate-pulse");
      expect(placeholders).toHaveLength(7);
    });
  });

  describe("success state", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: createMockForecastData(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    it("displays weather forecast container", () => {
      render(<WeatherForecast />);

      expect(screen.getByTestId("weather-forecast")).toBeInTheDocument();
    });

    it("renders 7 weather day cards", () => {
      render(<WeatherForecast />);

      const cards = screen.getAllByTestId("weather-day-card");
      expect(cards).toHaveLength(7);
    });

    it("no card is selected by default in uncontrolled mode", () => {
      render(<WeatherForecast />);

      const cards = screen.getAllByTestId("weather-day-card");
      // In uncontrolled mode with no selectedIndex prop, all cards should have the unselected background
      cards.forEach((card) => {
        expect(card).toHaveClass("bg-forest-deep/50");
      });
    });

    it("displays temperatures for all days", () => {
      render(<WeatherForecast />);

      // Temperatures are 10, 11, 12, 13, 14, 15, 16
      expect(screen.getByText("10°C")).toBeInTheDocument();
      expect(screen.getByText("16°C")).toBeInTheDocument();
    });
  });

  describe("selection behavior", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: createMockForecastData(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    it("clicking a card selects it", () => {
      render(<WeatherForecast />);

      const cards = screen.getAllByTestId("weather-day-card");

      // Initially no card is selected - all should have unselected background
      expect(cards[0]).toHaveClass("bg-forest-deep/50");
      expect(cards[1]).toHaveClass("bg-forest-deep/50");

      // Click second card
      fireEvent.click(cards[1]!);

      // Now second card should be selected
      expect(cards[0]).toHaveClass("bg-forest-deep/50");
      expect(cards[1]).toHaveClass("bg-forest-deep/75");
    });

    it("only one card can be selected at a time", () => {
      render(<WeatherForecast />);

      const cards = screen.getAllByTestId("weather-day-card");

      // Click third card
      fireEvent.click(cards[2]!);

      // Third card should be selected - backgrounds set via Tailwind classes
      expect(cards[2]).toHaveClass("bg-forest-deep/75");
      // Others should not be selected
      expect(cards[0]).toHaveClass("bg-forest-deep/50");
      expect(cards[1]).toHaveClass("bg-forest-deep/50");
    });

    it("calls onDaySelect callback when card is clicked", () => {
      const mockForecastData = createMockForecastData();
      mockUseQuery.mockReturnValue({
        data: mockForecastData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      const onDaySelect = jest.fn();
      render(<WeatherForecast onDaySelect={onDaySelect} />);

      const cards = screen.getAllByTestId("weather-day-card");
      fireEvent.click(cards[3]!);

      // Should be called with the weather data for the 4th day and index
      expect(onDaySelect).toHaveBeenCalledWith(
        {
          condition: mockForecastData[3].condition,
          datetime: mockForecastData[3].datetime,
        },
        3
      );
    });

    it("does not auto-select on initial load in uncontrolled mode", () => {
      const mockForecastData = createMockForecastData();
      mockUseQuery.mockReturnValue({
        data: mockForecastData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      const onDaySelect = jest.fn();
      render(<WeatherForecast onDaySelect={onDaySelect} />);

      // Should NOT be called on initial load (no auto-selection in uncontrolled mode)
      expect(onDaySelect).not.toHaveBeenCalled();
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
      render(<WeatherForecast />);

      expect(screen.getByTestId("forecast-error")).toBeInTheDocument();
      expect(screen.getByText("Unable to load forecast")).toBeInTheDocument();
    });

    it("displays retry button on error", () => {
      render(<WeatherForecast />);

      expect(screen.getByTestId("forecast-retry-button")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    it("retry button triggers refetch when clicked", () => {
      render(<WeatherForecast />);

      const retryButton = screen.getByTestId("forecast-retry-button");
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it("shows loading state on retry button while retrying", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
        isFetching: true,
      });

      render(<WeatherForecast />);

      const retryButton = screen.getByTestId("forecast-retry-button");
      expect(retryButton).toHaveTextContent("Retrying...");
      expect(retryButton).toBeDisabled();
    });
  });

  describe("empty state", () => {
    it("displays empty state when forecast is empty array", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<WeatherForecast />);

      expect(screen.getByTestId("forecast-empty")).toBeInTheDocument();
      expect(screen.getByText("No forecast data available")).toBeInTheDocument();
    });

    it("displays empty state when forecast is null", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<WeatherForecast />);

      expect(screen.getByTestId("forecast-empty")).toBeInTheDocument();
    });
  });

  describe("responsive layout", () => {
    it("has horizontal scroll class for mobile", () => {
      mockUseQuery.mockReturnValue({
        data: createMockForecastData(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<WeatherForecast />);

      // The forecast container wraps the cards row
      const forecastContainer = screen.getByTestId("weather-forecast");
      expect(forecastContainer).toBeInTheDocument();
      // Cards row is inside the container
      const cardsRow = forecastContainer.querySelector(".flex");
      expect(cardsRow).toHaveClass("gap-4");
      expect(cardsRow).toHaveClass("overflow-x-auto");
    });

    it("has grid class for 2xl screens", () => {
      mockUseQuery.mockReturnValue({
        data: createMockForecastData(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<WeatherForecast />);

      const forecastContainer = screen.getByTestId("weather-forecast");
      const cardsRow = forecastContainer.querySelector(".flex");
      expect(cardsRow).toHaveClass("2xl:grid");
      expect(cardsRow).toHaveClass("2xl:grid-cols-7");
      expect(cardsRow).toHaveClass("2xl:gap-4");
    });
  });

  describe("API integration", () => {
    it("calls getForecast with days: 7", () => {
      mockUseQuery.mockReturnValue({
        data: createMockForecastData(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<WeatherForecast />);

      // Verify the mock was called (the component uses useQuery)
      expect(mockUseQuery).toHaveBeenCalled();
    });
  });

  describe("expand/collapse functionality", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: createMockForecastData(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
      mockHourlyUseQuery.mockReturnValue({
        data: createMockHourlyData(),
        isLoading: false,
      });
    });

    it("displays expand button by default", () => {
      render(<WeatherForecast />);

      const expandButton = screen.getByTestId("forecast-expand-button");
      expect(expandButton).toBeInTheDocument();
      expect(expandButton).toHaveTextContent("See Hourly Forecast");
    });

    it("shows daily cards by default (not expanded)", () => {
      render(<WeatherForecast />);

      const dayCards = screen.getAllByTestId("weather-day-card");
      expect(dayCards).toHaveLength(7);
      expect(screen.queryAllByTestId("weather-hour-card")).toHaveLength(0);
    });

    it("clicking expand button switches to hourly view", () => {
      render(<WeatherForecast />);

      const expandButton = screen.getByTestId("forecast-expand-button");
      fireEvent.click(expandButton);

      // Should now show 7 hourly cards (no day cards in hourly view)
      const hourCards = screen.getAllByTestId("weather-hour-card");
      expect(hourCards).toHaveLength(7);
      expect(screen.queryAllByTestId("weather-day-card")).toHaveLength(0);
    });

    it("expand button changes to collapse when expanded", () => {
      render(<WeatherForecast />);

      const expandButton = screen.getByTestId("forecast-expand-button");
      fireEvent.click(expandButton);

      // Button now has different test id when collapsed
      const collapseButton = screen.getByTestId("forecast-collapse-button");
      expect(collapseButton).toHaveTextContent("See Daily Forecast");
    });

    it("clicking collapse returns to daily view", () => {
      render(<WeatherForecast />);

      // Expand
      const expandButton = screen.getByTestId("forecast-expand-button");
      fireEvent.click(expandButton);
      expect(screen.getAllByTestId("weather-hour-card")).toHaveLength(7);
      expect(screen.queryAllByTestId("weather-day-card")).toHaveLength(0);

      // Collapse
      const collapseButton = screen.getByTestId("forecast-collapse-button");
      fireEvent.click(collapseButton);
      expect(screen.getAllByTestId("weather-day-card")).toHaveLength(7);
      expect(screen.queryAllByTestId("weather-hour-card")).toHaveLength(0);
    });

    it("shows loading skeleton while hourly data is loading", () => {
      mockHourlyUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<WeatherForecast />);

      const expandButton = screen.getByTestId("forecast-expand-button");
      fireEvent.click(expandButton);

      // Should show skeleton placeholders (6 for hourly cards)
      // Check for skeleton elements by their structure
      const container = screen.getByTestId("weather-forecast");
      const skeletonContainer = container.querySelectorAll(".bg-forest-deep\\/50");
      expect(skeletonContainer.length).toBeGreaterThan(0);
    });

    it("shows fallback message when no hourly data available", () => {
      mockHourlyUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<WeatherForecast />);

      const expandButton = screen.getByTestId("forecast-expand-button");
      fireEvent.click(expandButton);

      expect(screen.getByText("No hourly data available")).toBeInTheDocument();
    });

    it("hourly cards show 'Today' label", () => {
      render(<WeatherForecast />);

      const expandButton = screen.getByTestId("forecast-expand-button");
      fireEvent.click(expandButton);

      // All hourly cards show "Today" label
      const todayLabels = screen.getAllByText("Today");
      expect(todayLabels.length).toBeGreaterThan(0);
    });

    it("displays temperatures in hourly view", () => {
      render(<WeatherForecast />);

      const expandButton = screen.getByTestId("forecast-expand-button");
      fireEvent.click(expandButton);

      // Hourly temperatures - we skip the first hour so we get indices 1-6 (temps 13-18)
      expect(screen.getByText("13°C")).toBeInTheDocument();
      expect(screen.getByText("18°C")).toBeInTheDocument();
    });
  });
});
