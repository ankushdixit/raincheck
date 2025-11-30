"use client";

import { Route, Timer, Flame, Trophy } from "lucide-react";
import { api } from "@/lib/api";

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

/**
 * Individual summary card showing a single stat
 */
function SummaryCard({ label, value, icon }: SummaryCardProps) {
  return (
    <div className="bg-[#1a2e1a] border border-[#2a4a2a] rounded-lg p-4 flex items-center gap-4">
      <div className="text-amber-500">{icon}</div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-[#f5f5f5] text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for summary cards
 */
function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="summary-skeleton">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-[#1a2e1a] border border-[#2a4a2a] rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-green-900/30 rounded" />
            <div className="flex-1">
              <div className="h-4 bg-green-900/30 rounded w-16 mb-2" />
              <div className="h-6 bg-green-900/30 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no data is available
 */
function EmptyState() {
  return (
    <div
      className="bg-[#1a2e1a] border border-[#2a4a2a] rounded-lg p-6 text-center"
      data-testid="summary-empty-state"
    >
      <p className="text-gray-400">
        No training data available yet. Complete some runs to see your stats!
      </p>
    </div>
  );
}

/**
 * Format pace string for display
 */
function formatPace(pace: string): string {
  if (!pace) return "--:--";
  return `${pace} /km`;
}

/**
 * Stats Summary Cards
 *
 * Displays 4 summary stat cards: Total Runs, Total Distance, Average Pace, and Current Streak.
 * Uses the stats.getSummary tRPC endpoint.
 */
export function StatsSummaryCard() {
  const { data, isLoading, error } = api.stats.getSummary.useQuery();

  if (isLoading) {
    return <SummaryCardsSkeleton />;
  }

  if (error) {
    return (
      <div
        className="bg-red-900/20 border border-red-800/30 rounded-lg p-4"
        data-testid="summary-error-state"
      >
        <p className="text-red-400 text-sm">Failed to load summary statistics</p>
      </div>
    );
  }

  if (!data || data.totalRuns === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="summary-cards">
      <SummaryCard
        label="Total Runs"
        value={`${data.totalRuns} runs`}
        icon={<Route className="h-6 w-6" />}
      />
      <SummaryCard
        label="Total Distance"
        value={`${data.totalDistance.toFixed(1)} km`}
        icon={<Trophy className="h-6 w-6" />}
      />
      <SummaryCard
        label="Average Pace"
        value={formatPace(data.avgPace)}
        icon={<Timer className="h-6 w-6" />}
      />
      <SummaryCard
        label="Current Streak"
        value={`${data.streak} days`}
        icon={<Flame className="h-6 w-6" />}
      />
    </div>
  );
}
