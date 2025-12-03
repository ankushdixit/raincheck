"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { RunSuggestionCard, RunSuggestionCardSkeleton } from "./RunSuggestionCard";
import type { AcceptState } from "./RunSuggestionCard";

/**
 * Empty state when no suggestions available.
 */
function NoSuggestionsState() {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-xl py-8 bg-forest-dark/70"
      data-testid="suggestions-empty"
    >
      <span className="text-4xl" role="img" aria-label="Calendar">
        📅
      </span>
      <h3 className="text-lg font-medium text-white">No suggestions available</h3>
      <p className="text-white/60 text-center max-w-sm">
        Check back when weather data is available for the upcoming week.
      </p>
    </div>
  );
}

/**
 * Error state with retry button.
 */
function SuggestionsError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-xl py-8 bg-forest-dark/70"
      data-testid="suggestions-error"
    >
      <span className="text-4xl" role="img" aria-label="Warning">
        ⚠️
      </span>
      <h3 className="text-lg font-medium text-white">Unable to load suggestions</h3>
      <p className="text-white/60 text-center max-w-sm">
        There was a problem fetching run suggestions.
      </p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="suggestions-retry-button"
      >
        {isRetrying ? "Retrying..." : "Retry"}
      </button>
    </div>
  );
}

/**
 * Loading skeleton showing multiple placeholder cards.
 * Matches the horizontal scroll layout of WeatherForecast.
 */
function SuggestionsSkeleton() {
  return (
    <div
      className="flex gap-4 overflow-x-auto py-2 justify-center"
      data-testid="suggestions-skeleton"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <RunSuggestionCardSkeleton key={index} />
      ))}
    </div>
  );
}

interface RunSuggestionsProps {
  isAuthenticated?: boolean;
}

// State for tracking acceptance status per suggestion (by date ISO string)
interface AcceptStateMap {
  [dateKey: string]: {
    state: AcceptState;
    error?: string;
  };
}

/**
 * Calculate pace from distance and duration.
 * Returns pace in format "M:SS" (e.g., "5:30" for 5:30 min/km)
 */
function calculatePace(distance: number, durationMinutes: number): string {
  const paceMinutes = durationMinutes / distance;
  const mins = Math.floor(paceMinutes);
  const secs = Math.round((paceMinutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format duration in minutes to "M:SS" or "MM:SS" format.
 */
function formatDuration(durationMinutes: number): string {
  const mins = Math.floor(durationMinutes);
  const secs = Math.round((durationMinutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Estimate duration based on distance and run type.
 * Returns duration in minutes.
 */
function estimateDuration(distance: number, runType: string): number {
  // Pace estimates per km in minutes based on run type
  const paceMap: Record<string, number> = {
    LONG_RUN: 6.0, // 6:00 min/km
    EASY_RUN: 5.75, // 5:45 min/km
    TEMPO_RUN: 5.0, // 5:00 min/km
    INTERVAL_RUN: 4.5, // 4:30 min/km (average)
    RECOVERY_RUN: 6.25, // 6:15 min/km
    RACE: 4.75, // 4:45 min/km
  };
  const pace = paceMap[runType] || 5.5;
  return distance * pace;
}

/**
 * Container component that fetches and displays run suggestions.
 * Handles loading, error, and empty states.
 */
export function RunSuggestions({ isAuthenticated = false }: RunSuggestionsProps) {
  const {
    data: suggestions,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = api.planning.generateSuggestions.useQuery({ days: 14 });

  // Fetch existing scheduled runs to check which suggestions are already accepted
  const { data: existingRuns } = api.runs.getAll.useQuery({ completed: false });

  // Track accept state for each suggestion (for in-progress mutations)
  const [acceptStates, setAcceptStates] = useState<AcceptStateMap>({});

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Create a set of dates that already have scheduled runs (normalized to date string)
  const scheduledDates = new Set(
    existingRuns?.map((run) => new Date(run.date).toDateString()) || []
  );

  // Create run mutation
  const createRunMutation = api.runs.create.useMutation({
    onSuccess: () => {
      // Invalidate runs query to refresh any run lists
      utils.runs.getAll.invalidate();
    },
  });

  // Handle accept button click
  const handleAccept = useCallback(
    async (suggestion: { date: Date; runType: string; distance: number; reason: string }) => {
      const dateKey = suggestion.date.toISOString();

      // Set loading state
      setAcceptStates((prev) => ({
        ...prev,
        [dateKey]: { state: "loading" },
      }));

      try {
        const durationMinutes = estimateDuration(suggestion.distance, suggestion.runType);
        const pace = calculatePace(suggestion.distance, durationMinutes);
        const duration = formatDuration(durationMinutes);

        await createRunMutation.mutateAsync({
          date: suggestion.date,
          distance: suggestion.distance,
          pace,
          duration,
          type: suggestion.runType as
            | "LONG_RUN"
            | "EASY_RUN"
            | "TEMPO_RUN"
            | "INTERVAL_RUN"
            | "RECOVERY_RUN"
            | "RACE",
          notes: suggestion.reason,
          completed: false,
        });

        // Set success state
        setAcceptStates((prev) => ({
          ...prev,
          [dateKey]: { state: "success" },
        }));
      } catch (error) {
        // Extract error message
        let errorMessage = "Failed to schedule run";
        if (error instanceof Error) {
          // Check for CONFLICT error (duplicate date)
          if (error.message.includes("already exists")) {
            errorMessage = "Run already scheduled for this date";
          } else {
            errorMessage = error.message;
          }
        }

        // Set error state
        setAcceptStates((prev) => ({
          ...prev,
          [dateKey]: { state: "error", error: errorMessage },
        }));
      }
    },
    [createRunMutation]
  );

  // Show skeleton during initial load
  if (isLoading) {
    return <SuggestionsSkeleton />;
  }

  // Show error state with retry
  if (isError) {
    return <SuggestionsError onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  // Show empty state if no suggestions
  if (!suggestions || suggestions.length === 0) {
    return <NoSuggestionsState />;
  }

  // Sort suggestions by date
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div
      className="flex gap-4 overflow-x-auto py-2 justify-center flex-wrap"
      data-testid="run-suggestions"
    >
      {sortedSuggestions.map((suggestion) => {
        const suggestionDate = new Date(suggestion.date);
        const dateKey = suggestionDate.toISOString();
        const acceptState = acceptStates[dateKey];

        // Check if this date already has a scheduled run
        const isAlreadyScheduled = scheduledDates.has(suggestionDate.toDateString());

        // Determine the effective state: already scheduled takes precedence
        const effectiveState: AcceptState = isAlreadyScheduled
          ? "success"
          : acceptState?.state || "idle";

        return (
          <RunSuggestionCard
            key={dateKey}
            suggestion={{
              ...suggestion,
              date: suggestionDate,
            }}
            isAuthenticated={isAuthenticated}
            onAccept={() =>
              handleAccept({
                date: suggestionDate,
                runType: suggestion.runType,
                distance: suggestion.distance,
                reason: suggestion.reason,
              })
            }
            acceptState={effectiveState}
            acceptError={acceptState?.error}
          />
        );
      })}
    </div>
  );
}
