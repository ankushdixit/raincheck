"use client";

import { useState, useMemo, useCallback } from "react";
import type { Run, RunType } from "@prisma/client";
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { api } from "@/lib/api";
import { useIsAuthenticated } from "@/hooks";
import { DroppableCalendarCell } from "./DroppableCalendarCell";
import { RunBadgeOverlay } from "./DraggableRunBadge";

/**
 * Color mapping for run types
 */
const RUN_TYPE_COLORS: Record<RunType, string> = {
  LONG_RUN: "rgba(59, 130, 246, 0.9)", // Blue
  EASY_RUN: "rgba(34, 197, 94, 0.9)", // Green
  TEMPO_RUN: "rgba(249, 115, 22, 0.9)", // Orange
  INTERVAL_RUN: "rgba(168, 85, 247, 0.9)", // Purple
  RECOVERY_RUN: "rgba(156, 163, 175, 0.9)", // Gray
  RACE: "rgba(234, 179, 8, 0.9)", // Gold
};

/**
 * Abbreviated labels for run types
 */
const RUN_TYPE_LABELS: Record<RunType, string> = {
  LONG_RUN: "Long",
  EASY_RUN: "Easy",
  TEMPO_RUN: "Tempo",
  INTERVAL_RUN: "Intervals",
  RECOVERY_RUN: "Recovery",
  RACE: "Race",
};

/**
 * Get the start of a month (midnight on the 1st)
 */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of a month (11:59:59 PM on the last day)
 */
function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Get number of days in a month
 */
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

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

/**
 * Check if two dates are in the same month and year
 */
function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

/**
 * Generate calendar grid data for a month
 * Includes days from previous and next months for leading/trailing cells
 */
function generateMonthGrid(date: Date): { date: Date; isCurrentMonth: boolean }[][] {
  const monthStart = getMonthStart(date);
  const daysInMonth = getDaysInMonth(date);
  const startDayOfWeek = getDayOfWeek(monthStart);

  // Calculate previous month info for leading days
  const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const daysInPrevMonth = getDaysInMonth(prevMonth);

  const grid: { date: Date; isCurrentMonth: boolean }[][] = [];
  let currentDay = 1;
  let currentWeek: { date: Date; isCurrentMonth: boolean }[] = [];

  // Fill in leading cells with previous month days
  for (let i = 0; i < startDayOfWeek; i++) {
    const prevMonthDay = daysInPrevMonth - startDayOfWeek + 1 + i;
    currentWeek.push({
      date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonthDay),
      isCurrentMonth: false,
    });
  }

  // Fill in the days
  while (currentDay <= daysInMonth) {
    if (currentWeek.length === 7) {
      grid.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push({
      date: new Date(date.getFullYear(), date.getMonth(), currentDay),
      isCurrentMonth: true,
    });
    currentDay++;
  }

  // Fill in trailing cells with next month days
  let nextMonthDay = 1;
  while (currentWeek.length < 7) {
    currentWeek.push({
      date: new Date(date.getFullYear(), date.getMonth() + 1, nextMonthDay),
      isCurrentMonth: false,
    });
    nextMonthDay++;
  }
  grid.push(currentWeek);

  return grid;
}

/**
 * Loading skeleton for the calendar
 *
 * Displays a placeholder while calendar data is loading.
 * Responsive design matches the main calendar component.
 */
