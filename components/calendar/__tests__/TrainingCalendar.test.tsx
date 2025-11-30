import { render, screen, fireEvent } from "@testing-library/react";
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

  describe("completed run indicator", () => {
    it("displays checkmark for completed runs", () => {
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15), completed: true })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const badge = screen.getByTestId("run-badge");
      const checkmark = screen.getByTestId("checkmark-icon");

      expect(badge).toHaveAttribute("data-completed", "true");
      expect(checkmark).toBeInTheDocument();
    });

    it("does not display checkmark for scheduled (incomplete) runs", () => {
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15), completed: false })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const badge = screen.getByTestId("run-badge");
      const checkmark = screen.queryByTestId("checkmark-icon");

      expect(badge).toHaveAttribute("data-completed", "false");
      expect(checkmark).not.toBeInTheDocument();
    });

    it("correctly renders mix of completed and scheduled runs", () => {
      mockUseQuery.mockReturnValue({
        data: [
          createMockRun({ date: getDateInCurrentMonth(10), completed: true }),
          createMockRun({ date: getDateInCurrentMonth(12), completed: false }),
          createMockRun({ date: getDateInCurrentMonth(14), completed: true }),
        ],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const badges = screen.getAllByTestId("run-badge");
      expect(badges).toHaveLength(3);

      const checkmarks = screen.getAllByTestId("checkmark-icon");
      expect(checkmarks).toHaveLength(2);
    });

    it("checkmark icon has aria-hidden for accessibility", () => {
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15), completed: true })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const checkmark = screen.getByTestId("checkmark-icon");
      expect(checkmark).toHaveAttribute("aria-hidden", "true");
    });

    it("checkmark renders on all run type backgrounds", () => {
      const runTypes: RunType[] = [
        "LONG_RUN",
        "EASY_RUN",
        "TEMPO_RUN",
        "INTERVAL_RUN",
        "RECOVERY_RUN",
        "RACE",
      ];

      mockUseQuery.mockReturnValue({
        data: runTypes.map((type, index) =>
          createMockRun({ date: getDateInCurrentMonth(10 + index), type, completed: true })
        ),
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const checkmarks = screen.getAllByTestId("checkmark-icon");
      expect(checkmarks).toHaveLength(6);

      // Verify all badges are present with correct types
      const badges = screen.getAllByTestId("run-badge");
      runTypes.forEach((type) => {
        const badge = badges.find((b) => b.getAttribute("data-run-type") === type);
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveAttribute("data-completed", "true");
      });
    });
  });

  describe("today highlight", () => {
    it("highlights today's date when it has a run", () => {
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

    it("highlights today's date even without any runs scheduled", () => {
      // Provide a run on a different date to show the calendar grid
      const otherDate = getDateInCurrentMonth(new Date().getDate() === 15 ? 16 : 15);
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: otherDate })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const allCells = screen.getAllByTestId("calendar-cell");
      const todayCell = allCells.find((cell) => cell.getAttribute("data-date") === todayKey);

      expect(todayCell).toBeInTheDocument();
      expect(todayCell).toHaveClass("bg-white/10");
    });

    it("today's date number has amber color styling", () => {
      const today = new Date();
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: today })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const allCells = screen.getAllByTestId("calendar-cell");
      const todayCell = allCells.find((cell) => cell.getAttribute("data-date") === todayKey);

      // The date number div inside the cell should have amber text
      const dateNumber = todayCell?.querySelector("div:first-child");
      expect(dateNumber).toHaveClass("text-amber-400");
    });

    it("today highlight is not shown when viewing a different month", () => {
      const today = new Date();
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15) })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      // Navigate to next month
      const nextButton = screen.getByTestId("calendar-next");
      fireEvent.click(nextButton);

      // Today's date key format
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      // There should be no cell with today's date in the next month
      const allCells = screen.getAllByTestId("calendar-cell");
      const todayCell = allCells.find((cell) => cell.getAttribute("data-date") === todayKey);

      expect(todayCell).toBeUndefined();
    });

    it("non-today dates do not have highlight styling", () => {
      const today = new Date();
      // Pick a date that's not today
      const otherDay = today.getDate() === 15 ? 16 : 15;
      const otherDate = getDateInCurrentMonth(otherDay);

      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: otherDate })],
        isLoading: false,
      });

      render(<TrainingCalendar />);

      const otherKey = `${otherDate.getFullYear()}-${String(otherDate.getMonth() + 1).padStart(2, "0")}-${String(otherDate.getDate()).padStart(2, "0")}`;
      const allCells = screen.getAllByTestId("calendar-cell");
      const otherCell = allCells.find((cell) => cell.getAttribute("data-date") === otherKey);

      expect(otherCell).toBeInTheDocument();
      expect(otherCell).not.toHaveClass("bg-white/10");
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

  describe("navigation", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: [createMockRun({ date: getDateInCurrentMonth(15) })],
        isLoading: false,
      });
    });

    it("renders navigation buttons", () => {
      render(<TrainingCalendar />);

      expect(screen.getByTestId("calendar-prev")).toBeInTheDocument();
      expect(screen.getByTestId("calendar-next")).toBeInTheDocument();
    });

    it("navigation buttons have accessible labels", () => {
      render(<TrainingCalendar />);

      const prevButton = screen.getByTestId("calendar-prev");
      const nextButton = screen.getByTestId("calendar-next");

      expect(prevButton).toHaveAttribute("aria-label", "Previous month");
      expect(nextButton).toHaveAttribute("aria-label", "Next month");
    });

    it("clicking Next navigates to next month", () => {
      render(<TrainingCalendar />);

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const expectedNextMonth = nextMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      const nextButton = screen.getByTestId("calendar-next");
      fireEvent.click(nextButton);

      expect(screen.getByTestId("calendar-month")).toHaveTextContent(expectedNextMonth);
    });

    it("clicking Previous navigates to previous month", () => {
      render(<TrainingCalendar />);

      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const expectedPrevMonth = prevMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      const prevButton = screen.getByTestId("calendar-prev");
      fireEvent.click(prevButton);

      expect(screen.getByTestId("calendar-month")).toHaveTextContent(expectedPrevMonth);
    });

    it("Today button appears when viewing a different month", () => {
      render(<TrainingCalendar />);

      // Initially, Today button should not be visible (we're on current month)
      expect(screen.queryByTestId("calendar-today")).not.toBeInTheDocument();

      // Navigate to next month
      const nextButton = screen.getByTestId("calendar-next");
      fireEvent.click(nextButton);

      // Now Today button should be visible
      expect(screen.getByTestId("calendar-today")).toBeInTheDocument();
    });

    it("Today button is not visible when viewing current month", () => {
      render(<TrainingCalendar />);

      expect(screen.queryByTestId("calendar-today")).not.toBeInTheDocument();
    });

    it("clicking Today returns to current month", () => {
      render(<TrainingCalendar />);

      const now = new Date();
      const currentMonth = now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      // Navigate away from current month
      const nextButton = screen.getByTestId("calendar-next");
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      // Click Today
      const todayButton = screen.getByTestId("calendar-today");
      fireEvent.click(todayButton);

      // Should be back to current month
      expect(screen.getByTestId("calendar-month")).toHaveTextContent(currentMonth);
      // Today button should disappear
      expect(screen.queryByTestId("calendar-today")).not.toBeInTheDocument();
    });

    it("navigation wraps correctly from December to January", () => {
      render(<TrainingCalendar />);

      const now = new Date();
      // Navigate to December of current year
      const monthsToDecember = 11 - now.getMonth();
      const nextButton = screen.getByTestId("calendar-next");

      for (let i = 0; i < monthsToDecember; i++) {
        fireEvent.click(nextButton);
      }

      // Should show December
      expect(screen.getByTestId("calendar-month")).toHaveTextContent("December");

      // Navigate one more month
      fireEvent.click(nextButton);

      // Should show January of next year
      expect(screen.getByTestId("calendar-month")).toHaveTextContent("January");
    });

    it("navigation wraps correctly from January to December", () => {
      render(<TrainingCalendar />);

      const now = new Date();
      // Navigate to January of current year
      const monthsToJanuary = now.getMonth();
      const prevButton = screen.getByTestId("calendar-prev");

      for (let i = 0; i < monthsToJanuary; i++) {
        fireEvent.click(prevButton);
      }

      // Should show January
      expect(screen.getByTestId("calendar-month")).toHaveTextContent("January");

      // Navigate one more month back
      fireEvent.click(prevButton);

      // Should show December of previous year
      expect(screen.getByTestId("calendar-month")).toHaveTextContent("December");
    });

    it("updates API query when navigating to different month", () => {
      render(<TrainingCalendar />);

      // Clear initial call
      mockUseQuery.mockClear();

      // Navigate to next month
      const nextButton = screen.getByTestId("calendar-next");
      fireEvent.click(nextButton);

      // API should be called again with new date range
      expect(mockUseQuery).toHaveBeenCalled();
      const callArgs = mockUseQuery.mock.calls[0][0];

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      expect(callArgs.startDate.getMonth()).toBe(nextMonth.getMonth());
    });
  });
});

