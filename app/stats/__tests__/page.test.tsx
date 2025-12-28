import { render, screen } from "@testing-library/react";
import StatsPage from "../page";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));

// Mock Next.js Link
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock stats components
jest.mock("@/components/stats", () => ({
  SummaryStatsRow: () => <div data-testid="summary-stats-row">Summary Stats</div>,
  WeeklyMileageChart: () => <div data-testid="weekly-mileage-chart">Weekly Mileage</div>,
  TrainingProgressCard: () => <div data-testid="training-progress-card">Training Progress</div>,
  CompletionRateCard: () => <div data-testid="completion-rate-card">Completion Rate</div>,
  PaceProgressionChart: () => <div data-testid="pace-progression-chart">Pace Progression</div>,
  LongRunProgressionChart: () => (
    <div data-testid="long-run-progression-chart">Long Run Progression</div>
  ),
  RunTypeLegend: () => <div data-testid="run-type-legend">Run Type Legend</div>,
}));

// Mock tRPC api
jest.mock("@/lib/api", () => ({
  api: {
    weather: {
      getCurrentWeather: {
        useQuery: () => ({
          data: {
            condition: "sunny",
            temperature: 15,
            precipitation: 0,
            windSpeed: 10,
            location: "Dublin, IE",
          },
          isLoading: false,
        }),
      },
    },
  },
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ArrowLeft: () => <svg data-testid="arrow-left-icon" />,
}));

describe("StatsPage", () => {
  describe("layout structure", () => {
    it("renders the page with main element", () => {
      render(<StatsPage />);
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("renders the logo", () => {
      render(<StatsPage />);
      expect(screen.getByAltText("RainCheck")).toBeInTheDocument();
    });

    it("displays Training Statistics subtitle", () => {
      render(<StatsPage />);
      expect(screen.getByText("Training Statistics")).toBeInTheDocument();
    });

    it("renders back navigation link", () => {
      render(<StatsPage />);
      const backLink = screen.getByText("Back to Dashboard");
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest("a")).toHaveAttribute("href", "/");
    });
  });

  describe("stats sections", () => {
    it("renders summary stats row", () => {
      render(<StatsPage />);
      expect(screen.getByTestId("summary-stats-row")).toBeInTheDocument();
    });

    it("renders weekly mileage section", () => {
      render(<StatsPage />);
      expect(screen.getByText("WEEKLY MILEAGE")).toBeInTheDocument();
      expect(screen.getByTestId("weekly-mileage-chart")).toBeInTheDocument();
    });

    it("renders training progress section", () => {
      render(<StatsPage />);
      expect(screen.getByText("TRAINING PROGRESS")).toBeInTheDocument();
      expect(screen.getByTestId("training-progress-card")).toBeInTheDocument();
    });

    it("renders completion rate section", () => {
      render(<StatsPage />);
      expect(screen.getByText("COMPLETION RATE")).toBeInTheDocument();
      expect(screen.getByTestId("completion-rate-card")).toBeInTheDocument();
    });

    it("renders pace progression section", () => {
      render(<StatsPage />);
      expect(screen.getByText("PACE PROGRESSION")).toBeInTheDocument();
      expect(screen.getByTestId("pace-progression-chart")).toBeInTheDocument();
    });

    it("renders long run progression section", () => {
      render(<StatsPage />);
      expect(screen.getByText("LONG RUN PROGRESSION")).toBeInTheDocument();
      expect(screen.getByTestId("long-run-progression-chart")).toBeInTheDocument();
    });

    it("renders run type legend", () => {
      render(<StatsPage />);
      expect(screen.getByTestId("run-type-legend")).toBeInTheDocument();
    });
  });

  describe("weather info", () => {
    it("displays weather location", () => {
      render(<StatsPage />);
      expect(screen.getByText("Dublin, IE")).toBeInTheDocument();
    });

    it("displays weather temperature", () => {
      render(<StatsPage />);
      // Temperature is displayed as "15°C | 0% | 10 km/h"
      expect(screen.getByText(/15°C/)).toBeInTheDocument();
    });
  });

  describe("immersive styling", () => {
    it("has immersive full-width layout", () => {
      render(<StatsPage />);
      const main = screen.getByRole("main");
      expect(main).toHaveClass("relative");
      expect(main).toHaveClass("min-h-screen");
      expect(main).toHaveClass("w-full");
    });

    it("renders dark background", () => {
      render(<StatsPage />);
      const main = screen.getByRole("main");
      const background = main.querySelector(".bg-forest-deep");
      expect(background).toBeInTheDocument();
    });
  });
});