export function TrainingCalendarSkeleton() {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      className="backdrop-blur-md rounded-lg overflow-hidden"
      style={{ backgroundColor: "rgba(10,15,10,0.5)" }}
      data-testid="calendar-skeleton"
    >
      {/* Month header skeleton */}
      <div className="p-2 sm:p-4 flex items-center justify-center">
        <div className="h-5 sm:h-6 w-32 sm:w-40 bg-white/20 rounded animate-pulse" />
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-medium text-white/60"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Skeleton grid - 5 rows */}
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="grid grid-cols-7">
          {[0, 1, 2, 3, 4, 5, 6].map((col) => (
            <div
              key={col}
              className="min-h-[60px] sm:min-h-[80px] p-1 border-r border-b border-white/10"
            >
              <div className="h-3 w-4 bg-white/20 rounded animate-pulse mb-1" />
              {Math.random() > 0.7 && (
                <div className="h-5 w-full bg-white/10 rounded animate-pulse" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="text-center py-12" data-testid="calendar-empty">
      <p className="text-white/60 text-lg">No runs scheduled this month</p>
      <p className="text-white/40 text-sm mt-2">
        Accept suggested runs to add them to your calendar
      </p>
    </div>
  );
}

/**
 * Training Calendar Component
 *
 * Displays a monthly calendar with scheduled runs color-coded by type.
 * Supports navigation between months with Previous/Next buttons and a Today button.
 * Authenticated users can drag and drop runs to reschedule them.
 */
export function TrainingCalendar() {
  const today = new Date();
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();

  // Track the currently displayed month (defaults to current month)
  const [displayedMonth, setDisplayedMonth] = useState<Date>(() => new Date(today));

  // Track the currently dragged run for the overlay
  const [activeRun, setActiveRun] = useState<Run | null>(null);

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setDisplayedMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setDisplayedMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    setDisplayedMonth(new Date());
  }, []);

  // Calculate date range for the displayed month
  const monthStart = useMemo(() => getMonthStart(displayedMonth), [displayedMonth]);
  const monthEnd = useMemo(() => getMonthEnd(displayedMonth), [displayedMonth]);

  // Check if currently viewing the current month
  const isCurrentMonth = isSameMonth(displayedMonth, today);

  // Fetch runs for the displayed month
  const { data: runs, isLoading } = api.runs.getByDateRange.useQuery({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Mutation for updating run dates
  const utils = api.useUtils();
  const updateRunMutation = api.runs.update.useMutation({
    onSuccess: () => {
      // Invalidate the runs query to refetch the updated data
      utils.runs.getByDateRange.invalidate();
    },
  });

  // Generate the calendar grid for the displayed month
  const grid = useMemo(() => generateMonthGrid(displayedMonth), [displayedMonth]);

  // Format month name for the displayed month
  const monthName = displayedMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const runData = event.active.data.current?.run as Run | undefined;
    if (runData) {
      setActiveRun(runData);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveRun(null);

      const { active, over } = event;
      if (!over || !active.data.current?.run) {
        return;
      }

      const run = active.data.current.run as Run;
      const targetDate = over.data.current?.date as Date | undefined;

      if (!targetDate) {
        return;
      }

      // Check if dropping on the same day
      if (isSameDay(new Date(run.date), targetDate)) {
        return;
      }

      // Update the run's date
      updateRunMutation.mutate({
        id: run.id,
        data: { date: targetDate },
      });
    },
    [updateRunMutation]
  );

  const handleDragCancel = useCallback(() => {
    setActiveRun(null);
  }, []);

  // Disable dragging for unauthenticated users or while auth is loading
  const isDragDisabled = !isAuthenticated || authLoading;

  if (isLoading) {
    return <TrainingCalendarSkeleton />;
  }

  const hasRuns = runs && runs.length > 0;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="backdrop-blur-md rounded-lg overflow-hidden"
        style={{ backgroundColor: "rgba(10,15,10,0.5)" }}
        data-testid="training-calendar"
      >
        {/* Month header with navigation */}
        <div className="p-2 sm:p-4 flex items-center justify-between">
          {/* Previous month button - 44px minimum touch target */}
          <button
            onClick={goToPreviousMonth}
            className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white flex items-center justify-center"
            aria-label="Previous month"
            data-testid="calendar-prev"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Month name and Today button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <h3
              className="text-base sm:text-lg font-semibold text-white"
              data-testid="calendar-month"
            >
              {monthName}
            </h3>
            {!isCurrentMonth && (
              <button
                onClick={goToToday}
                className="min-h-[44px] px-3 py-2 sm:px-2 sm:py-1 sm:min-h-0 text-xs rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                aria-label="Go to current month"
                data-testid="calendar-today"
              >
                Today
              </button>
            )}
          </div>

          {/* Next month button - 44px minimum touch target */}
          <button
            onClick={goToNextMonth}
            className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white flex items-center justify-center"
            aria-label="Next month"
            data-testid="calendar-next"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div
          className="grid grid-cols-7 border-b border-white/10"
          data-testid="calendar-day-headers"
        >
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-medium text-white/60"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {hasRuns ? (
          <div data-testid="calendar-grid">
            {grid.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7">
                {week.map((cell, dayIndex) => (
                  <DroppableCalendarCell
                    key={dayIndex}
                    cellDate={cell.date}
                    runs={runs}
                    isToday={isSameDay(cell.date, today)}
                    isCurrentMonth={cell.isCurrentMonth}
                    isDragDisabled={isDragDisabled}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {/* Legend */}
        {hasRuns && (
          <div
            className="p-2 sm:p-3 border-t border-white/10 flex flex-wrap gap-2 sm:gap-3 justify-center"
            data-testid="calendar-legend"
          >
            {(Object.keys(RUN_TYPE_COLORS) as RunType[]).map((type) => (
              <div key={type} className="flex items-center gap-1 sm:gap-1.5">
                <div
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded"
                  style={{ backgroundColor: RUN_TYPE_COLORS[type] }}
                />
                <span className="text-[10px] sm:text-xs text-white/60">
                  {RUN_TYPE_LABELS[type]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drag overlay - shows the dragged run badge */}
      <DragOverlay>{activeRun ? <RunBadgeOverlay run={activeRun} /> : null}</DragOverlay>
    </DndContext>
  );
}
