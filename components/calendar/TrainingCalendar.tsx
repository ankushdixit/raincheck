"use client";

import { useMemo } from "react";
import type { Run, RunType } from "@prisma/client";
import { api } from "@/lib/api";

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
 * Generate calendar grid data for a month
 */
function generateMonthGrid(date: Date): { date: Date | null; isCurrentMonth: boolean }[][] {
  const monthStart = getMonthStart(date);
  const daysInMonth = getDaysInMonth(date);
  const startDayOfWeek = getDayOfWeek(monthStart);

  const grid: { date: Date | null; isCurrentMonth: boolean }[][] = [];
  let currentDay = 1;
  let currentWeek: { date: Date | null; isCurrentMonth: boolean }[] = [];

  // Fill in leading empty cells
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push({ date: null, isCurrentMonth: false });
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

  // Fill in trailing empty cells
  while (currentWeek.length < 7) {
    currentWeek.push({ date: null, isCurrentMonth: false });
  }
  grid.push(currentWeek);

  return grid;
}

/**
 * Run badge component
 */
function RunBadge({ run }: { run: Run }) {
  const color = RUN_TYPE_COLORS[run.type];
  const label = RUN_TYPE_LABELS[run.type];

  return (
    <div
      className="rounded px-1.5 py-0.5 text-white text-xs font-medium truncate"
      style={{ backgroundColor: color }}
      data-testid="run-badge"
      data-run-type={run.type}
    >
      <span className="block truncate">
        {label} {run.distance}km
      </span>
    </div>
  );
}

/**
 * Calendar cell component
 */
function CalendarCell({
  cellDate,
  runs,
  isToday,
}: {
  cellDate: Date | null;
  runs: Run[];
  isToday: boolean;
}) {
  if (!cellDate) {
    return (
      <div
        className="min-h-[80px] p-1 border-r border-b border-white/10"
        data-testid="calendar-cell-empty"
      />
    );
  }

  const dayRuns = runs.filter((run) => isSameDay(new Date(run.date), cellDate));

  return (
    <div
      className={`min-h-[80px] p-1 border-r border-b border-white/10 ${
        isToday ? "bg-white/10" : ""
      }`}
      data-testid="calendar-cell"
      data-date={formatDateKey(cellDate)}
    >
      <div className={`text-xs font-medium mb-1 ${isToday ? "text-amber-400" : "text-white/80"}`}>
        {cellDate.getDate()}
      </div>
      <div className="space-y-1">
        {dayRuns.map((run) => (
          <RunBadge key={run.id} run={run} />
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the calendar
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
      <div className="p-4 flex items-center justify-center">
        <div className="h-6 w-40 bg-white/20 rounded animate-pulse" />
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-white/60">
            {day}
          </div>
        ))}
      </div>

      {/* Skeleton grid - 5 rows */}
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="grid grid-cols-7">
          {[0, 1, 2, 3, 4, 5, 6].map((col) => (
            <div key={col} className="min-h-[80px] p-1 border-r border-b border-white/10">
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
 * Displays the current month with scheduled runs color-coded by type.
 */
export function TrainingCalendar() {
  const today = new Date();
  const monthStart = getMonthStart(today);
  const monthEnd = getMonthEnd(today);

  // Fetch runs for the current month
  const { data: runs, isLoading } = api.runs.getByDateRange.useQuery({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Generate the calendar grid
  const grid = useMemo(() => generateMonthGrid(today), []);

  // Format month name
  const monthName = today.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (isLoading) {
    return <TrainingCalendarSkeleton />;
  }

  const hasRuns = runs && runs.length > 0;

  return (
    <div
      className="backdrop-blur-md rounded-lg overflow-hidden"
      style={{ backgroundColor: "rgba(10,15,10,0.5)" }}
      data-testid="training-calendar"
    >
      {/* Month header */}
      <div className="p-4 flex items-center justify-center">
        <h3 className="text-lg font-semibold text-white" data-testid="calendar-month">
          {monthName}
        </h3>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-white/60">
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
                <CalendarCell
                  key={dayIndex}
                  cellDate={cell.date}
                  runs={runs}
                  isToday={cell.date ? isSameDay(cell.date, today) : false}
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
          className="p-3 border-t border-white/10 flex flex-wrap gap-3 justify-center"
          data-testid="calendar-legend"
        >
          {(Object.keys(RUN_TYPE_COLORS) as RunType[]).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: RUN_TYPE_COLORS[type] }} />
              <span className="text-xs text-white/60">{RUN_TYPE_LABELS[type]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
