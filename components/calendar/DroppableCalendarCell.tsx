"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Run } from "@prisma/client";
import { DraggableRunBadge } from "./DraggableRunBadge";
import { formatDateKey, isSameDay } from "@/lib/calendar-utils";

export interface DroppableCalendarCellProps {
  cellDate: Date;
  runs: Run[];
  isToday: boolean;
  isCurrentMonth: boolean;
  isDragDisabled?: boolean;
  /** Whether this cell is a valid drop target during active drag */
  isValidTarget?: boolean;
  /** Whether a drag operation is currently active */
  isDragging?: boolean;
  /** ID of the currently selected run in tap-to-move mode */
  selectedRunId?: string | null;
  /** Callback when a run is tapped for tap-to-move */
  onRunTap?: (_run: Run) => void;
  /** Callback when this cell is tapped as a move target */
  onCellTap?: (_date: Date) => void;
  /** Whether tap-to-move mode is enabled */
  isTapToMoveEnabled?: boolean;
}

/**
 * Droppable calendar cell component
 *
 * A calendar cell that can receive dropped run badges.
 * Highlights when a draggable item is over it to indicate valid drop target.
 * Uses @dnd-kit's useDroppable hook for drop functionality.
 * Also supports tap-to-move mode for touch devices.
 */
export function DroppableCalendarCell({
  cellDate,
  runs,
  isToday,
  isCurrentMonth,
  isDragDisabled = false,
  isValidTarget,
  isDragging = false,
  selectedRunId,
  onRunTap,
  onCellTap,
  isTapToMoveEnabled = false,
}: DroppableCalendarCellProps) {
  const dateKey = formatDateKey(cellDate);
  const { setNodeRef, isOver, active } = useDroppable({
    id: dateKey,
    data: { date: cellDate },
  });

  const dayRuns = runs.filter((run) => isSameDay(new Date(run.date), cellDate));

  // Use provided validity or fall back to basic check (for backward compatibility)
  const isActuallyValid = isValidTarget !== undefined ? isValidTarget : isCurrentMonth;

  // Is a run selected in tap-to-move mode?
  const isInMoveMode = selectedRunId !== null && selectedRunId !== undefined;

  // Handle cell tap for moving selected run
  const handleCellClick = () => {
    if (isInMoveMode && isActuallyValid && onCellTap && isCurrentMonth) {
      onCellTap(cellDate);
    }
  };

  // Determine styling based on current month, today status, drop state, and tap-to-move state
  const cellClasses = [
    "min-h-[60px] sm:min-h-[80px]", // Responsive height
    "p-1 sm:p-1.5", // Responsive padding
    "border-r border-b border-white/10",
    "transition-colors duration-150", // Smooth transition for highlight
    isToday && isCurrentMonth ? "bg-white/10" : "",
    !isCurrentMonth ? "bg-white/[0.02]" : "",
    // Valid target hover styling (green highlight) - for drag-drop
    isOver && active !== null && isActuallyValid
      ? "bg-green-500/20 ring-2 ring-green-400/50 ring-inset"
      : "",
    // Invalid target hover styling (red highlight) - for drag-drop
    isOver && active !== null && !isActuallyValid
      ? "bg-red-500/10 ring-2 ring-red-400/30 ring-inset"
      : "",
    // During drag, show invalid targets as dimmed
    isDragging && !isActuallyValid && !isOver ? "opacity-50" : "",
    // Tap-to-move mode: highlight valid targets when run is selected
    isInMoveMode && isActuallyValid && isCurrentMonth && !isDragging
      ? "bg-green-500/10 cursor-pointer"
      : "",
    // Tap-to-move mode: dim invalid targets when run is selected
    isInMoveMode && !isActuallyValid && isCurrentMonth && !isDragging ? "opacity-50" : "",
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
      data-is-over={isOver && active !== null}
      data-valid-target={isActuallyValid}
      data-move-mode={isInMoveMode}
      onClick={handleCellClick}
    >
      <div className={dateClasses}>{cellDate.getDate()}</div>
      {isCurrentMonth && (
        <div className="space-y-0.5 sm:space-y-1">
          {dayRuns.map((run) => (
            <DraggableRunBadge
              key={run.id}
              run={run}
              isDragDisabled={isDragDisabled}
              isSelected={selectedRunId === run.id}
              onTap={onRunTap}
              isTapToMoveEnabled={isTapToMoveEnabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
