"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { RunType } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface TimeRange {
  start: string;
  end: string;
}

export type AcceptState = "idle" | "loading" | "success" | "error";

export interface RunSuggestionCardProps {
  suggestion: {
    date: Date;
    timezone: string;
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
  acceptState?: AcceptState;
  acceptError?: string;
}

/**
 * Get card colors based on weather score.
 * Red (0-40), Orange (40-60), Yellow (60-80), Green (80-100)
 */
function getScoreColors(score: number): { bg: string; scoreText: string; tooltipBg: string } {
  if (score >= 80) {
    return {
      bg: "bg-green-500/30",
      scoreText: "text-green-400",
      tooltipBg: "rgba(34, 197, 94, 0.5)",
    };
  }
  if (score >= 60) {
    return {
      bg: "bg-yellow-500/30",
      scoreText: "text-yellow-400",
      tooltipBg: "rgba(234, 179, 8, 0.5)",
    };
  }
  if (score >= 40) {
    return {
      bg: "bg-orange-500/30",
      scoreText: "text-orange-400",
      tooltipBg: "rgba(249, 115, 22, 0.5)",
    };
  }
  return {
    bg: "bg-red-500/30",
    scoreText: "text-red-400",
    tooltipBg: "rgba(239, 68, 68, 0.5)",
  };
}

/**
 * Get icon for run type.
 */
function getRunTypeIcon(runType: RunType): string {
  switch (runType) {
    case "LONG_RUN":
      return "\u{1F3C3}";
    case "EASY_RUN":
      return "\u{1F6B6}";
    case "TEMPO_RUN":
      return "\u26A1";
    case "INTERVAL_RUN":
      return "\u26A1";
    case "RECOVERY_RUN":
      return "\u{1F49A}";
    default:
      return "\u{1F3C3}";
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
 * Format date to day name (Mon, Tue, etc.) in the specified timezone
 */
function getDayName(date: Date, timezone: string): string {
  return date.toLocaleDateString("en-US", { weekday: "short", timeZone: timezone });
}

/**
 * Format date to short date (Nov 25) in the specified timezone
 */
function getShortDate(date: Date, timezone: string): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: timezone });
}

/**
 * Individual run suggestion card component.
 * Styled to match WeatherDayCard with centered vertical layout.
 */
export function RunSuggestionCard({
  suggestion,
  isAuthenticated = false,
  onAccept,
  acceptState = "idle",
  acceptError,
}: RunSuggestionCardProps) {
  const { date, timezone, runType, distance, weatherScore, reason, weather, timeRange } =
    suggestion;
  const isAccepted = acceptState === "success";
  const isLoading = acceptState === "loading";
  const hasError = acceptState === "error";
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  // Get colors based on weather score
  const colors = getScoreColors(weatherScore);

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
      className={cn(
        "flex flex-col items-center backdrop-blur-md transition-all duration-200 ease-out relative",
        "py-4 px-3 rounded-lg",
        colors.bg,
        // Add padding at bottom for the floating button
        isAuthenticated && onAccept && "pb-12"
      )}
      data-testid="run-suggestion-card"
      data-run-type={runType}
      data-accepted={isAccepted}
    >
      {/* Info icon for reasoning tooltip - positioned in top right corner */}
      <button
        ref={buttonRef}
        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center transition-colors bg-white/15 text-white/70 text-[10px] cursor-pointer"
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
            className="fixed z-50 shadow-xl backdrop-blur-md pointer-events-none w-[280px] p-4 rounded-xl"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              backgroundColor: colors.tooltipBg,
            }}
            data-testid="reason-tooltip"
          >
            <p className="text-sm text-white leading-relaxed">{reason}</p>
          </div>,
          document.body
        )}

      {/* Day name */}
      <span className="text-white text-sm font-semibold">{getDayName(date, timezone)}</span>

      {/* Date */}
      <span className="text-white/60 text-xs mb-1">{getShortDate(date, timezone)}</span>

      {/* Time range */}
      {timeRange && (
        <span className="text-white/50 text-[10px] mb-1" data-testid="time-range">
          {timeRange.start} - {timeRange.end}
        </span>
      )}

      {/* Run type icon */}
      <div className="my-1.5">
        <span
          className="text-5xl"
          role="img"
          aria-label={getRunTypeLabel(runType)}
          data-testid="run-type-icon"
        >
          {getRunTypeIcon(runType)}
        </span>
      </div>

      {/* Weather Score - displayed like temperature */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className={cn("text-2xl font-bold", colors.scoreText)} data-testid="score-badge">
          {weatherScore}
        </span>
        <span className="text-white/50 text-xs">/100</span>
      </div>

      {/* Run type and distance */}
      <div className="flex items-center gap-1.5 text-white/80 text-xs mt-1">
        <span data-testid="run-type-label">{getRunTypeLabel(runType)}</span>
        <span className="text-white/40">&bull;</span>
        <span data-testid="distance">{distance} km</span>
      </div>

      {/* Weather stats row */}
      <div
        className="flex items-center gap-3 text-white/80 text-xs mt-2"
        data-testid="weather-summary"
      >
        <span>{Math.round(weather.temperature)}&deg;C</span>
        <span className="flex items-center gap-1">
          <span role="img" aria-label="Precipitation">
            &#x1F4A7;
          </span>
          {Math.round(weather.precipitation)}%
        </span>
      </div>

      {/* Accept Button - absolutely positioned at bottom */}
      {isAuthenticated && onAccept && (
        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-1 px-2">
          <button
            onClick={onAccept}
            disabled={isLoading || isAccepted}
            className={cn(
              "w-full py-1.5 text-white rounded text-xs font-medium border-none flex items-center justify-center gap-1.5 cursor-pointer",
              isAccepted ? "bg-green-500/60" : "bg-green-500/30 hover:bg-green-500/50",
              isLoading && "opacity-70 cursor-not-allowed",
              isAccepted && "cursor-default"
            )}
            data-testid="accept-button"
          >
            {isLoading && (
              <span
                className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                data-testid="accept-spinner"
              />
            )}
            {isAccepted ? "Scheduled \u2713" : isLoading ? "Scheduling..." : "Accept & Schedule"}
          </button>
          {hasError && acceptError && (
            <span
              className="text-error text-[10px] text-center max-w-full"
              data-testid="accept-error"
            >
              {acceptError}
            </span>
          )}
        </div>
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
      className="flex flex-col items-center rounded-lg animate-pulse py-4 px-3 bg-white/10 pb-12"
      data-testid="run-suggestion-skeleton"
    >
      {/* Day name placeholder */}
      <div className="h-4 w-10 rounded bg-white/10" />
      {/* Date placeholder */}
      <div className="h-3 w-12 rounded bg-white/10 mt-1" />
      {/* Time range placeholder */}
      <div className="h-2 w-14 rounded bg-white/10 mt-1" />
      {/* Icon placeholder */}
      <div className="h-8 w-8 rounded-full bg-white/10 mt-3" />
      {/* Score placeholder */}
      <div className="h-6 w-12 rounded bg-white/10 mt-3" />
      {/* Run type placeholder */}
      <div className="h-3 w-16 rounded bg-white/10 mt-2" />
      {/* Stats placeholder */}
      <div className="h-3 w-16 rounded bg-white/10 mt-2" />
    </div>
  );
}
