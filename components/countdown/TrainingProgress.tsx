"use client";

import { api } from "@/lib/api";

/** Half marathon distance in kilometers */
const HALF_MARATHON_KM = 21.1;

/**
 * Parse a time string (H:MM:SS or HH:MM:SS) to total minutes
 */
export function parseTimeToMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  if (parts.length === 3) {
    // H:MM:SS or HH:MM:SS
    const [hours, minutes, seconds] = parts;
    return (hours ?? 0) * 60 + (minutes ?? 0) + (seconds ?? 0) / 60;
  } else if (parts.length === 2) {
    // MM:SS (pace format)
    const [minutes, seconds] = parts;
    return (minutes ?? 0) + (seconds ?? 0) / 60;
  }
  return 0;
}

/**
 * Convert minutes per km to a formatted pace string (M:SS)
 */
export function formatPace(minutesPerKm: number): string {
  const mins = Math.floor(minutesPerKm);
  const secs = Math.round((minutesPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Calculate target pace from target time and distance
 * @param targetTime - Target finish time in H:MM:SS format
 * @returns Pace in M:SS format
 */
export function calculateTargetPace(targetTime: string): string {
  const totalMinutes = parseTimeToMinutes(targetTime);
  const paceMinutesPerKm = totalMinutes / HALF_MARATHON_KM;
  return formatPace(paceMinutesPerKm);
}

/**
 * Calculate distance progress percentage (0-100)
 */
export function calculateDistanceProgress(currentKm: number): number {
  if (currentKm <= 0) return 0;
  if (currentKm >= HALF_MARATHON_KM) return 100;
  return (currentKm / HALF_MARATHON_KM) * 100;
}

/**
 * Calculate pace progress percentage (0-100)
 * Note: Lower pace is better, so we invert the calculation
 */
export function calculatePaceProgress(currentPace: string, targetPace: string): number {
  const currentMinutes = parseTimeToMinutes(currentPace);
  const targetMinutes = parseTimeToMinutes(targetPace);

  if (currentMinutes <= 0 || targetMinutes <= 0) return 0;

  // If current pace is already at or faster than target
  if (currentMinutes <= targetMinutes) return 100;

  // Calculate how close to target (assuming starting pace of 8:00/km)
  const maxPace = 8; // 8:00/km as starting point
  const range = maxPace - targetMinutes;
  const improvement = maxPace - currentMinutes;

  if (range <= 0) return 100;
  const progress = (improvement / range) * 100;
  return Math.max(0, Math.min(100, progress));
}

/**
 * Loading skeleton for progress metrics
 */
function ProgressSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse" data-testid="progress-skeleton">
      {/* Distance metric skeleton */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-32 rounded bg-forest-deep/50" />
          <div className="h-4 w-20 rounded bg-forest-deep/50" />
        </div>
        <div className="h-2 w-full rounded-full bg-forest-deep/50" />
      </div>
      {/* Pace metric skeleton */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-28 rounded bg-forest-deep/50" />
          <div className="h-4 w-24 rounded bg-forest-deep/50" />
        </div>
        <div className="h-2 w-full rounded-full bg-forest-deep/50" />
      </div>
    </div>
  );
}

/**
 * TrainingProgress component
 *
 * Displays two performance metrics showing progress toward half marathon goals:
 * 1. Longest distance run vs 21.1 km target
 * 2. Best long run pace vs target pace (calculated from target finish time)
 */
export function TrainingProgress() {
  const { data: progressStats, isLoading: isLoadingStats } = api.runs.getProgressStats.useQuery();
  const { data: settings, isLoading: isLoadingSettings } = api.settings.get.useQuery();

  const isLoading = isLoadingStats || isLoadingSettings;

  // Show skeleton during loading
  if (isLoading) {
    return <ProgressSkeleton />;
  }

  // Calculate target pace from settings
  const targetTime = settings?.targetTime ?? "2:00:00";
  const targetPace = calculateTargetPace(targetTime);

  // Get current stats
  const longestDistance = progressStats?.longestRunDistance ?? 0;
  const bestPace = progressStats?.bestLongRunPace ?? null;

  // Calculate progress percentages
  const distanceProgress = calculateDistanceProgress(longestDistance);
  const paceProgress = bestPace ? calculatePaceProgress(bestPace, targetPace) : 0;

  return (
    <div className="w-full space-y-4" data-testid="training-progress">
      {/* Distance Progress */}
      <div data-testid="distance-progress">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-primary" data-testid="distance-label">
            Longest Run
          </span>
          <span className="text-sm text-text-primary/80" data-testid="distance-value">
            {longestDistance > 0 ? `${longestDistance.toFixed(1)} km` : "No runs yet"} /{" "}
            {HALF_MARATHON_KM} km
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-forest-deep/50"
          role="progressbar"
          aria-valuenow={distanceProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Distance progress: ${longestDistance.toFixed(1)} of ${HALF_MARATHON_KM} km`}
        >
          <div
            className="h-2 rounded-full bg-amber-600 transition-all duration-500"
            style={{ width: `${distanceProgress}%` }}
            data-testid="distance-fill"
          />
        </div>
      </div>

      {/* Pace Progress */}
      <div data-testid="pace-progress">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-primary" data-testid="pace-label">
            Best Long Run Pace
          </span>
          <span className="text-sm text-text-primary/80" data-testid="pace-value">
            {bestPace ?? "No long runs"} → {targetPace}/km
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-forest-deep/50"
          role="progressbar"
          aria-valuenow={paceProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Pace progress: ${bestPace ?? "none"} toward target ${targetPace}/km`}
        >
          <div
            className="h-2 rounded-full bg-amber-600 transition-all duration-500"
            style={{ width: `${paceProgress}%` }}
            data-testid="pace-fill"
          />
        </div>
      </div>
    </div>
  );
}
