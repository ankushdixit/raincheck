"use client";

import { api } from "@/lib/api";

/** Phase type from the database */
type Phase = "BASE_BUILDING" | "BASE_EXTENSION" | "RECOVERY" | "SPEED_DEVELOPMENT" | "PEAK_TAPER";

/** Color mapping for each training phase */
const PHASE_COLORS: Record<Phase, string> = {
  BASE_BUILDING: "#3b82f6", // Blue
  BASE_EXTENSION: "#22c55e", // Green
  RECOVERY: "#14b8a6", // Teal
  SPEED_DEVELOPMENT: "#f97316", // Orange
  PEAK_TAPER: "#f59e0b", // Amber
};

/**
 * Format phase enum to human-readable string.
 * Converts "BASE_BUILDING" → "Base Building"
 */
export function formatPhaseName(phase: Phase): string {
  return phase
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Get the color hex code for a phase
 */
export function getPhaseColor(phase: Phase): string {
  return PHASE_COLORS[phase];
}

/**
 * Loading skeleton for the phase badge
 */
function PhaseBadgeSkeleton() {
  return (
    <div
      className="inline-flex h-6 w-28 animate-pulse rounded-full bg-forest-deep/50"
      data-testid="phase-badge-skeleton"
    />
  );
}

/**
 * PhaseBadge component
 *
 * Displays the current training phase as a colored pill/badge.
 * Each phase has a distinct color to help runners quickly identify
 * their current training focus.
 */
export function PhaseBadge() {
  const { data: phaseData, isLoading } = api.planning.getCurrentPhase.useQuery();

  if (isLoading) {
    return <PhaseBadgeSkeleton />;
  }

  // If no training plan, don't render anything
  if (!phaseData) {
    return null;
  }

  const { phase } = phaseData;
  const color = getPhaseColor(phase as Phase);
  const displayName = formatPhaseName(phase as Phase);

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
      data-testid="phase-badge"
      data-phase={phase}
    >
      {displayName}
    </span>
  );
}
