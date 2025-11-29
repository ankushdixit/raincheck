"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { RunType } from "@prisma/client";

export interface TimeRange {
  start: string;
  end: string;
}

export interface RunSuggestionCardProps {
  suggestion: {
    date: Date;
    runType: RunType;
    distance: number;
    weatherScore: number;
    isOptimal: boolean;
    reason: string;
    weather: {
      condition: string;
      temperature: number;
      precipitation: number;
      windSpeed: number;
    };
    timeRange?: TimeRange;
  };
  isAuthenticated?: boolean;
  onAccept?: () => void;
}

/**
 * Get score color based on value.
 */
function getScoreColor(score: number): string {
  if (score >= 80) return "rgba(74, 222, 128, 1)"; // green-400
  if (score >= 60) return "rgba(250, 204, 21, 1)"; // yellow-400
  if (score >= 40) return "rgba(251, 146, 60, 1)"; // orange-400
  return "rgba(248, 113, 113, 1)"; // red-400
}

/**
 * Get icon for run type.
 */
function getRunTypeIcon(runType: RunType): string {
  switch (runType) {
    case "LONG_RUN":
      return "🏃";
    case "EASY_RUN":
      return "🚶";
    case "TEMPO_RUN":
      return "⚡";
    case "INTERVAL_RUN":
      return "⚡";
    case "RECOVERY_RUN":
      return "💚";
    default:
      return "🏃";
  }
}

/**
 * Get label for run type.
 */
