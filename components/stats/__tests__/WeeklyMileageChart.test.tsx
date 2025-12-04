import { render, screen } from "@testing-library/react";
import { WeeklyMileageChart } from "../WeeklyMileageChart";

// Mock the tRPC api
const mockWeeklyMileageQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    stats: {
      getWeeklyMileage: {
        useQuery: (input: { weeks?: number }) => mockWeeklyMileageQuery(input),
      },
    },
  },
}));

// Sample data
const mockWeeklyData = [
  {
    week: "Week 1",
    weekStart: new Date("2025-11-23"),
    mileage: 25.5,
    target: 30,
    isCurrentWeek: false,
  },
  {
    week: "Week 2",
    weekStart: new Date("2025-11-30"),
    mileage: 32.1,
    target: 35,
    isCurrentWeek: true,
  },
  {
    week: "Week 3",
    weekStart: new Date("2025-12-07"),
    mileage: 0,
    target: 40,
    isCurrentWeek: false,
  },
];

describe("WeeklyMileageChart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loading state", () => {
    it("displays loading spinner while fetching data", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { container } = render(<WeeklyMileageChart />);

      // Should show spinner (animate-spin class)
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("displays error message when fetch fails", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      render(<WeeklyMileageChart />);

      expect(screen.getByText("Failed to load mileage data")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("displays empty message when no data provided", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<WeeklyMileageChart />);

      expect(screen.getByText("No mileage data available yet")).toBeInTheDocument();
    });

    it("displays empty message when data is undefined", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      render(<WeeklyMileageChart />);

      expect(screen.getByText("No mileage data available yet")).toBeInTheDocument();
    });
  });

  describe("success state with data", () => {
    beforeEach(() => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: mockWeeklyData,
        isLoading: false,
        error: null,
      });
    });

    it("renders the chart with legend", () => {
      render(<WeeklyMileageChart />);

      // Should have legend items
      expect(screen.getByText("Actual")).toBeInTheDocument();
      expect(screen.getByText("Target")).toBeInTheDocument();
    });

    it("renders week labels", () => {
      render(<WeeklyMileageChart />);

      // Week labels should be rendered (shortened format)
      expect(screen.getByText("W1")).toBeInTheDocument();
      expect(screen.getByText("W2")).toBeInTheDocument();
      expect(screen.getByText("W3")).toBeInTheDocument();
    });

    it("data is passed to the query correctly", () => {
      render(<WeeklyMileageChart />);

      // Verify that the query was called with default weeks
      expect(mockWeeklyMileageQuery).toHaveBeenCalledWith({ weeks: 12 });
    });
  });

  describe("props", () => {
    it("uses default weeks (12) when not specified", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: mockWeeklyData,
        isLoading: false,
        error: null,
      });

      render(<WeeklyMileageChart />);

      expect(mockWeeklyMileageQuery).toHaveBeenCalledWith({ weeks: 12 });
    });
  });

  describe("chart dimensions", () => {
    it("chart container has fixed height", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: mockWeeklyData,
        isLoading: false,
        error: null,
      });

      const { container } = render(<WeeklyMileageChart />);

      const chartContainer = container.firstChild;
      // Chart uses h-full with min-h-[250px] for flexible height
      expect(chartContainer).toHaveClass("h-full");
      expect(chartContainer).toHaveClass("min-h-[250px]");
    });
  });
});
