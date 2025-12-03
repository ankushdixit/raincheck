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
 * Get score color class based on value.
 */
function getScoreColorClass(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  if (score >= 40) return "text-orange-400";
  return "text-error";
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
  acceptState = "idle",
  acceptError,
}: RunSuggestionCardProps) {
  const { date, runType, distance, weatherScore, isOptimal, reason, weather, timeRange } =
    suggestion;
  const isLongRun = runType === "LONG_RUN";
  const isAccepted = acceptState === "success";
  const isLoading = acceptState === "loading";
  const hasError = acceptState === "error";
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
      className={cn(
        "flex flex-col items-center backdrop-blur-md transition-all duration-200 ease-out relative",
        "min-w-[130px] py-5 px-4 rounded-lg mx-1",
        "bg-forest-deep/50 border-2",
        isLongRun ? "border-warning/50" : "border-transparent",
        isAccepted && "opacity-60"
      )}
      data-testid="run-suggestion-card"
      data-run-type={runType}
      data-accepted={isAccepted}
    >
      {/* Info icon for reasoning tooltip - positioned in top right corner */}
      <button
        ref={buttonRef}
        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center transition-colors bg-white/15 text-white/70 text-[10px]"
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
            className="fixed z-50 shadow-xl backdrop-blur-md pointer-events-none w-[280px] p-4 bg-forest-dark/95 rounded-xl"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
            data-testid="reason-tooltip"
          >
            <p className="text-sm text-white/90 leading-relaxed">{reason}</p>
          </div>,
          document.body
        )}

      {/* Day name */}
      <span className="text-white text-sm font-semibold">{getDayName(date)}</span>

      {/* Date */}
      <span className="text-white/60 text-xs mb-1">{getShortDate(date)}</span>

      {/* Time range */}
      {timeRange && (
        <span className="text-white/50 text-[10px] mb-1" data-testid="time-range">
          {timeRange.start} - {timeRange.end}
        </span>
      )}

      {/* Run type icon */}
      <div className="my-1.5">
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
      <div className="flex items-baseline gap-1 mb-1">
        <span
          className={cn("text-2xl font-bold", getScoreColorClass(weatherScore))}
          data-testid="score-badge"
        >
          {weatherScore}
        </span>
        <span className="text-white/60 text-xs">/100</span>
      </div>

      {/* Optimal badge */}
      {isOptimal && (
        <span
          className="text-success text-[10px] font-semibold tracking-wide mb-1"
          data-testid="optimal-badge"
        >
          OPTIMAL
        </span>
      )}

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

      {/* Accept Button (Phase 5, authenticated only) */}
      {isAuthenticated && onAccept && (
        <div className="mt-3 flex flex-col items-center gap-1">
          <button
            onClick={onAccept}
            disabled={isLoading || isAccepted}
            className={cn(
              "px-3 py-1.5 text-white rounded-md text-xs font-medium border-none flex items-center gap-1.5",
              isAccepted
                ? "bg-green-500/80 cursor-not-allowed"
                : "bg-amber-600/80 cursor-pointer hover:bg-amber-500/80",
              isLoading && "opacity-70 cursor-not-allowed"
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
              className="text-error text-[10px] text-center max-w-[120px]"
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
      className="flex flex-col items-center rounded-lg animate-pulse min-w-[130px] py-5 px-4 bg-forest-deep/50 mx-1 border-2 border-transparent"
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