function getRunTypeLabel(runType: RunType): string {
  switch (runType) {
    case "LONG_RUN":
      return "Long";
    case "EASY_RUN":
      return "Easy";
    case "TEMPO_RUN":
      return "Tempo";
    case "INTERVAL_RUN":
      return "Intervals";
    case "RECOVERY_RUN":
      return "Recovery";
    default:
      return runType;
  }
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
 * Individual run suggestion card component.
 * Styled to match WeatherDayCard with centered vertical layout.
 */
export function RunSuggestionCard({
  suggestion,
  isAuthenticated = false,
  onAccept,
}: RunSuggestionCardProps) {
  const { date, runType, distance, weatherScore, isOptimal, reason, weather, timeRange } =
    suggestion;
  const scoreColor = getScoreColor(weatherScore);
  const isLongRun = runType === "LONG_RUN";
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  // Track mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update tooltip position when showing
  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + window.scrollY,
        left: rect.right + window.scrollX + 12,
      });
    }
  }, [showTooltip]);

  return (
    <div
      className="flex flex-col items-center backdrop-blur-md transition-all duration-200 ease-out relative"
      style={{
        minWidth: "130px",
        padding: "20px 16px",
        backgroundColor: "rgba(10,15,10,0.5)",
        borderRadius: "0.5rem",
        margin: "0 4px",
        border: isLongRun ? "2px solid rgba(251, 191, 36, 0.5)" : "2px solid transparent",
      }}
      data-testid="run-suggestion-card"
      data-run-type={runType}
    >
      {/* Info icon for reasoning tooltip - positioned in top right corner */}
      <button
        ref={buttonRef}
        className="absolute w-4 h-4 rounded-full flex items-center justify-center transition-colors"
        style={{
          top: "6px",
          right: "6px",
          backgroundColor: "rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.7)",
          fontSize: "10px",
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label="Show reasoning"
        data-testid="info-icon"
      >
        i
      </button>

      {/* Tooltip - rendered via portal to float above everything */}
      {mounted &&
        showTooltip &&
        createPortal(
          <div
            className="fixed z-50 shadow-xl backdrop-blur-md pointer-events-none"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              width: "280px",
              padding: "16px 18px",
              backgroundColor: "rgba(20, 30, 20, 0.95)",
              borderRadius: "12px",
            }}
            data-testid="reason-tooltip"
          >
            <p className="text-sm text-white/90 leading-relaxed">{reason}</p>
          </div>,
          document.body
        )}

      {/* Day name */}
      <span style={{ color: "white", fontSize: "0.875rem", fontWeight: 600 }}>
        {getDayName(date)}
      </span>

      {/* Date */}
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", marginBottom: "4px" }}>
        {getShortDate(date)}
      </span>

      {/* Time range */}
      {timeRange && (
        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.625rem",
            marginBottom: "4px",
          }}
          data-testid="time-range"
        >
          {timeRange.start} - {timeRange.end}
        </span>
      )}

      {/* Run type icon */}
      <div style={{ margin: "6px 0" }}>
        <span
          className="text-3xl"
          role="img"
          aria-label={getRunTypeLabel(runType)}
          data-testid="run-type-icon"
        >
          {getRunTypeIcon(runType)}
        </span>
      </div>

      {/* Weather Score - displayed like temperature */}
      <div className="flex items-baseline gap-1" style={{ marginBottom: "4px" }}>
        <span
          style={{
            color: scoreColor,
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
          data-testid="score-badge"
        >
          {weatherScore}
        </span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>/100</span>
      </div>

      {/* Optimal badge */}
      {isOptimal && (
        <span
          style={{
            color: "rgba(74, 222, 128, 1)",
            fontSize: "0.625rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            marginBottom: "4px",
          }}
          data-testid="optimal-badge"
        >
          OPTIMAL
        </span>
      )}

      {/* Run type and distance */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "rgba(255,255,255,0.8)",
          fontSize: "0.75rem",
          marginTop: "4px",
        }}
      >
        <span data-testid="run-type-label">{getRunTypeLabel(runType)}</span>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>•</span>
        <span data-testid="distance">{distance} km</span>
      </div>

      {/* Weather stats row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "rgba(255,255,255,0.8)",
          fontSize: "0.75rem",
          marginTop: "8px",
        }}
        data-testid="weather-summary"
      >
        <span>{Math.round(weather.temperature)}°C</span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span role="img" aria-label="Precipitation">
            💧
          </span>
          {Math.round(weather.precipitation)}%
        </span>
      </div>

      {/* Accept Button (Phase 5, authenticated only) */}
      {isAuthenticated && onAccept && (
        <button
          onClick={onAccept}
          style={{
            marginTop: "12px",
            padding: "6px 12px",
            backgroundColor: "rgba(217, 119, 6, 0.8)",
            color: "white",
            borderRadius: "0.375rem",
            fontSize: "0.75rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
          data-testid="accept-button"
        >
          Accept
        </button>
      )}
    </div>
  );
}

/**
 * Loading skeleton for RunSuggestionCard.
 */
export function RunSuggestionCardSkeleton() {
  return (
    <div
      className="flex flex-col items-center rounded-lg animate-pulse"
      style={{
        minWidth: "130px",
        padding: "20px 16px",
        backgroundColor: "rgba(10,15,10,0.5)",
        borderRadius: "0.5rem",
        margin: "0 4px",
        border: "2px solid transparent",
      }}
      data-testid="run-suggestion-skeleton"
    >
      {/* Day name placeholder */}
      <div className="h-4 w-10 rounded bg-forest-deep/50" />
      {/* Date placeholder */}
      <div className="h-3 w-12 rounded bg-forest-deep/50 mt-1" />
      {/* Time range placeholder */}
      <div className="h-2 w-14 rounded bg-forest-deep/50 mt-1" />
      {/* Icon placeholder */}
      <div className="h-8 w-8 rounded-full bg-forest-deep/50 mt-3" />
      {/* Score placeholder */}
      <div className="h-6 w-12 rounded bg-forest-deep/50 mt-3" />
      {/* Run type placeholder */}
      <div className="h-3 w-16 rounded bg-forest-deep/50 mt-2" />
      {/* Stats placeholder */}
      <div className="h-3 w-16 rounded bg-forest-deep/50 mt-2" />
    </div>
  );
}
