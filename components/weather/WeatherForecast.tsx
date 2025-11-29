"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { WeatherDayCard } from "./WeatherDayCard";

/**
 * Loading skeleton for forecast cards
 * Shows 7 placeholder cards matching the WeatherDayCard dimensions
 */
function ForecastSkeleton() {
  return (
    <div
      className="flex gap-4 overflow-x-auto py-2 md:grid md:grid-cols-7 md:gap-5 md:overflow-visible"
      data-testid="forecast-skeleton"
    >
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="flex min-w-[120px] flex-col items-center gap-2 rounded-xl bg-[rgba(26,46,26,0.7)] backdrop-blur-sm p-4 animate-pulse"
        >
          {/* Day name placeholder */}
          <div className="h-4 w-10 rounded bg-forest-deep/50" />
          {/* Date placeholder */}
          <div className="h-3 w-12 rounded bg-forest-deep/50" />
          {/* Icon placeholder */}
          <div className="h-8 w-8 rounded-full bg-forest-deep/50" />
          {/* Temperature placeholder */}
          <div className="h-6 w-12 rounded bg-forest-deep/50" />
          {/* Stats placeholder */}
          <div className="h-3 w-16 rounded bg-forest-deep/50" />
        </div>
      ))}
    </div>
  );
}

/**
 * Error state with retry button
 */
function ForecastError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-xl bg-[rgba(26,46,26,0.7)] backdrop-blur-sm p-6"
      data-testid="forecast-error"
    >
      <span className="text-4xl" role="img" aria-label="Warning">
        &#x26A0;&#xFE0F;
      </span>
      <p className="text-text-primary/80">Unable to load forecast</p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="forecast-retry-button"
      >
        {isRetrying ? "Retrying..." : "Retry"}
      </button>
    </div>
  );
}

/**
 * Empty state when no forecast data is available
 */
function ForecastEmpty() {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-xl bg-[rgba(26,46,26,0.7)] backdrop-blur-sm p-6"
      data-testid="forecast-empty"
    >
      <span className="text-4xl" role="img" aria-label="No data">
        &#x1F4AD;
      </span>
      <p className="text-text-primary/80">No forecast data available</p>
    </div>
  );
}

interface WeatherForecastProps {
  /** Callback when a day is selected, receives the weather data for that day */
  // eslint-disable-next-line no-unused-vars
  onDaySelect?: (day: { condition: string; datetime: Date }) => void;
}

/**
 * Weather forecast component displaying 7-day forecast
 * Grid layout on desktop, horizontal scroll on mobile
 * Manages selection state and fetches data via tRPC
 */
export function WeatherForecast({ onDaySelect }: WeatherForecastProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const {
    data: forecast,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = api.weather.getForecast.useQuery({ days: 7 });

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    if (forecast && forecast[index]) {
      onDaySelect?.({ condition: forecast[index].condition, datetime: forecast[index].datetime });
    }
  };

  // Notify parent of initial selection when forecast loads
  useEffect(() => {
    if (forecast && forecast.length > 0 && onDaySelect) {
      onDaySelect({ condition: forecast[0].condition, datetime: forecast[0].datetime });
    }
  }, [forecast, onDaySelect]);

  // Show skeleton during initial load
  if (isLoading) {
    return <ForecastSkeleton />;
  }

  // Show error state with retry
  if (isError) {
    return <ForecastError onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  // Show empty state if no data
  if (!forecast || forecast.length === 0) {
    return <ForecastEmpty />;
  }

  return (
    <div
      className="flex gap-4 overflow-x-auto py-2 md:grid md:grid-cols-7 md:gap-5 md:overflow-visible"
      data-testid="weather-forecast"
    >
      {forecast.map((day, index) => (
        <WeatherDayCard
          key={day.datetime.toISOString()}
          datetime={day.datetime}
          condition={day.condition}
          temperature={day.temperature}
          precipitation={day.precipitation}
          windSpeed={day.windSpeed}
          isSelected={selectedIndex === index}
          onSelect={() => handleSelect(index)}
        />
      ))}
    </div>
  );
}
