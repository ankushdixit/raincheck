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

      const { container } = render(<CompletionRateCard />);

      // Should show skeleton with animate-pulse
      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
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

      expect(screen.getByText("Failed to load completion rate")).toBeInTheDocument();
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

    it("displays the completion percentage in circular progress", () => {
      render(<CompletionRateCard />);

      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("displays completed count", () => {
      render(<CompletionRateCard />);

      expect(screen.getByText("Completed")).toBeInTheDocument();
      expect(screen.getByText("24")).toBeInTheDocument();
    });

    it("displays scheduled (total) count", () => {
      render(<CompletionRateCard />);

      expect(screen.getByText("Scheduled")).toBeInTheDocument();
      expect(screen.getByText("30")).toBeInTheDocument();
    });

    it("displays missed count", () => {
      render(<CompletionRateCard />);

      expect(screen.getByText("Missed")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument(); // 30 - 24 = 6
    });

    it("renders circular progress SVG", () => {
      const { container } = render(<CompletionRateCard />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();

      // Should have two circles - background and progress
      const circles = svg?.querySelectorAll("circle");
      expect(circles?.length).toBe(2);
    });

    it("shows on track status when rate >= 80%", () => {
      render(<CompletionRateCard />);

      expect(screen.getByText("On Track")).toBeInTheDocument();
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
      // Completed shows 0, scheduled and missed both show 10
      expect(screen.getAllByText("0")).toHaveLength(1); // completed
      expect(screen.getAllByText("10")).toHaveLength(2); // scheduled & missed
    });

    it("handles 100% completion rate", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: { total: 20, completed: 20, rate: 100, byPhase: [] },
        isLoading: false,
        error: null,
      });

      render(<CompletionRateCard />);

      expect(screen.getByText("100%")).toBeInTheDocument();
      // Both completed and scheduled show 20, so we check they exist
      expect(screen.getAllByText("20")).toHaveLength(2);
      // Missed should be 0
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("shows needs attention when rate < 80%", () => {
      mockCompletionRateQuery.mockReturnValue({
        data: { total: 20, completed: 10, rate: 50, byPhase: [] },
        isLoading: false,
        error: null,
      });

      render(<CompletionRateCard />);

      expect(screen.getByText("Needs Attention")).toBeInTheDocument();
    });
  });
});
