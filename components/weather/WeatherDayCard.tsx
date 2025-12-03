"use client";

import { WeatherIcon } from "./WeatherIcon";
import { cn } from "@/lib/utils";

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
      className={cn(
        "flex flex-col items-center backdrop-blur-md shadow-none transition-all duration-200 ease-out focus:outline-none",
        "min-w-[130px] py-5 px-4 rounded-lg mx-1",
        isSelected
          ? "bg-forest-deep/75 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.4)]"
          : "bg-forest-deep/50 hover:bg-forest-deep/65"
      )}
      data-testid="weather-day-card"
      aria-pressed={isSelected}
    >
      {/* Day name */}
      <span className="text-white text-sm font-semibold">{getDayName(datetime)}</span>

      {/* Date */}
      <span className="text-white/60 text-xs mb-2">{getShortDate(datetime)}</span>

      {/* Weather icon */}
      <div className="my-2">
        <WeatherIcon condition={condition} className="text-3xl" />
      </div>

      {/* Temperature */}
      <span className="text-white text-2xl font-bold mb-2">{Math.round(temperature)}&deg;C</span>

      {/* Precipitation and wind */}
      <div className="flex items-center gap-3 text-white/80 text-xs">
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
