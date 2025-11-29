"use client";

import { WeatherIcon } from "./WeatherIcon";

interface WeatherDayCardProps {
  datetime: Date;
  condition: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Format date to day name (Mon, Tue, etc.)
 */
function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

/**
 * Format date to short date (Nov 25)
 */
function getShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Individual weather card for a single day
 * Displays day name, date, weather icon, temperature, precipitation, and wind
 * Supports hover and click interactions with selected state
 */
export function WeatherDayCard({
  datetime,
  condition,
  temperature,
  precipitation,
  windSpeed,
  isSelected,
  onSelect,
}: WeatherDayCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        flex min-w-[120px] flex-col items-center gap-2 p-4 mx-1
        backdrop-blur-md border-0 shadow-none
        transition-all duration-200 ease-out
        hover:scale-[1.02]
        focus:outline-none
      `}
      style={{
        backgroundColor: isSelected ? "rgba(10,15,10,0.7)" : "rgba(10,15,10,0.5)",
        borderRadius: "0.5rem",
        margin: "0 4px",
      }}
      data-testid="weather-day-card"
      aria-pressed={isSelected}
    >
      {/* Day name */}
      <span className="text-sm font-semibold" style={{ color: "white" }}>
        {getDayName(datetime)}
      </span>

      {/* Date */}
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
        {getShortDate(datetime)}
      </span>

      {/* Weather icon */}
      <WeatherIcon condition={condition} className="text-3xl" />

      {/* Temperature */}
      <span className="text-xl font-bold" style={{ color: "white" }}>
        {Math.round(temperature)}&deg;C
      </span>

      {/* Precipitation and wind */}
      <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
        <span className="flex items-center gap-1">
          <span role="img" aria-label="Precipitation">
            &#x1F4A7;
          </span>
          {Math.round(precipitation)}%
        </span>
        <span className="flex items-center gap-1">
          <span role="img" aria-label="Wind">
            &#x1F4A8;
          </span>
          {Math.round(windSpeed)}
        </span>
      </div>
    </button>
  );
}
