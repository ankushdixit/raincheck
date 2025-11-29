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
      className="flex flex-col items-center backdrop-blur-md border-0 shadow-none transition-all duration-200 ease-out focus:outline-none"
      style={{
        minWidth: "130px",
        padding: "20px 16px",
        backgroundColor: isSelected ? "rgba(10,15,10,0.75)" : "rgba(10,15,10,0.5)",
        borderRadius: "0.5rem",
        margin: "0 4px",
        boxShadow: isSelected ? "inset 0 0 0 2px rgba(255,255,255,0.4)" : "none",
        border: "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "rgba(10,15,10,0.65)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isSelected
          ? "rgba(10,15,10,0.75)"
          : "rgba(10,15,10,0.5)";
        e.currentTarget.style.borderColor = "transparent";
      }}
      data-testid="weather-day-card"
      aria-pressed={isSelected}
    >
      {/* Day name */}
      <span style={{ color: "white", fontSize: "0.875rem", fontWeight: 600 }}>
        {getDayName(datetime)}
      </span>

      {/* Date */}
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", marginBottom: "8px" }}>
        {getShortDate(datetime)}
      </span>

      {/* Weather icon */}
      <div style={{ margin: "8px 0" }}>
        <WeatherIcon condition={condition} className="text-3xl" />
      </div>

      {/* Temperature */}
      <span style={{ color: "white", fontSize: "1.5rem", fontWeight: 700, marginBottom: "8px" }}>
        {Math.round(temperature)}&deg;C
      </span>

      {/* Precipitation and wind */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "rgba(255,255,255,0.8)",
          fontSize: "0.75rem",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span role="img" aria-label="Precipitation">
            &#x1F4A7;
          </span>
          {Math.round(precipitation)}%
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span role="img" aria-label="Wind">
            &#x1F4A8;
          </span>
          {Math.round(windSpeed)}
        </span>
      </div>
    </button>
  );
}
