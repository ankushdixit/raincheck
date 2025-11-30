import { render, screen } from "@testing-library/react";
import { CompletionRateCard } from "../CompletionRateCard";

// Mock the tRPC api
const mockCompletionRateQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    stats: {
      getCompletionRate: {
        useQuery: () => mockCompletionRateQuery(),
      },
    },
  },
}));

// Sample data
const mockCompletionData = {
  total: 30,
  completed: 24,
  rate: 80,
  byPhase: [],
};

describe("CompletionRateCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loading state", () => {
    it("displays loading skeleton while fetching data", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<CompletionRateCard />);

      expect(screen.getByTestId("completion-skeleton")).toBeInTheDocument();
    });

    it("skeleton has animate-pulse class", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<CompletionRateCard />);

      const skeleton = screen.getByTestId("completion-skeleton");
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  describe("error state", () => {
    it("displays error message when fetch fails", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      render(<CompletionRateCard />);

      expect(screen.getByTestId("completion-error-state")).toBeInTheDocument();
      expect(screen.getByText("Failed to load completion rate")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("displays empty message when total is 0", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: { total: 0, completed: 0, rate: 0, byPhase: [] },
        isLoading: false,
        error: null,
      });

      render(<CompletionRateCard />);

      expect(screen.getByTestId("completion-empty-state")).toBeInTheDocument();
      expect(screen.getByText(/No runs scheduled yet/)).toBeInTheDocument();
    });

    it("displays empty message when data is undefined", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      render(<CompletionRateCard />);

      expect(screen.getByTestId("completion-empty-state")).toBeInTheDocument();
    });
  });

  describe("success state with data", () => {
    beforeEach(() => {
      mockCompletionRateQuery.mockReturnValue({
        data: mockCompletionData,
        isLoading: false,
        error: null,
      });
    });

    it("renders the completion rate card", () => {
      render(<CompletionRateCard />);

      expect(screen.getByTestId("completion-rate-card")).toBeInTheDocument();
    });

    it("displays the completion percentage", () => {
      render(<CompletionRateCard />);

      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("displays the completion label", () => {
      render(<CompletionRateCard />);

      expect(screen.getByText("Completion Rate")).toBeInTheDocument();
    });

    it("displays completed/total count", () => {
      render(<CompletionRateCard />);

      expect(screen.getByText("24 of 30 runs completed")).toBeInTheDocument();
    });

    it("renders circular progress SVG", () => {
      const { container } = render(<CompletionRateCard />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();

      // Should have two circles - background and progress
      const circles = svg?.querySelectorAll("circle");
      expect(circles?.length).toBe(2);
    });
  });

  describe("circular progress", () => {
    it("renders correct stroke colors", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: mockCompletionData,
        isLoading: false,
        error: null,
      });

      const { container } = render(<CompletionRateCard />);

      const circles = container.querySelectorAll("circle");
      // Background circle
      expect(circles[0]).toHaveAttribute("stroke", "#2a4a2a");
      // Progress circle
      expect(circles[1]).toHaveAttribute("stroke", "#ffa726");
    });

    it("progress circle has transition class", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: mockCompletionData,
        isLoading: false,
        error: null,
      });

      const { container } = render(<CompletionRateCard />);

      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle).toHaveClass("transition-all");
    });
  });

  describe("edge cases", () => {
    it("handles 0% completion rate", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: { total: 10, completed: 0, rate: 0, byPhase: [] },
        isLoading: false,
        error: null,
      });

      render(<CompletionRateCard />);

      expect(screen.getByText("0%")).toBeInTheDocument();
      expect(screen.getByText("0 of 10 runs completed")).toBeInTheDocument();
    });

    it("handles 100% completion rate", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: { total: 20, completed: 20, rate: 100, byPhase: [] },
        isLoading: false,
        error: null,
      });

      render(<CompletionRateCard />);

      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("20 of 20 runs completed")).toBeInTheDocument();
    });
  });
});
