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

// Mock recharts ResponsiveContainer to avoid resize observer issues
jest.mock("recharts", () => {
  const OriginalModule = jest.requireActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 350 }}>{children}</div>
    ),
  };
});

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
    it("displays loading skeleton while fetching data", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<WeeklyMileageChart />);

      expect(screen.getByTestId("chart-skeleton")).toBeInTheDocument();
    });

    it("skeleton has animate-pulse class", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<WeeklyMileageChart />);

      const skeleton = screen.getByTestId("chart-skeleton");
      expect(skeleton).toHaveClass("animate-pulse");
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

      expect(screen.getByTestId("error-state")).toBeInTheDocument();
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

      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.getByText("No mileage data available yet")).toBeInTheDocument();
    });

    it("displays empty message when data is undefined", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      render(<WeeklyMileageChart />);

      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
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

    it("renders the chart container", () => {
      render(<WeeklyMileageChart />);

      // Chart should be rendered (ResponsiveContainer is mocked)
      expect(screen.queryByTestId("chart-skeleton")).not.toBeInTheDocument();
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
      expect(screen.queryByTestId("error-state")).not.toBeInTheDocument();
    });

    it("renders the recharts wrapper", () => {
      const { container } = render(<WeeklyMileageChart />);

      // Recharts creates a wrapper div with class "recharts-wrapper"
      const rechartsWrapper = container.querySelector(".recharts-wrapper");
      expect(rechartsWrapper).toBeInTheDocument();
    });

    it("data is passed to the query correctly", () => {
      render(<WeeklyMileageChart />);

      // Verify that the query was called
      expect(mockWeeklyMileageQuery).toHaveBeenCalled();
      // The component should not show loading/empty/error states
      expect(screen.queryByTestId("chart-skeleton")).not.toBeInTheDocument();
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });
  });

  describe("props", () => {
    it("uses default weeks when not specified", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: mockWeeklyData,
        isLoading: false,
        error: null,
      });

      render(<WeeklyMileageChart />);

      expect(mockWeeklyMileageQuery).toHaveBeenCalledWith({ weeks: 12 });
    });

    it("passes custom weeks prop to query", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: mockWeeklyData,
        isLoading: false,
        error: null,
      });

      render(<WeeklyMileageChart weeks={8} />);

      expect(mockWeeklyMileageQuery).toHaveBeenCalledWith({ weeks: 8 });
    });
  });

  describe("responsiveness", () => {
    it("chart container has responsive height classes", () => {
      mockWeeklyMileageQuery.mockReturnValue({
        data: mockWeeklyData,
        isLoading: false,
        error: null,
      });

      const { container } = render(<WeeklyMileageChart />);

      const chartContainer = container.firstChild;
      expect(chartContainer).toHaveClass("h-[250px]");
      expect(chartContainer).toHaveClass("md:h-[300px]");
      expect(chartContainer).toHaveClass("lg:h-[350px]");
    });
  });
});
