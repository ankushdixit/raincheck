"use client";

import { api } from "@/lib/api";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Circular progress indicator with percentage display
 */
function CircularProgress({ percentage, size = 120, strokeWidth = 8 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2a4a2a"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ffa726"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-2xl font-bold text-[#f5f5f5]">{percentage}%</span>
    </div>
  );
}

/**
 * Loading skeleton for completion rate card
 */
function CompletionRateSkeleton() {
  return (
    <div
      className="bg-[#1a2e1a] border border-[#2a4a2a] rounded-lg p-6 animate-pulse"
      data-testid="completion-skeleton"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-[120px] h-[120px] bg-green-900/30 rounded-full" />
        <div className="h-6 bg-green-900/30 rounded w-32" />
        <div className="h-4 bg-green-900/30 rounded w-24" />
      </div>
    </div>
  );
}

/**
 * Empty state when no scheduled runs exist
 */
function EmptyState() {
  return (
    <div
      className="bg-[#1a2e1a] border border-[#2a4a2a] rounded-lg p-6 text-center"
      data-testid="completion-empty-state"
    >
      <p className="text-gray-400">No runs scheduled yet. Start planning your training!</p>
    </div>
  );
}

/**
 * Completion Rate Card
 *
 * Displays overall completion rate as a circular progress indicator
 * with completed/total run counts.
 */
export function CompletionRateCard() {
  const { data, isLoading, error } = api.stats.getCompletionRate.useQuery();

  if (isLoading) {
    return <CompletionRateSkeleton />;
  }

  if (error) {
    return (
      <div
        className="bg-red-900/20 border border-red-800/30 rounded-lg p-6"
        data-testid="completion-error-state"
      >
        <p className="text-red-400 text-sm text-center">Failed to load completion rate</p>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return <EmptyState />;
  }

  return (
    <div
      className="bg-[#1a2e1a] border border-[#2a4a2a] rounded-lg p-6"
      data-testid="completion-rate-card"
    >
      <div className="flex flex-col items-center gap-4">
        <CircularProgress percentage={data.rate} />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#f5f5f5]">Completion Rate</h3>
          <p className="text-gray-400 text-sm">
            {data.completed} of {data.total} runs completed
          </p>
        </div>
      </div>
    </div>
  );
}
