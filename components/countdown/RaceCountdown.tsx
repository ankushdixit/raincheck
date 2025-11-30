"use client";

import { api } from "@/lib/api";

/**
 * Calculate the number of days between two dates.
 * Normalizes both dates to midnight to avoid time-based edge cases.
 */
export function calculateDaysUntil(targetDate: Date, fromDate: Date = new Date()): number {
  // Normalize both dates to midnight (start of day)
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - from.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format a date for display (e.g., "May 17, 2026")
 */
export function formatRaceDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Loading skeleton that matches the countdown card layout
 */
function CountdownSkeleton() {
  return (
    <div className="w-full max-w-sm rounded-xl bg-forest-dark p-6" data-testid="countdown-skeleton">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        {/* Days number placeholder */}
        <div className="h-16 w-24 rounded bg-forest-deep/50" />
        {/* "days until race day" placeholder */}
        <div className="h-6 w-40 rounded bg-forest-deep/50" />
        {/* Race name placeholder */}
        <div className="h-5 w-64 rounded bg-forest-deep/50" />
        {/* Race date placeholder */}
        <div className="h-4 w-32 rounded bg-forest-deep/50" />
      </div>
    </div>
  );
}

/**
 * Error state with retry button
 */
function CountdownError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="w-full max-w-sm rounded-xl bg-forest-dark p-6" data-testid="countdown-error">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-5xl" role="img" aria-label="Warning">
          &#x26A0;&#xFE0F;
        </span>
        <p className="text-text-primary/80">Unable to load race info</p>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="retry-button"
        >
          {isRetrying ? "Retrying..." : "Retry"}
        </button>
      </div>
    </div>
  );
}

/**
 * RaceCountdown component
 *
 * Displays a prominent countdown showing days until race day,
 * along with the race name and date. Uses amber accents for
 * visual emphasis matching the design system.
 */
export function RaceCountdown() {
  const { data: settings, isLoading, isError, refetch, isFetching } = api.settings.get.useQuery();

  // Show skeleton during initial load
  if (isLoading) {
    return <CountdownSkeleton />;
  }

  // Show error state with retry
  if (isError || !settings) {
    return <CountdownError onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  const raceDate = new Date(settings.raceDate);
  const daysUntil = calculateDaysUntil(raceDate);
  const formattedDate = formatRaceDate(raceDate);

  // Handle race day and past race scenarios
  const getDaysLabel = () => {
    if (daysUntil === 0) return "Race Day!";
    if (daysUntil === 1) return "day until race day";
    if (daysUntil < 0) return "days since race day";
    return "days until race day";
  };

  const displayDays = Math.abs(daysUntil);

  return (
    <div
      className="w-full max-w-sm rounded-xl bg-forest-dark p-6 border border-amber-600/30"
      data-testid="countdown-card"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Days countdown number with subtle glow animation */}
        <p
          className="text-6xl sm:text-7xl font-bold text-amber-500 animate-pulse"
          style={{ animationDuration: "3s" }}
          data-testid="countdown-days"
        >
          {daysUntil === 0 ? "🏃" : displayDays}
        </p>

        {/* "days until race day" label */}
        <p className="text-lg text-text-primary/80" data-testid="countdown-label">
          {getDaysLabel()}
        </p>

        {/* Divider */}
        <div className="w-16 h-px bg-amber-600/50 my-2" />

        {/* Race name */}
        <p className="text-sm sm:text-base font-medium text-text-primary" data-testid="race-name">
          {settings.raceName}
        </p>

        {/* Race date */}
        <p className="text-sm text-text-primary/60" data-testid="race-date">
          {formattedDate}
        </p>

        {/* Target time */}
        {settings.targetTime && (
          <p className="text-xs text-amber-500/80 mt-1" data-testid="target-time">
            Target: {settings.targetTime}
          </p>
        )}
      </div>
    </div>
  );
}
