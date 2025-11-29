import { render, screen } from "@testing-library/react";
import { TrainingCalendar, TrainingCalendarSkeleton } from "../TrainingCalendar";
import type { Run, RunType } from "@prisma/client";

// Mock the tRPC api
const mockUseQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    runs: {
      getByDateRange: {
        useQuery: (input: { startDate: Date; endDate: Date }) => mockUseQuery(input),
      },
    },
  },
}));

// Helper to create mock runs
const createMockRun = (overrides?: Partial<Run>): Run => ({
  id: `run-${Math.random().toString(36).substring(7)}`,
  date: new Date(),
  distance: 10,
  pace: "5:30",
  duration: "55:00",
  type: "EASY_RUN" as RunType,
  notes: null,
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to get current month's date with specific day
const getDateInCurrentMonth = (day: number): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day);
};

describe("TrainingCalendar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loading state", () => {
    it("displays loading skeleton while fetching", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<TrainingCalendar />);

      expect(screen.getByTestId("calendar-skeleton")).toBeInTheDocument();
    });

    it("does not show calendar while loading", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<TrainingCalendar />);

      expect(screen.queryByTestId("training-calendar")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("displays empty state when no runs are scheduled", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      expect(screen.getByTestId("calendar-empty")).toBeInTheDocument();
      expect(screen.getByText("No runs scheduled this month")).toBeInTheDocument();
    });

    it("displays helpful message in empty state", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      expect(
        screen.getByText("Accept suggested runs to add them to your calendar")
      ).toBeInTheDocument();
    });
  });

  describe("calendar structure", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15) })],
        isLoading: false,
      });
    });

    it("renders the calendar container", () => {
      render(<TrainingCalendar />);

      expect(screen.getByTestId("training-calendar")).toBeInTheDocument();
    });

    it("displays the current month and year", () => {
      render(<TrainingCalendar />);

      const monthHeader = screen.getByTestId("calendar-month");
      const now = new Date();
      const expectedMonth = now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      expect(monthHeader).toHaveTextContent(expectedMonth);
    });

    it("displays all day-of-week headers", () => {
      render(<TrainingCalendar />);

      expect(screen.getByText("Sun")).toBeInTheDocument();
      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.getByText("Tue")).toBeInTheDocument();
      expect(screen.getByText("Wed")).toBeInTheDocument();
      expect(screen.getByText("Thu")).toBeInTheDocument();
      expect(screen.getByText("Fri")).toBeInTheDocument();
      expect(screen.getByText("Sat")).toBeInTheDocument();
    });

    it("renders the calendar grid", () => {
      render(<TrainingCalendar />);

      expect(screen.getByTestId("calendar-grid")).toBeInTheDocument();
    });

    it("renders calendar cells", () => {
      render(<TrainingCalendar />);

      // At least some cells should be present
      const cells = screen.getAllByTestId("calendar-cell");
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe("displaying runs", () => {
    it("displays a run on its scheduled date", () => {
      const runDate = getDateInCurrentMonth(15);
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: runDate, type: "EASY_RUN", distance: 8 })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const badge = screen.getByTestId("run-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("Easy");
      expect(badge).toHaveTextContent("8km");
    });

    it("displays multiple runs on different dates", () => {
      mockUseQuery.mockReturnValue({
        data: [
          createMockRun({ date: getDateInCurrentMonth(10), type: "LONG_RUN", distance: 16 }),
          createMockRun({ date: getDateInCurrentMonth(12), type: "EASY_RUN", distance: 8 }),
          createMockRun({ date: getDateInCurrentMonth(14), type: "TEMPO_RUN", distance: 10 }),
        ],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const badges = screen.getAllByTestId("run-badge");
      expect(badges).toHaveLength(3);
    });
  });

  describe("run type colors", () => {
    const runTypeTests: { type: RunType; label: string; color: string }[] = [
      { type: "LONG_RUN", label: "Long", color: "rgba(59, 130, 246, 0.9)" },
      { type: "EASY_RUN", label: "Easy", color: "rgba(34, 197, 94, 0.9)" },
      { type: "TEMPO_RUN", label: "Tempo", color: "rgba(249, 115, 22, 0.9)" },
      { type: "INTERVAL_RUN", label: "Intervals", color: "rgba(168, 85, 247, 0.9)" },
      { type: "RECOVERY_RUN", label: "Recovery", color: "rgba(156, 163, 175, 0.9)" },
      { type: "RACE", label: "Race", color: "rgba(234, 179, 8, 0.9)" },
    ];

    runTypeTests.forEach(({ type, label, color }) => {
      it(`displays ${type} with ${label} label and correct color`, () => {
        mockUseQuery.mockReturnValue({
          data: [createMockRun({ date: getDateInCurrentMonth(15), type, distance: 10 })],
          isLoading: false,
        });

        render(<TrainingCalendar />);

        const badge = screen.getByTestId("run-badge");
        expect(badge).toHaveTextContent(label);
        expect(badge).toHaveAttribute("data-run-type", type);
        expect(badge).toHaveStyle({ backgroundColor: color });
      });
    });
  });

  describe("run badge content", () => {
    it("displays distance in km", () => {
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15), distance: 12.5 })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveTextContent("12.5km");
    });

    it("displays run type abbreviation", () => {
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15), type: "INTERVAL_RUN" })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveTextContent("Intervals");
    });
  });

  describe("today highlight", () => {
    it("highlights today's date", () => {
      const today = new Date();
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: today })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const allCells = screen.getAllByTestId("calendar-cell");
      const todayCell = allCells.find((cell) => cell.getAttribute("data-date") === todayKey);

      // Check for today styling (amber text color for date number and background)
      expect(todayCell).toBeInTheDocument();
      expect(todayCell).toHaveClass("bg-white/10");
    });
  });

  describe("legend", () => {
    it("displays legend when runs are present", () => {
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15) })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      expect(screen.getByTestId("calendar-legend")).toBeInTheDocument();
    });

    it("does not display legend when no runs", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      expect(screen.queryByTestId("calendar-legend")).not.toBeInTheDocument();
    });

    it("legend contains all run type labels", () => {
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15) })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const legend = screen.getByTestId("calendar-legend");
      expect(legend).toHaveTextContent("Long");
      expect(legend).toHaveTextContent("Easy");
      expect(legend).toHaveTextContent("Tempo");
      expect(legend).toHaveTextContent("Intervals");
      expect(legend).toHaveTextContent("Recovery");
      expect(legend).toHaveTextContent("Race");
    });
  });

  describe("API integration", () => {
    it("calls getByDateRange with current month date range", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      expect(mockUseQuery).toHaveBeenCalled();
      const callArgs = mockUseQuery.mock.calls[0][0];
      expect(callArgs).toHaveProperty("startDate");
      expect(callArgs).toHaveProperty("endDate");

      // Verify it's querying the current month
      const now = new Date();
      expect(callArgs.startDate.getMonth()).toBe(now.getMonth());
      expect(callArgs.endDate.getMonth()).toBe(now.getMonth());
    });
  });

  describe("styling", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15) })],
        isLoading: false,
      });
    });

    it("has backdrop blur for glass effect", () => {
      render(<TrainingCalendar />);

      const calendar = screen.getByTestId("training-calendar");
      expect(calendar).toHaveClass("backdrop-blur-md");
    });

    it("has rounded corners", () => {
      render(<TrainingCalendar />);

      const calendar = screen.getByTestId("training-calendar");
      expect(calendar).toHaveClass("rounded-lg");
    });

    it("has dark semi-transparent background", () => {
      render(<TrainingCalendar />);

      const calendar = screen.getByTestId("training-calendar");
      expect(calendar).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.5)" });
    });
  });
});

describe("TrainingCalendarSkeleton", () => {
  it("renders skeleton element", () => {
    render(<TrainingCalendarSkeleton />);

    expect(screen.getByTestId("calendar-skeleton")).toBeInTheDocument();
  });

  it("has backdrop blur for glass effect", () => {
    render(<TrainingCalendarSkeleton />);

    const skeleton = screen.getByTestId("calendar-skeleton");
    expect(skeleton).toHaveClass("backdrop-blur-md");
  });

  it("has rounded corners", () => {
    render(<TrainingCalendarSkeleton />);

    const skeleton = screen.getByTestId("calendar-skeleton");
    expect(skeleton).toHaveClass("rounded-lg");
  });

  it("has dark semi-transparent background", () => {
    render(<TrainingCalendarSkeleton />);

    const skeleton = screen.getByTestId("calendar-skeleton");
    expect(skeleton).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.5)" });
  });

  it("displays day headers", () => {
    render(<TrainingCalendarSkeleton />);

    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });
});