describe("adjacent month days", () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: [createMockRun({ date: getDateInCurrentMonth(15) })],
      isLoading: false,
    });
  });

  it("renders adjacent month cells for leading days", () => {
    render(<TrainingCalendar />);

    // Should have some adjacent month cells (unless the month starts on Sunday)
    // The number of adjacent cells depends on the current month, but they should exist
    // We just verify the structure is correct - total cells should include both current and adjacent
    const currentMonthCells = screen.getAllByTestId("calendar-cell");
    const adjacentCells = screen.queryAllByTestId("calendar-cell-adjacent");
    const totalCells = currentMonthCells.length + adjacentCells.length;
    // A full calendar grid should have at least 28 cells (4 weeks)
    expect(totalCells).toBeGreaterThanOrEqual(28);
  });

  it("adjacent month cells have isCurrentMonth false", () => {
    render(<TrainingCalendar />);

    const adjacentCells = screen.queryAllByTestId("calendar-cell-adjacent");
    adjacentCells.forEach((cell) => {
      expect(cell).toHaveAttribute("data-current-month", "false");
    });
  });

  it("current month cells have isCurrentMonth true", () => {
    render(<TrainingCalendar />);

    const currentMonthCells = screen.getAllByTestId("calendar-cell");
    currentMonthCells.forEach((cell) => {
      expect(cell).toHaveAttribute("data-current-month", "true");
    });
  });

  it("adjacent month cells have muted text styling", () => {
    render(<TrainingCalendar />);

    const adjacentCells = screen.queryAllByTestId("calendar-cell-adjacent");
    if (adjacentCells.length > 0) {
      // Adjacent month cells should have a subtle background
      adjacentCells.forEach((cell) => {
        expect(cell).toHaveClass("bg-white/[0.02]");
      });
    }
  });

  it("adjacent month cells contain actual dates (not empty)", () => {
    render(<TrainingCalendar />);

    const adjacentCells = screen.queryAllByTestId("calendar-cell-adjacent");
    adjacentCells.forEach((cell) => {
      // Each adjacent cell should have a data-date attribute with a valid date
      const dateAttr = cell.getAttribute("data-date");
      expect(dateAttr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("grid maintains 7 columns for all rows", () => {
    render(<TrainingCalendar />);

    const grid = screen.getByTestId("calendar-grid");
    const rows = grid.querySelectorAll(".grid.grid-cols-7");

    rows.forEach((row) => {
      // Each row should have exactly 7 cells (current + adjacent)
      const cells = row.querySelectorAll(
        "[data-testid='calendar-cell'], [data-testid='calendar-cell-adjacent']"
      );
      expect(cells).toHaveLength(7);
    });
  });

  it("does not render run badges on adjacent month cells", () => {
    // Create a run that would be in the adjacent month (previous month, last day)
    const now = new Date();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 28);

    mockUseQuery.mockReturnValue({
      data: [
        createMockRun({ date: getDateInCurrentMonth(15) }),
        createMockRun({ date: prevMonthDate, type: "LONG_RUN" }),
      ],
      isLoading: false,
    });

    render(<TrainingCalendar />);

    // Adjacent month cells should not show run badges (only current month days do)
    const adjacentCells = screen.queryAllByTestId("calendar-cell-adjacent");
    adjacentCells.forEach((cell) => {
      const badges = cell.querySelectorAll("[data-testid='run-badge']");
      expect(badges).toHaveLength(0);
    });
  });
});

describe("responsive design", () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: [createMockRun({ date: getDateInCurrentMonth(15) })],
      isLoading: false,
    });
  });

  it("calendar cells have responsive height classes", () => {
    render(<TrainingCalendar />);

    const cells = screen.getAllByTestId("calendar-cell");
    cells.forEach((cell) => {
      // Should have responsive height: min-h-[60px] on mobile, sm:min-h-[80px] on larger
      expect(cell).toHaveClass("min-h-[60px]");
      expect(cell).toHaveClass("sm:min-h-[80px]");
    });
  });

  it("navigation buttons have minimum touch target size", () => {
    render(<TrainingCalendar />);

    const prevButton = screen.getByTestId("calendar-prev");
    const nextButton = screen.getByTestId("calendar-next");

    // 44px minimum for accessibility
    expect(prevButton).toHaveClass("min-w-[44px]");
    expect(prevButton).toHaveClass("min-h-[44px]");
    expect(nextButton).toHaveClass("min-w-[44px]");
    expect(nextButton).toHaveClass("min-h-[44px]");
  });

  it("day headers have responsive padding", () => {
    render(<TrainingCalendar />);

    const dayHeaders = screen.getByTestId("calendar-day-headers");
    const headerCells = dayHeaders.querySelectorAll("div");

    headerCells.forEach((cell) => {
      expect(cell).toHaveClass("p-1");
      expect(cell).toHaveClass("sm:p-2");
    });
  });

  it("day headers have responsive font size", () => {
    render(<TrainingCalendar />);

    const dayHeaders = screen.getByTestId("calendar-day-headers");
    const headerCells = dayHeaders.querySelectorAll("div");

    headerCells.forEach((cell) => {
      expect(cell).toHaveClass("text-[10px]");
      expect(cell).toHaveClass("sm:text-xs");
    });
  });

  it("month header has responsive font size", () => {
    render(<TrainingCalendar />);

    const monthHeader = screen.getByTestId("calendar-month");
    expect(monthHeader).toHaveClass("text-base");
    expect(monthHeader).toHaveClass("sm:text-lg");
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
