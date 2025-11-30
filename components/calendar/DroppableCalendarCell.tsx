"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Run } from "@prisma/client";
import { DraggableRunBadge } from "./DraggableRunBadge";

/**
 * Format date to YYYY-MM-DD for comparison
 */
function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateKey(date1) === formatDateKey(date2);
}

export interface DroppableCalendarCellProps {
  cellDate: Date;
  runs: Run[];
  isToday: boolean;
  isCurrentMonth: boolean;
  isDragDisabled?: boolean;
}

/**
 * Droppable calendar cell component
 *
 * A calendar cell that can receive dropped run badges.
 * Highlights when a draggable item is over it to indicate valid drop target.
 * Uses @dnd-kit's useDroppable hook for drop functionality.
 */
export function DroppableCalendarCell({
  cellDate,
  runs,
  isToday,
  isCurrentMonth,
  isDragDisabled = false,
}: DroppableCalendarCellProps) {
  const dateKey = formatDateKey(cellDate);
  const { setNodeRef, isOver, active } = useDroppable({
    id: dateKey,
    data: { date: cellDate },
  });

  const dayRuns = runs.filter((run) => isSameDay(new Date(run.date), cellDate));

  // Determine if this is a valid drop target (only current month cells)
  const isValidDropTarget = isCurrentMonth && active !== null;

  // Determine styling based on current month, today status, and drop state
  const cellClasses = [
    "min-h-[60px] sm:min-h-[80px]", // Responsive height
    "p-1 sm:p-1.5", // Responsive padding
    "border-r border-b border-white/10",
    "transition-colors duration-150", // Smooth transition for highlight
    isToday && isCurrentMonth ? "bg-white/10" : "",
    !isCurrentMonth ? "bg-white/[0.02]" : "",
    isOver && isValidDropTarget ? "bg-amber-500/20 ring-2 ring-amber-400/50 ring-inset" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const dateClasses = [
    "text-xs font-medium mb-1",
    "min-h-[20px] min-w-[20px]", // Minimum touch target size for date numbers
    "flex items-center justify-center sm:justify-start", // Center on mobile, left-align on larger
    "w-6 h-6 sm:w-auto sm:h-auto", // Fixed size on mobile for touch
    "rounded-full sm:rounded-none", // Circular on mobile for better touch
    isToday && isCurrentMonth ? "text-amber-400 sm:bg-transparent bg-amber-500/20" : "",
    isCurrentMonth ? "text-white/80" : "text-white/30", // Muted for adjacent months
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={setNodeRef}
      className={cellClasses}
      data-testid={isCurrentMonth ? "calendar-cell" : "calendar-cell-adjacent"}
      data-date={dateKey}
      data-current-month={isCurrentMonth}
      data-is-over={isOver && isValidDropTarget}
    >
      <div className={dateClasses}>{cellDate.getDate()}</div>
      {isCurrentMonth && (
        <div className="space-y-0.5 sm:space-y-1">
          {dayRuns.map((run) => (
            <DraggableRunBadge key={run.id} run={run} isDragDisabled={isDragDisabled} />
          ))}
        </div>
      )}
    </div>
  );
}
