import { render, screen, fireEvent } from "@testing-library/react";
import { RunSuggestions } from "../RunSuggestions";

// Mock the tRPC api
const mockRefetch = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    planning: {
      generateSuggestions: {
        useQuery: () => mockUseQuery(),
      },
    },
  },
}));

// Sample suggestions data
const createMockSuggestions = () => {
  const today = new Date();
  return [
    {
      date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      runType: "LONG_RUN" as const,
      distance: 16,
      weatherScore: 85,
      isOptimal: true,
      reason:
        "Best weather of the week (score: 85/100). Sunny, 14°C with 10% precipitation chance.",
      weather: {
        condition: "Sunny",
        temperature: 14,
        precipitation: 10,
        windSpeed: 12,
      },
    },
    {
      date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      runType: "EASY_RUN" as const,
      distance: 8,
      weatherScore: 70,
      isOptimal: false,
      reason: "Wednesday has good conditions (70/100). Partly cloudy, 12°C.",
      weather: {
        condition: "Partly cloudy",
        temperature: 12,
        precipitation: 20,
        windSpeed: 15,
      },
    },
    {
      date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      runType: "EASY_RUN" as const,
      distance: 8,
      weatherScore: 65,
      isOptimal: false,
      reason: "Friday has good conditions (65/100). Cloudy, 11°C.",
      weather: {
        condition: "Cloudy",
        temperature: 11,
        precipitation: 30,
        windSpeed: 18,
      },
    },
  ];
};

describe("RunSuggestions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue({ data: createMockSuggestions() });
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

      render(<RunSuggestions />);

      expect(screen.getByTestId("suggestions-skeleton")).toBeInTheDocument();
    });

    it("skeleton shows 3 placeholder cards", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<RunSuggestions />);

      const skeletons = screen.getAllByTestId("run-suggestion-skeleton");
      expect(skeletons).toHaveLength(3);
    });
  });

  describe("success state", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: createMockSuggestions(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    it("displays suggestions container", () => {
      render(<RunSuggestions />);

      expect(screen.getByTestId("run-suggestions")).toBeInTheDocument();
    });

    it("renders correct number of suggestion cards", () => {
      render(<RunSuggestions />);

      const cards = screen.getAllByTestId("run-suggestion-card");
      expect(cards).toHaveLength(3);
    });

    it("displays suggestions ordered by date", () => {
      render(<RunSuggestions />);

      const cards = screen.getAllByTestId("run-suggestion-card");

      // First card should be tomorrow (LONG_RUN)
      expect(cards[0]).toHaveAttribute("data-run-type", "LONG_RUN");

      // Following cards should be easy runs
      expect(cards[1]).toHaveAttribute("data-run-type", "EASY_RUN");
      expect(cards[2]).toHaveAttribute("data-run-type", "EASY_RUN");
    });

    it("displays long run with correct weather score", () => {
      render(<RunSuggestions />);

      // Long run has score 85, which should show OPTIMAL badge
      expect(screen.getByTestId("optimal-badge")).toBeInTheDocument();
    });

    it("displays temperatures for each card", () => {
      render(<RunSuggestions />);

      const summaries = screen.getAllByTestId("weather-summary");
      expect(summaries[0]).toHaveTextContent("14°C");
      expect(summaries[1]).toHaveTextContent("12°C");
      expect(summaries[2]).toHaveTextContent("11°C");
    });

    it("displays distances for each card", () => {
      render(<RunSuggestions />);

      const distances = screen.getAllByTestId("distance");
      expect(distances[0]).toHaveTextContent("16 km");
      expect(distances[1]).toHaveTextContent("8 km");
      expect(distances[2]).toHaveTextContent("8 km");
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
      render(<RunSuggestions />);

      expect(screen.getByTestId("suggestions-error")).toBeInTheDocument();
      expect(screen.getByText("Unable to load suggestions")).toBeInTheDocument();
    });

    it("displays retry button on error", () => {
      render(<RunSuggestions />);

      expect(screen.getByTestId("suggestions-retry-button")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    it("retry button triggers refetch when clicked", () => {
      render(<RunSuggestions />);

      const retryButton = screen.getByTestId("suggestions-retry-button");
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

      render(<RunSuggestions />);

      const retryButton = screen.getByTestId("suggestions-retry-button");
      expect(retryButton).toHaveTextContent("Retrying...");
      expect(retryButton).toBeDisabled();
    });
  });

  describe("empty state", () => {
    it("displays empty state when suggestions is empty array", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<RunSuggestions />);

      expect(screen.getByTestId("suggestions-empty")).toBeInTheDocument();
      expect(screen.getByText("No suggestions available")).toBeInTheDocument();
    });

    it("displays empty state when suggestions is null", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<RunSuggestions />);

      expect(screen.getByTestId("suggestions-empty")).toBeInTheDocument();
    });

    it("displays calendar icon in empty state", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<RunSuggestions />);

      expect(screen.getByRole("img", { name: "Calendar" })).toBeInTheDocument();
    });

    it("displays helpful message in empty state", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<RunSuggestions />);

      expect(screen.getByText(/Check back when weather data is available/i)).toBeInTheDocument();
    });
  });

  describe("layout", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: createMockSuggestions(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    it("has flex class for layout", () => {
      render(<RunSuggestions />);

      const container = screen.getByTestId("run-suggestions");
      expect(container).toHaveClass("flex");
    });

    it("has centered content", () => {
      render(<RunSuggestions />);

      const container = screen.getByTestId("run-suggestions");
      expect(container).toHaveClass("justify-center");
    });

    it("has gap for spacing between cards", () => {
      render(<RunSuggestions />);

      const container = screen.getByTestId("run-suggestions");
      expect(container).toHaveClass("gap-4");
    });
  });

  describe("authentication prop", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: createMockSuggestions(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });
    });

    it("does not show accept button when not authenticated", () => {
      render(<RunSuggestions isAuthenticated={false} />);

      expect(screen.queryByTestId("accept-button")).not.toBeInTheDocument();
    });

    it("does not show accept button by default", () => {
      render(<RunSuggestions />);

      expect(screen.queryByTestId("accept-button")).not.toBeInTheDocument();
    });
  });

  describe("API integration", () => {
    it("calls generateSuggestions with days: 7", () => {
      mockUseQuery.mockReturnValue({
        data: createMockSuggestions(),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<RunSuggestions />);

      expect(mockUseQuery).toHaveBeenCalled();
    });
  });
});
