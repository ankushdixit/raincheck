"use client";

import Link from "next/link";
import { ExternalLink, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import {
  calculateDistanceProgress,
  calculatePaceProgress,
  calculateTargetPace,
} from "@/components/countdown/TrainingProgress";
import { formatPhaseName } from "@/components/countdown/PhaseBadge";
import { calculateDaysUntil, formatRaceDate } from "@/components/countdown/RaceCountdown";

/** Half marathon distance in kilometers */
const HALF_MARATHON_KM = 21.1;

/** Phase type from the database */
type Phase = "BASE_BUILDING" | "BASE_EXTENSION" | "SPEED_DEVELOPMENT" | "PEAK_TAPER";

/**
 * Shared box container styles
 */
function InfoBox({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 rounded-lg bg-forest-deep/50 backdrop-blur-md p-5">{children}</div>;
}

/**
 * Skeleton loader for info boxes
 */
function InfoBoxSkeleton() {
  return (
    <div className="flex-1 rounded-lg bg-forest-deep/50 backdrop-blur-md p-5 animate-pulse">
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-32 rounded bg-white/10" />
      </div>
    </div>
  );
}

/**
 * Format a date range as "Dec 15 - Jan 5"
 */
function formatDateRange(start: Date, end: Date): string {
  const startStr = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${startStr} - ${endStr}`;
}

/**
 * Box 1: Phase Info
 * Shows current phase and next two phases with date ranges
 * Links to the Training Phases detail page
 */
function PhaseInfoBox() {
  const { data: phaseData, isLoading } = api.planning.getCurrentPhase.useQuery();

  if (isLoading) {
    return <InfoBoxSkeleton />;
  }

  const currentPhase = (phaseData?.phase as Phase) ?? "BASE_BUILDING";
  const nextPhases = phaseData?.nextPhases ?? [];

  return (
    <Link
      href="/training-phases"
      className="flex-1 rounded-lg bg-forest-deep/50 backdrop-blur-md p-5 transition-all duration-200 hover:bg-forest-deep/70 hover:scale-[1.01] group"
    >
      <div className="flex h-full">
        {/* Current Phase - Left Side */}
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-white/60">Current Phase</p>
          <p className="mt-1 text-xl font-bold text-white">{formatPhaseName(currentPhase)}</p>
        </div>

        {/* Next Phases - Right Side */}
        <div className="flex-1 flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-white/60">Coming Up</p>
          {nextPhases.length > 0 ? (
            nextPhases.map((np, index) => (
              <div key={index} className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-white/80">{formatPhaseName(np.phase as Phase)}</span>
                <span className="text-xs text-white/50">
                  {formatDateRange(np.startDate, np.endDate)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/80">Final Phase</p>
          )}
        </div>

        {/* Hover indicator */}
        <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-5 w-5 text-white/60" />
        </div>
      </div>
    </Link>
  );
}

/**
 * Box 2: Progress Bars
 * Shows longest run and best pace progress
 */
function ProgressBarsBox() {
  const { data: progressStats, isLoading: isLoadingStats } = api.runs.getProgressStats.useQuery();
  const { data: settings, isLoading: isLoadingSettings } = api.settings.get.useQuery();

  if (isLoadingStats || isLoadingSettings) {
    return <InfoBoxSkeleton />;
  }

  const targetTime = settings?.targetTime ?? "2:00:00";
  const targetPace = calculateTargetPace(targetTime);
  const longestDistance = progressStats?.longestRunDistance ?? 0;
  const bestPace = progressStats?.bestLongRunPace ?? null;

  const distanceProgress = calculateDistanceProgress(longestDistance);
  const paceProgress = bestPace ? calculatePaceProgress(bestPace, targetPace) : 0;

  return (
    <InfoBox>
      <div className="flex h-full flex-col justify-center gap-3">
        {/* Longest Run Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs uppercase tracking-wide text-white/60">Longest Run</span>
            <span className="text-xs text-white/60">
              {longestDistance > 0 ? longestDistance.toFixed(1) : "0"} / {HALF_MARATHON_KM} km
            </span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-white/10">
            <div
              className="h-3.5 rounded-full bg-green-500/90 transition-all duration-500"
              style={{ width: `${distanceProgress}%` }}
            />
          </div>
        </div>

        {/* Best Pace Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs uppercase tracking-wide text-white/60">Best Pace</span>
            <span className="text-xs text-white/60">
              {bestPace ?? "--:--"} → {targetPace}/km
            </span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-white/10">
            <div
              className="h-3.5 rounded-full bg-blue-500/90 transition-all duration-500"
              style={{ width: `${paceProgress}%` }}
            />
          </div>
        </div>
      </div>
    </InfoBox>
  );
}

/** Race registration page URL */
const RACE_URL = "https://eventmaster.ie/event/RQeJHL5h76";

/**
 * Split race name into main name and edition/subtitle
 * Handles patterns like "Life Style Sports Fastlane Summer Edition 2026"
 */
function splitRaceName(raceName: string): { mainName: string; subtitle: string | null } {
  // Check for " - " separator first
  if (raceName.includes(" - ")) {
    const [main, sub] = raceName.split(" - ");
    return { mainName: main, subtitle: sub };
  }

  // Check for "Edition" pattern (e.g., "Summer Edition 2026")
  const editionMatch = raceName.match(
    /^(.+?)\s+((?:Summer|Winter|Spring|Autumn|Fall)\s+Edition\s+\d{4})$/i
  );
  if (editionMatch) {
    return { mainName: editionMatch[1], subtitle: editionMatch[2] };
  }

  return { mainName: raceName, subtitle: null };
}

/**
 * Box 3: Race Countdown
 * Shows days until race with race details
 */
function RaceCountdownBox() {
  const { data: settings, isLoading } = api.settings.get.useQuery();

  if (isLoading) {
    return <InfoBoxSkeleton />;
  }

  const raceDate = settings ? new Date(settings.raceDate) : null;
  const daysUntil = raceDate ? calculateDaysUntil(raceDate) : null;
  const displayDays = daysUntil !== null ? Math.abs(daysUntil) : 0;

  const raceName = settings?.raceName ?? "Race Day";
  const { mainName, subtitle } = splitRaceName(raceName);

  return (
    <InfoBox>
      <div className="flex h-full items-center">
        {/* Left: Days Count */}
        <div className="flex flex-col items-center pr-6">
          <span className="text-5xl font-bold text-white">{displayDays}</span>
          <span className="text-xs text-white/60">days to go</span>
        </div>

        {/* Right: Race Details */}
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-white">{mainName}</p>
          {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
          {raceDate && (
            <p className="mt-1 text-sm font-bold text-white">{formatRaceDate(raceDate)}</p>
          )}
        </div>

        {/* External Link Icon */}
        <a
          href={RACE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="View race details"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </InfoBox>
  );
}

/**
 * InfoBoxes component
 * Three-column row on large desktop, stacked on smaller screens
 */
export function InfoBoxes() {
  return (
    <div
      className="flex flex-col xl:flex-row w-full gap-4 xl:gap-5 px-4 sm:px-6 lg:px-10 mb-5"
      data-testid="info-boxes"
    >
      <PhaseInfoBox />
      <ProgressBarsBox />
      <RaceCountdownBox />
    </div>
  );
}
