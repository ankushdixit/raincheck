import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { DroppableCalendarCell } from "../DroppableCalendarCell";
import type { Run, RunType } from "@prisma/client";

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

// Helper to get date in current month with specific day
const getDateInCurrentMonth = (day: number): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day);
};

// Format date to YYYY-MM-DD for comparison
const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// Wrapper component that provides DndContext
const DndWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndContext>{children}</DndContext>
);

describe("DroppableCalendarCell", () => {
  describe("rendering", () => {
    it("renders the cell with correct date", () => {
      const cellDate = getDateInCurrentMonth(15);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[]}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell");
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveAttribute("data-date", formatDateKey(cellDate));
    });

    it("displays the day number", () => {
      const cellDate = getDateInCurrentMonth(23);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[]}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      expect(screen.getByText("23")).toBeInTheDocument();
    });

    it("renders run badges for runs on this date", () => {
      const cellDate = getDateInCurrentMonth(10);
      const runs = [
        createMockRun({ date: cellDate, type: "EASY_RUN", distance: 8 }),
        createMockRun({ date: cellDate, type: "LONG_RUN", distance: 16 }),
      ];

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={runs}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      const badges = screen.getAllByTestId("run-badge");
      expect(badges).toHaveLength(2);
    });

    it("does not render run badges for runs on different dates", () => {
      const cellDate = getDateInCurrentMonth(10);
      const runs = [
        createMockRun({ date: getDateInCurrentMonth(11), type: "EASY_RUN" }),
        createMockRun({ date: getDateInCurrentMonth(12), type: "LONG_RUN" }),
      ];

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={runs}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      expect(screen.queryByTestId("run-badge")).not.toBeInTheDocument();
    });
  });

  describe("current month cell", () => {
    it("has calendar-cell testid for current month", () => {
      const cellDate = getDateInCurrentMonth(15);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[]}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      expect(screen.getByTestId("calendar-cell")).toBeInTheDocument();
      expect(screen.queryByTestId("calendar-cell-adjacent")).not.toBeInTheDocument();
    });

    it("has data-current-month true", () => {
      const cellDate = getDateInCurrentMonth(15);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[]}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell");
      expect(cell).toHaveAttribute("data-current-month", "true");
    });

    it("shows run badges for current month cells", () => {
      const cellDate = getDateInCurrentMonth(15);
      const run = createMockRun({ date: cellDate });

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[run]}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      expect(screen.getByTestId("run-badge")).toBeInTheDocument();
    });
  });

  describe("adjacent month cell", () => {
    it("has calendar-cell-adjacent testid for non-current month", () => {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 28);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={prevMonth}
            runs={[]}
            isToday={false}
            isCurrentMonth={false}
          />
        </DndWrapper>
      );

      expect(screen.getByTestId("calendar-cell-adjacent")).toBeInTheDocument();
      expect(screen.queryByTestId("calendar-cell")).not.toBeInTheDocument();
    });

    it("has data-current-month false", () => {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 28);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={prevMonth}
            runs={[]}
            isToday={false}
            isCurrentMonth={false}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell-adjacent");
      expect(cell).toHaveAttribute("data-current-month", "false");
    });

    it("has muted background styling", () => {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 28);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={prevMonth}
            runs={[]}
            isToday={false}
            isCurrentMonth={false}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell-adjacent");
      expect(cell).toHaveClass("bg-white/[0.02]");
    });

    it("does not show run badges for adjacent month cells", () => {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 28);
      const run = createMockRun({ date: prevMonth });

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={prevMonth}
            runs={[run]}
            isToday={false}
            isCurrentMonth={false}
          />
        </DndWrapper>
      );

      expect(screen.queryByTestId("run-badge")).not.toBeInTheDocument();
    });
  });

  describe("today highlight", () => {
    it("has highlight styling when isToday and isCurrentMonth", () => {
      const cellDate = getDateInCurrentMonth(15);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[]}
            isToday={true}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell");
      expect(cell).toHaveClass("bg-white/10");
    });

    it("date number has amber styling when isToday and isCurrentMonth", () => {
      const cellDate = getDateInCurrentMonth(15);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[]}
            isToday={true}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell");
      const dateNumber = cell.querySelector("div:first-child");
      expect(dateNumber).toHaveClass("text-amber-400");
    });

    it("does not have highlight when isToday but not isCurrentMonth", () => {
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={prevMonth}
            runs={[]}
            isToday={true}
            isCurrentMonth={false}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell-adjacent");
      expect(cell).not.toHaveClass("bg-white/10");
    });
  });

  describe("drag functionality", () => {
    it("passes isDragDisabled to run badges", () => {
      const cellDate = getDateInCurrentMonth(15);
      const run = createMockRun({ date: cellDate });

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[run]}
            isToday={false}
            isCurrentMonth={true}
            isDragDisabled={true}
          />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveAttribute("data-draggable", "false");
    });

    it("run badges are draggable when isDragDisabled is false", () => {
      const cellDate = getDateInCurrentMonth(15);
      const run = createMockRun({ date: cellDate });

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[run]}
            isToday={false}
            isCurrentMonth={true}
            isDragDisabled={false}
          />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveAttribute("data-draggable", "true");
    });

    it("has data-is-over attribute", () => {
      const cellDate = getDateInCurrentMonth(15);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[]}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell");
      expect(cell).toHaveAttribute("data-is-over", "false");
    });
  });

  describe("responsive design", () => {
    it("has responsive height classes", () => {
      const cellDate = getDateInCurrentMonth(15);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[]}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell");
      expect(cell).toHaveClass("min-h-[60px]");
      expect(cell).toHaveClass("sm:min-h-[80px]");
    });

    it("has responsive padding classes", () => {
      const cellDate = getDateInCurrentMonth(15);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[]}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell");
      expect(cell).toHaveClass("p-1");
      expect(cell).toHaveClass("sm:p-1.5");
    });

    it("has transition classes for smooth highlight effect", () => {
      const cellDate = getDateInCurrentMonth(15);

      render(
        <DndWrapper>
          <DroppableCalendarCell
            cellDate={cellDate}
            runs={[]}
            isToday={false}
            isCurrentMonth={true}
          />
        </DndWrapper>
      );

      const cell = screen.getByTestId("calendar-cell");
      expect(cell).toHaveClass("transition-colors");
      expect(cell).toHaveClass("duration-150");
    });
  });
});
