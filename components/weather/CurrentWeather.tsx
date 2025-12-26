"use client";

import { api } from "@/lib/api";
import { WeatherIcon } from "./WeatherIcon";

/**
 * Loading skeleton that matches the weather card layout
 */
function WeatherSkeleton() {
  return (
    <div
      className="w-full max-w-sm rounded-lg bg-forest-deep/50 backdrop-blur-md p-6"
      data-testid="weather-skeleton"
    >
      <div className="flex flex-col items-center gap-4 animate-pulse">
        {/* Icon placeholder */}
        <div className="h-16 w-16 rounded-full bg-forest-deep/50" />

        {/* Temperature placeholder */}
        <div className="h-10 w-24 rounded bg-forest-deep/50" />

        {/* Stats row placeholder */}
        <div className="flex w-full justify-center gap-8">
          <div className="h-6 w-16 rounded bg-forest-deep/50" />
          <div className="h-6 w-20 rounded bg-forest-deep/50" />
        </div>

        {/* Location placeholder */}
        <div className="h-5 w-32 rounded bg-forest-deep/50" />
      </div>
    </div>
  );
}

/**
 * Error state with retry button
 */
function WeatherError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div
      className="w-full max-w-sm rounded-lg bg-forest-deep/50 backdrop-blur-md p-6"
      data-testid="weather-error"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Warning icon */}
        <span className="text-5xl" role="img" aria-label="Warning">
          &#x26A0;&#xFE0F;
        </span>

        <p className="text-text-primary/80">Unable to load weather</p>

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
 * Current weather display component
 * Fetches weather data via tRPC and displays with loading/error states
 */
export function CurrentWeather() {
  const {
    data: weather,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = api.weather.getCurrentWeather.useQuery({});

  // Show skeleton during initial load
  if (isLoading) {
    return <WeatherSkeleton />;
  }

  // Show error state with retry
  if (isError || !weather) {
    return <WeatherError onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  // Success state - display weather data
  return (
    <div
      className="w-full max-w-sm rounded-lg bg-forest-deep/50 backdrop-blur-md p-6"
      data-testid="weather-card"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Weather icon */}
        <WeatherIcon condition={weather.condition} className="text-6xl" />

        {/* Temperature */}
        <p className="text-4xl font-bold text-text-primary">
          {Math.round(weather.temperature)}&deg;C
        </p>

        {/* Precipitation and wind */}
        <div className="flex items-center gap-6 text-text-primary/80">
          <span className="flex items-center gap-1">
            <span role="img" aria-label="Precipitation">
              &#x1F4A7;
            </span>
            {Math.round(weather.precipitation)}%
          </span>
          <span className="flex items-center gap-1">
            <span role="img" aria-label="Wind">
              &#x1F4A8;
            </span>
            {Math.round(weather.windSpeed)} km/h
          </span>
        </div>

        {/* Location */}
        <p className="text-sm text-text-primary/60">{weather.location}</p>
      </div>
    </div>
  );
}
