import { render, screen, fireEvent } from "@testing-library/react";
import { CurrentWeather } from "../CurrentWeather";

// Mock the tRPC api
const mockRefetch = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    weather: {
      getCurrentWeather: {
        useQuery: () => mockUseQuery(),
      },
    },
  },
}));

// Sample weather data
const mockWeatherData = {
  location: "Balbriggan, Ireland",
  latitude: 53.6108,
  longitude: -6.1817,
  datetime: new Date("2024-01-15T12:00:00Z"),
  condition: "Partly cloudy",
  description: "Partly cloudy",
  temperature: 12.5,
  feelsLike: 10.2,
  precipitation: 20,
  humidity: 75,
  windSpeed: 15.3,
  windDirection: 180,
};

describe("CurrentWeather", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue({ data: mockWeatherData });
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

      render(<CurrentWeather />);

      expect(screen.getByTestId("weather-skeleton")).toBeInTheDocument();
    });

    it("skeleton has animate-pulse class for animation", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<CurrentWeather />);

      const skeleton = screen.getByTestId("weather-skeleton");
      const animatedElement = skeleton.querySelector(".animate-pulse");
      expect(animatedElement).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockWeatherData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    it("displays weather card when data loads", () => {
      render(<CurrentWeather />);

      expect(screen.getByTestId("weather-card")).toBeInTheDocument();
    });

    it("displays temperature in Celsius with degree symbol", () => {
      render(<CurrentWeather />);

      expect(screen.getByText("13°C")).toBeInTheDocument(); // 12.5 rounds to 13
    });

    it("displays precipitation percentage", () => {
      render(<CurrentWeather />);

      expect(screen.getByText("20%")).toBeInTheDocument();
    });

    it("displays wind speed in km/h", () => {
      render(<CurrentWeather />);

      expect(screen.getByText("15 km/h")).toBeInTheDocument(); // 15.3 rounds to 15
    });

    it("displays location name", () => {
      render(<CurrentWeather />);

      expect(screen.getByText("Balbriggan, Ireland")).toBeInTheDocument();
    });

    it("displays weather icon matching condition", () => {
      render(<CurrentWeather />);

      // Partly cloudy should show sun behind cloud
      expect(screen.getByRole("img", { name: "Partly cloudy" })).toBeInTheDocument();
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
      render(<CurrentWeather />);

      expect(screen.getByTestId("weather-error")).toBeInTheDocument();
      expect(screen.getByText("Unable to load weather")).toBeInTheDocument();
    });

    it("displays retry button on error", () => {
      render(<CurrentWeather />);

      expect(screen.getByTestId("retry-button")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    it("retry button triggers refetch when clicked", async () => {
      render(<CurrentWeather />);

      const retryButton = screen.getByTestId("retry-button");
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it("shows loading state on retry button while retrying", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
        isFetching: true, // Refetching
      });

      render(<CurrentWeather />);

      const retryButton = screen.getByTestId("retry-button");
      expect(retryButton).toHaveTextContent("Retrying...");
      expect(retryButton).toBeDisabled();
    });
  });

  describe("edge cases", () => {
    it("shows error state when data is null", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<CurrentWeather />);

      expect(screen.getByTestId("weather-error")).toBeInTheDocument();
    });

    it("rounds temperature values correctly", () => {
      mockUseQuery.mockReturnValue({
        data: { ...mockWeatherData, temperature: 12.4 },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<CurrentWeather />);

      expect(screen.getByText("12°C")).toBeInTheDocument();
    });
  });
});
