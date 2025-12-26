"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import { WeatherDayCard } from "./WeatherDayCard";
import { WeatherHourCard } from "./WeatherHourCard";

/**
 * Loading skeleton for forecast cards
 * Shows 7 placeholder cards matching the WeatherDayCard dimensions
 */
function ForecastSkeleton() {
  return (
    <div
      className="flex gap-4 overflow-x-auto scrollbar-hide 2xl:grid 2xl:grid-cols-7 2xl:gap-5 2xl:overflow-visible"
      data-testid="forecast-skeleton"
    >
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="flex min-w-[120px] flex-col items-center gap-2 rounded-lg bg-forest-deep/50 backdrop-blur-md p-4 animate-pulse"
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
      className="flex flex-col items-center gap-4 rounded-lg bg-forest-deep/50 backdrop-blur-md p-6"
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
      className="flex flex-col items-center gap-4 rounded-lg bg-forest-deep/50 backdrop-blur-md p-6"
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
  /** Callback when a day/hour is selected, receives the weather data and index */
  // eslint-disable-next-line no-unused-vars
  onDaySelect?: (day: { condition: string; datetime: Date }, index: number) => void;
  /** Externally controlled selection index (null = no selection highlight) */
  selectedIndex?: number | null;
}

/**
 * Weather forecast component displaying 7-day forecast
 * Grid layout on desktop, horizontal scroll on mobile
 * Supports both controlled and uncontrolled selection
 * Includes expand/collapse functionality for hourly view of today
 */
export function WeatherForecast({
  onDaySelect,
  selectedIndex: controlledIndex,
}: WeatherForecastProps) {
  // Internal state for uncontrolled mode
  const [internalIndex, setInternalIndex] = useState<number | null>(null);
  // Expanded state for hourly view
  const [isExpanded, setIsExpanded] = useState(false);
  // Track if animation is in progress
  const [isAnimating, setIsAnimating] = useState(false);

  // Use controlled index if provided, otherwise use internal state
  const isControlled = controlledIndex !== undefined;
  const selectedIndex = isControlled ? controlledIndex : internalIndex;

  const {
    data: forecast,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = api.weather.getForecast.useQuery({ days: 7 });

  // Fetch hourly data (always fetch to have it ready for animation)
  const { data: hourlyForecast, isLoading: isHourlyLoading } =
    api.weather.getHourlyForecast.useQuery({ hours: 7 });

  const handleDaySelect = (index: number) => {
    if (!isControlled) {
      setInternalIndex(index);
    }
    if (forecast && forecast[index]) {
      onDaySelect?.(
        { condition: forecast[index].condition, datetime: forecast[index].datetime },
        index
      );
    }
  };

  const handleHourSelect = (index: number) => {
    // When hourly card is clicked, trigger background effect change
    if (hourlyForecast && hourlyForecast[index]) {
      const hour = hourlyForecast[index];
      onDaySelect?.({ condition: hour.condition, datetime: new Date(hour.time) }, index);
    }
  };

  const handleToggleExpand = () => {
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 400);
  };

  // No auto-selection on load - let parent control initial state
  useEffect(() => {
    // Only auto-select in uncontrolled mode if nothing selected
    if (!isControlled && internalIndex === null && forecast && forecast.length > 0) {
      // Don't auto-select, leave as null so no card is highlighted initially
    }
  }, [forecast, isControlled, internalIndex]);

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
    <div data-testid="weather-forecast" className="space-y-3">
      {/* Main forecast row */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide 2xl:grid 2xl:grid-cols-7 2xl:gap-4 2xl:overflow-visible">
        {isExpanded ? (
          // Hourly view: All 7 hourly cards
          <>
            {isHourlyLoading ? (
              // Show skeleton while loading
              Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 rounded-lg bg-forest-deep/50 backdrop-blur-md py-6 px-4 animate-pulse"
                  style={{
                    animation: `slideInFromLeft 0.3s ease-out ${index * 0.05}s both`,
                  }}
                >
                  <div className="h-4 w-10 rounded bg-white/10" />
                  <div className="h-3 w-8 rounded bg-white/10" />
                  <div className="h-8 w-8 rounded-full bg-white/10" />
                  <div className="h-6 w-12 rounded bg-white/10" />
                  <div className="h-3 w-16 rounded bg-white/10" />
                </div>
              ))
            ) : hourlyForecast && hourlyForecast.length > 0 ? (
              // Show all 7 hourly cards
              hourlyForecast.slice(0, 7).map((hour, index) => (
                <div
                  key={new Date(hour.time).toISOString()}
                  className={`transition-all duration-300 ${
                    isAnimating ? "animate-slideInFromLeft" : ""
                  }`}
                  style={{
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  <WeatherHourCard
                    time={new Date(hour.time)}
                    condition={hour.condition}
                    temperature={hour.temperature}
                    precipitation={hour.precipitation}
                    windSpeed={hour.windSpeed}
                    onSelect={() => handleHourSelect(index)}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-7 flex items-center justify-center text-white/60 py-4 px-8">
                No hourly data available
              </div>
            )}
          </>
        ) : (
          // Daily view: All 7 day cards
          forecast.map((day, index) => (
            <div
              key={day.datetime.toISOString()}
              className={`transition-all duration-300 ${
                isAnimating && index > 0 ? "animate-slideInFromRight" : ""
              }`}
              style={{
                animationDelay: index > 0 ? `${(index - 1) * 0.05}s` : "0s",
              }}
            >
              <WeatherDayCard
                datetime={day.datetime}
                timezone={day.timezone}
                condition={day.condition}
                temperature={day.temperature}
                precipitation={day.precipitation}
                windSpeed={day.windSpeed}
                isSelected={selectedIndex === index}
                onSelect={() => handleDaySelect(index)}
                dayIndex={index}
              />
            </div>
          ))
        )}
      </div>

      {/* Expand/Collapse button */}
      <button
        onClick={handleToggleExpand}
        disabled={!isExpanded && isHourlyLoading}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-amber-500/50 hover:bg-amber-500/70 backdrop-blur-md text-white text-xs font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid={isExpanded ? "forecast-collapse-button" : "forecast-expand-button"}
      >
        {isExpanded ? (
          <>
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>See Daily Forecast</span>
          </>
        ) : (
          <>
            <span>See Hourly Forecast</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        )}
      </button>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInFromLeft {
          animation: slideInFromLeft 0.3s ease-out forwards;
        }
        .animate-slideInFromRight {
          animation: slideInFromRight 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
