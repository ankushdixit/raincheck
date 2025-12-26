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
      className="flex flex-col items-center gap-4 rounded-lg py-8 bg-forest-deep/50 backdrop-blur-md"
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
      className="flex flex-col items-center gap-4 rounded-lg py-8 bg-forest-deep/50 backdrop-blur-md"
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
 * Horizontal scroll on mobile/tablet, 6-column grid on large desktop.
 */
function SuggestionsSkeleton() {
  return (
    <div
      className="flex gap-3 overflow-x-auto scrollbar-hide xl:grid xl:grid-cols-6 xl:overflow-visible"
      data-testid="suggestions-skeleton"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="min-w-[140px] xl:min-w-0">
          <RunSuggestionCardSkeleton />
        </div>
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
  } = api.planning.generateSuggestions.useQuery({ days: 21 });

  // Fetch weather forecast for all dates (needed for accepted runs weather display)
  const { data: weatherForecast } = api.weather.getForecast.useQuery({ days: 21 });

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
      // Invalidate suggestions to regenerate based on new accepted run
      utils.planning.generateSuggestions.invalidate();
      // Invalidate stats to update training phases page
      utils.stats.getTrainingPhases.invalidate();
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

  // Show empty state if no suggestions and no accepted runs
  if ((!suggestions || suggestions.length === 0) && (!existingRuns || existingRuns.length === 0)) {
    return <NoSuggestionsState />;
  }

  // Filter out today's suggestions, sort by date
  // Use date string comparison (YYYY-MM-DD) to avoid timezone issues
  const today = new Date();
  const todayString = today.toISOString().split("T")[0]; // "YYYY-MM-DD"

  // Create a map of dates to weather data from forecast
  type WeatherForecastType = NonNullable<typeof weatherForecast>[number];
  const forecastByDate = new Map<string, WeatherForecastType>();
  (weatherForecast || []).forEach((w) => {
    const dateKey = new Date(w.datetime).toISOString().split("T")[0];
    forecastByDate.set(dateKey!, w);
  });

  // Create a map of suggestion dates to suggestion data
  type SuggestionType = NonNullable<typeof suggestions>[number];
  const suggestionByDate = new Map<string, SuggestionType>();
  (suggestions || []).forEach((s) => {
    const dateKey = new Date(s.date).toISOString().split("T")[0];
    suggestionByDate.set(dateKey!, s);
  });

  // Convert accepted runs to suggestion format, using real weather data when available
  const acceptedRunsAsSuggestions = (existingRuns || [])
    .filter((run) => {
      const runDateString = new Date(run.date).toISOString().split("T")[0];
      return runDateString > todayString;
    })
    .map((run) => {
      const runDateString = new Date(run.date).toISOString().split("T")[0]!;

      // Try suggestion data first (has pre-calculated scores), then fall back to forecast
      const suggestionData = suggestionByDate.get(runDateString);
      const forecastData = forecastByDate.get(runDateString);

      // Build weather object from available data
      const weather = suggestionData?.weather ?? {
        condition: forecastData?.condition ?? "Unknown",
        temperature: Math.round(forecastData?.temperature ?? 0),
        precipitation: Math.round(forecastData?.precipitation ?? 0),
        windSpeed: Math.round(forecastData?.windSpeed ?? 0),
      };

      // Use suggestion score if available, otherwise estimate from forecast
      let score = suggestionData?.weatherScore ?? 75;
      if (!suggestionData && forecastData) {
        // Simple score estimation based on precipitation and wind
        const precipPenalty = Math.min(60, (forecastData.precipitation / 100) * 60);
        const windPenalty = Math.min(30, (forecastData.windSpeed / 50) * 30);
        score = Math.max(0, Math.round(100 - precipPenalty - windPenalty));
      }

      // Generate reason from current weather
      const quality =
        score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Challenging";
      const reason = `${quality} conditions (${score}/100). ${weather.condition}, ${weather.temperature}°C.`;

      return {
        date: new Date(run.date),
        timezone: suggestionData?.timezone || forecastData?.timezone || "Europe/Dublin",
        runType: run.type,
        distance: run.distance,
        weatherScore: score,
        isOptimal: score >= 80,
        reason,
        weather,
        timeRange: suggestionData?.timeRange ?? { start: "10am", end: "1pm" },
        isAccepted: true as const, // Mark as already accepted
      };
    });

  // Get dates of accepted runs to exclude from new suggestions
  const acceptedDates = new Set(
    acceptedRunsAsSuggestions.map((s) => new Date(s.date).toISOString().split("T")[0])
  );

  // Filter new suggestions: only future dates not already accepted
  const newSuggestions = (suggestions || [])
    .filter((s) => {
      const suggestionDateString = new Date(s.date).toISOString().split("T")[0];
      return suggestionDateString > todayString && !acceptedDates.has(suggestionDateString);
    })
    .map((s) => ({ ...s, isAccepted: false as const }));

  // Combine accepted runs with new suggestions, sort by date, take first 6
  const sortedSuggestions = [...acceptedRunsAsSuggestions, ...newSuggestions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  // Show empty state if no future suggestions
  if (sortedSuggestions.length === 0) {
    return <NoSuggestionsState />;
  }

  return (
    <div
      className="flex gap-3 overflow-x-auto scrollbar-hide xl:grid xl:grid-cols-6 xl:overflow-visible"
      data-testid="run-suggestions"
    >
      {sortedSuggestions.map((suggestion) => {
        const suggestionDate = new Date(suggestion.date);
        const dateKey = suggestionDate.toISOString();
        const acceptState = acceptStates[dateKey];

        // Check if this is an already accepted run or has been accepted in this session
        const isAlreadyAccepted = "isAccepted" in suggestion && suggestion.isAccepted;
        const isAlreadyScheduled = scheduledDates.has(suggestionDate.toDateString());

        // Determine the effective state: already accepted/scheduled takes precedence
        const effectiveState: AcceptState =
          isAlreadyAccepted || isAlreadyScheduled ? "success" : acceptState?.state || "idle";

        return (
          <div key={dateKey} className="min-w-[140px] xl:min-w-0 flex-shrink-0 xl:flex-shrink">
            <RunSuggestionCard
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
          </div>
        );
      })}
    </div>
  );
}
