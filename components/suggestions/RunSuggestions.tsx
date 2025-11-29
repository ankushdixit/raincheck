"use client";

import { api } from "@/lib/api";
import { RunSuggestionCard, RunSuggestionCardSkeleton } from "./RunSuggestionCard";

/**
 * Empty state when no suggestions available.
 */
function NoSuggestionsState() {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-xl py-8"
      style={{ backgroundColor: "rgba(26,46,26,0.7)" }}
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
      className="flex flex-col items-center gap-4 rounded-xl py-8"
      style={{ backgroundColor: "rgba(26,46,26,0.7)" }}
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
      {sortedSuggestions.map((suggestion) => (
        <RunSuggestionCard
          key={new Date(suggestion.date).toISOString()}
          suggestion={{
            ...suggestion,
            date: new Date(suggestion.date),
          }}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}
