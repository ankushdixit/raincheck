"use client";

import { api } from "@/lib/api";

/**
 * Circular Progress Component
 */
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#4CAF50"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-white text-lg font-bold">{percentage}%</span>
    </div>
  );
}

/**
 * Completion Rate Card
 *
 * Shows completion rate with circular progress and breakdown stats.
 */
export function CompletionRateCard() {
  const { data, isLoading, error } = api.stats.getCompletionRate.useQuery({});

  if (isLoading) {
    return (
      <div className="rounded-lg bg-forest-deep/50 backdrop-blur-md p-5 animate-pulse">
        <div className="flex gap-6">
          <div className="w-20 h-20 rounded-full bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="h-4 w-16 rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-forest-deep/50 backdrop-blur-md p-5">
        <p className="text-red-400 text-sm">Failed to load completion rate</p>
      </div>
    );
  }

  const missed = data.total - data.completed;
  const targetRate = 80;
  const isOnTrack = data.rate >= targetRate;

  return (
    <div className="rounded-lg bg-forest-deep/50 backdrop-blur-md p-5">
      <div className="flex gap-6">
        {/* Circular Progress */}
        <CircularProgress percentage={data.rate} />

        {/* Stats Breakdown */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Completed</p>
              <p className="text-green-400 text-xl font-bold">{data.completed}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Scheduled</p>
              <p className="text-white/80 text-xl font-bold">{data.total}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Missed</p>
              <p className="text-red-400 text-xl font-bold">{missed}</p>
            </div>
          </div>

          {/* Status */}
          <p className="text-white/50 text-xs">
            Target: {targetRate}% | Status:{" "}
            <span className={isOnTrack ? "text-green-400" : "text-amber-400"}>
              {isOnTrack ? "On Track" : "Needs Attention"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
