import { render, screen } from "@testing-library/react";
import { StatsSummaryCard } from "../StatsSummaryCard";

// Mock the tRPC api
const mockSummaryQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    stats: {
      getSummary: {
        useQuery: () => mockSummaryQuery(),
      },
    },
  },
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Route: () => <svg data-testid="route-icon" />,
  Timer: () => <svg data-testid="timer-icon" />,
  Flame: () => <svg data-testid="flame-icon" />,
  Trophy: () => <svg data-testid="trophy-icon" />,
}));

// Sample data
const mockSummaryData = {
  totalRuns: 24,
  totalDistance: 156.5,
  avgPace: "6:15",
  streak: 3,
  longestRun: 21.1,
};

describe("StatsSummaryCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loading state", () => {
    it("displays loading skeleton while fetching data", () => {
      mockSummaryQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<StatsSummaryCard />);

      expect(screen.getByTestId("summary-skeleton")).toBeInTheDocument();
    });

    it("skeleton has animate-pulse on each card", () => {
      mockSummaryQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<StatsSummaryCard />);

      const skeleton = screen.getByTestId("summary-skeleton");
      const cards = skeleton.querySelectorAll(".animate-pulse");
      expect(cards.length).toBe(4);
    });
  });

  describe("error state", () => {
    it("displays error message when fetch fails", () => {
      mockSummaryQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      render(<StatsSummaryCard />);

      expect(screen.getByTestId("summary-error-state")).toBeInTheDocument();
      expect(screen.getByText("Failed to load summary statistics")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("displays empty message when no data provided", () => {
      mockSummaryQuery.mockReturnValue({
        data: { totalRuns: 0, totalDistance: 0, avgPace: "", streak: 0, longestRun: 0 },
        isLoading: false,
        error: null,
      });

      render(<StatsSummaryCard />);

      expect(screen.getByTestId("summary-empty-state")).toBeInTheDocument();
      expect(screen.getByText(/No training data available/)).toBeInTheDocument();
    });

    it("displays empty message when data is undefined", () => {
      mockSummaryQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      render(<StatsSummaryCard />);

      expect(screen.getByTestId("summary-empty-state")).toBeInTheDocument();
    });
  });

  describe("success state with data", () => {
    beforeEach(() => {
      mockSummaryQuery.mockReturnValue({
        data: mockSummaryData,
        isLoading: false,
        error: null,
      });
    });

    it("renders the summary cards container", () => {
      render(<StatsSummaryCard />);

      expect(screen.getByTestId("summary-cards")).toBeInTheDocument();
    });

    it("displays total runs", () => {
      render(<StatsSummaryCard />);

      expect(screen.getByText("Total Runs")).toBeInTheDocument();
      expect(screen.getByText("24 runs")).toBeInTheDocument();
    });

    it("displays total distance formatted with 1 decimal", () => {
      render(<StatsSummaryCard />);

      expect(screen.getByText("Total Distance")).toBeInTheDocument();
      expect(screen.getByText("156.5 km")).toBeInTheDocument();
    });

    it("displays average pace with /km suffix", () => {
      render(<StatsSummaryCard />);

      expect(screen.getByText("Average Pace")).toBeInTheDocument();
      expect(screen.getByText("6:15 /km")).toBeInTheDocument();
    });

    it("displays current streak", () => {
      render(<StatsSummaryCard />);

      expect(screen.getByText("Current Streak")).toBeInTheDocument();
      expect(screen.getByText("3 days")).toBeInTheDocument();
    });

    it("renders all icons", () => {
      render(<StatsSummaryCard />);

      expect(screen.getByTestId("route-icon")).toBeInTheDocument();
      expect(screen.getByTestId("trophy-icon")).toBeInTheDocument();
      expect(screen.getByTestId("timer-icon")).toBeInTheDocument();
      expect(screen.getByTestId("flame-icon")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("formats pace as --:-- when empty", () => {
      mockSummaryQuery.mockReturnValue({
        data: {
          totalRuns: 5,
          totalDistance: 25,
          avgPace: "",
          streak: 1,
          longestRun: 10,
        },
        isLoading: false,
        error: null,
      });

      render(<StatsSummaryCard />);

      expect(screen.getByText("--:--")).toBeInTheDocument();
    });

    it("handles 0 streak correctly", () => {
      mockSummaryQuery.mockReturnValue({
        data: {
          totalRuns: 5,
          totalDistance: 25,
          avgPace: "5:30",
          streak: 0,
          longestRun: 10,
        },
        isLoading: false,
        error: null,
      });

      render(<StatsSummaryCard />);

      expect(screen.getByText("0 days")).toBeInTheDocument();
    });
  });

  describe("responsiveness", () => {
    it("has responsive grid layout classes", () => {
      mockSummaryQuery.mockReturnValue({
        data: mockSummaryData,
        isLoading: false,
        error: null,
      });

      render(<StatsSummaryCard />);

      const container = screen.getByTestId("summary-cards");
      expect(container).toHaveClass("grid-cols-2");
      expect(container).toHaveClass("md:grid-cols-4");
    });
  });
});
