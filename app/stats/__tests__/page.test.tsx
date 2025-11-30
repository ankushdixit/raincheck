import { render, screen } from "@testing-library/react";
import StatsPage from "../page";

// Mock the tRPC api
jest.mock("@/lib/api", () => ({
  api: {
    stats: {
      getSummary: {
        useQuery: () => ({
          data: {
            totalRuns: 24,
            totalDistance: 156.5,
            avgPace: "6:15",
            streak: 3,
            longestRun: 21.1,
          },
          isLoading: false,
          error: null,
        }),
      },
      getWeeklyMileage: {
        useQuery: () => ({
          data: [
            {
              week: "Week 1",
              weekStart: new Date("2025-11-23"),
              mileage: 25.5,
              target: 30,
              isCurrentWeek: true,
            },
          ],
          isLoading: false,
          error: null,
        }),
      },
      getCompletionRate: {
        useQuery: () => ({
          data: {
            total: 30,
            completed: 24,
            rate: 80,
            byPhase: [],
          },
          isLoading: false,
          error: null,
        }),
      },
    },
  },
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ArrowLeft: () => <svg data-testid="arrow-left-icon" />,
  BarChart3: () => <svg data-testid="bar-chart-icon" />,
  Route: () => <svg data-testid="route-icon" />,
  Timer: () => <svg data-testid="timer-icon" />,
  Flame: () => <svg data-testid="flame-icon" />,
  Trophy: () => <svg data-testid="trophy-icon" />,
}));

// Mock Next.js Link
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

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

describe("StatsPage", () => {
  describe("layout structure", () => {
    it("renders the page with header", () => {
      render(<StatsPage />);

      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("displays the page title", () => {
      render(<StatsPage />);

      expect(screen.getByText("Training Stats")).toBeInTheDocument();
    });

    it("renders back navigation link", () => {
      render(<StatsPage />);

      const backLink = screen.getByText("Back to Dashboard");
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest("a")).toHaveAttribute("href", "/");
    });

    it("renders arrow left icon in back link", () => {
      render(<StatsPage />);

      expect(screen.getByTestId("arrow-left-icon")).toBeInTheDocument();
    });

    it("renders bar chart icon in header", () => {
      render(<StatsPage />);

      expect(screen.getAllByTestId("bar-chart-icon").length).toBeGreaterThan(0);
    });
  });

  describe("stats sections", () => {
    it("renders Summary section heading", () => {
      render(<StatsPage />);

      expect(screen.getByText("Summary")).toBeInTheDocument();
    });

    it("renders Weekly Mileage section heading", () => {
      render(<StatsPage />);

      expect(screen.getByText("Weekly Mileage")).toBeInTheDocument();
    });

    it("renders Completion section heading", () => {
      render(<StatsPage />);

      expect(screen.getByText("Completion")).toBeInTheDocument();
    });

    it("renders summary cards", () => {
      render(<StatsPage />);

      expect(screen.getByTestId("summary-cards")).toBeInTheDocument();
    });

    it("renders completion rate card", () => {
      render(<StatsPage />);

      expect(screen.getByTestId("completion-rate-card")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("has dark background on main element", () => {
      render(<StatsPage />);

      const main = screen.getByRole("main");
      expect(main).toHaveClass("min-h-screen");
      expect(main).toHaveClass("bg-[#0a0f0a]");
    });

    it("header is sticky", () => {
      render(<StatsPage />);

      const header = screen.getByRole("banner");
      expect(header).toHaveClass("sticky");
      expect(header).toHaveClass("top-0");
    });

    it("content has max-width constraint", () => {
      const { container } = render(<StatsPage />);

      const contentWrapper = container.querySelector(".max-w-6xl");
      expect(contentWrapper).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading hierarchy", () => {
      render(<StatsPage />);

      // h1 for page title
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent("Training Stats");

      // h2 for sections
      const h2s = screen.getAllByRole("heading", { level: 2 });
      expect(h2s.length).toBeGreaterThanOrEqual(3);
    });

    it("back link has descriptive text", () => {
      render(<StatsPage />);

      const backLink = screen.getByRole("link", { name: /back to dashboard/i });
      expect(backLink).toBeInTheDocument();
    });
  });
});
