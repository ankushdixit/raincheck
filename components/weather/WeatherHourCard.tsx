"use client";

import { WeatherIcon } from "./WeatherIcon";
import { cn } from "@/lib/utils";

interface WeatherHourCardProps {
  time: Date;
  condition: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  onSelect?: () => void;
}

/**
 * Format time to hour (e.g., "2 PM", "10 AM")
 */
function formatHour(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
  });
}

/**
 * Check if the given date is today or tomorrow
 */
function getDayLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cardDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (cardDate.getTime() === today.getTime()) {
    return "Today";
  }
  return "Tomorrow";
}

/**
 * Individual weather card for a single hour
 * Displays hour, Today/Tomorrow label, weather icon, temperature, precipitation, and wind
 * Clickable to trigger background effect changes
 */
export function WeatherHourCard({
  time,
  condition,
  temperature,
  precipitation,
  windSpeed,
  onSelect,
}: WeatherHourCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center backdrop-blur-md transition-all duration-200 ease-out",
        "min-w-[130px] 2xl:min-w-0 2xl:w-full py-6 px-4 rounded-lg cursor-pointer",
        "hover:bg-forest-deep/65 focus:outline-none",
        "bg-forest-deep/50"
      )}
      data-testid="weather-hour-card"
    >
      {/* Hour label */}
      <span className="text-white text-sm font-semibold">{formatHour(time)}</span>

      {/* Today/Tomorrow label */}
      <span className="text-white/60 text-xs mb-2">{getDayLabel(time)}</span>

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
