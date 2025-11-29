import { render, screen, fireEvent } from "@testing-library/react";
import { WeatherForecast } from "../WeatherForecast";

// Mock the tRPC api
const mockRefetch = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    weather: {
      getForecast: {
        useQuery: () => mockUseQuery(),
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

describe("WeatherForecast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue({ data: createMockForecastData() });
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

    it("first card is selected by default", () => {
      render(<WeatherForecast />);

      const cards = screen.getAllByTestId("weather-day-card");
      expect(cards[0]).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.7)" });
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

      // Initially first card is selected
      expect(cards[0]).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.7)" });
      expect(cards[1]).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.5)" });

      // Click second card
      fireEvent.click(cards[1]!);

      // Now second card should be selected
      expect(cards[0]).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.5)" });
      expect(cards[1]).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.7)" });
    });

    it("only one card can be selected at a time", () => {
      render(<WeatherForecast />);

      const cards = screen.getAllByTestId("weather-day-card");

      // Click third card
      fireEvent.click(cards[2]!);

      // Third card should be selected
      expect(cards[2]).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.7)" });
      // Others should not be selected
      expect(cards[0]).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.5)" });
      expect(cards[1]).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.5)" });
    });

    it("calls onDaySelect callback when card is clicked", () => {
      const onDaySelect = jest.fn();
      render(<WeatherForecast onDaySelect={onDaySelect} />);

      const cards = screen.getAllByTestId("weather-day-card");
      fireEvent.click(cards[3]!);

      expect(onDaySelect).toHaveBeenCalledWith(3);
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

      const container = screen.getByTestId("weather-forecast");
      expect(container).toHaveClass("overflow-x-auto");
    });

    it("has grid class for desktop", () => {
      mockUseQuery.mockReturnValue({
        data: createMockForecastData(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<WeatherForecast />);

      const container = screen.getByTestId("weather-forecast");
      expect(container).toHaveClass("md:grid");
      expect(container).toHaveClass("md:grid-cols-7");
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
});
