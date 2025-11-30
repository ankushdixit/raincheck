import type { Run } from "@prisma/client";

/**
 * Format date to YYYY-MM-DD for comparison
 */
export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateKey(date1) === formatDateKey(date2);
}

/**
 * Check if a date is in the past (before today)
 * Note: Today is considered valid (not past)
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate < today;
}

/**
 * Check if a date already has a run scheduled
 * Excludes the currently dragged run from the check (to allow dropping on same cell)
 */
export function hasExistingRun(date: Date, runs: Run[], excludeRunId?: string): boolean {
  return runs.some((run) => {
    // Skip the run being dragged
    if (excludeRunId && run.id === excludeRunId) {
      return false;
    }
    return isSameDay(new Date(run.date), date);
  });
}

/**
 * Check if a date is a valid drop target for rescheduling a run
 *
 * A valid target must:
 * - Not be in the past (before today)
 * - Not already have a run scheduled (except the dragged run itself)
 *
 * @param date - The target date to validate
 * @param runs - All runs in the current view
 * @param draggedRunId - The ID of the run being dragged (to exclude from collision check)
 * @returns true if the date is a valid drop target
 */
export function isValidDropTarget(date: Date, runs: Run[], draggedRunId?: string): boolean {
  // Past dates are not valid
  if (isPastDate(date)) {
    return false;
  }

  // Dates with existing runs are not valid (except if it's the same run)
  if (hasExistingRun(date, runs, draggedRunId)) {
    return false;
  }

  return true;
}

/**
 * Get validation message for an invalid drop target
 */
export function getInvalidDropMessage(
  date: Date,
  runs: Run[],
  draggedRunId?: string
): string | null {
  if (isPastDate(date)) {
    return "Cannot schedule runs in the past";
  }

  if (hasExistingRun(date, runs, draggedRunId)) {
    return "A run is already scheduled for this day";
  }

  return null;
}
