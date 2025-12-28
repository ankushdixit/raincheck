"use client";

import { api } from "@/lib/api";

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  change?: string;
  changeColor?: string;
}

function StatCard({ label, value, unit, change, changeColor = "text-green-400" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
      <p className="text-white/60 text-xs uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-white text-3xl font-bold">{value}</span>
        <span className="text-white/50 text-sm">{unit}</span>
      </div>
      {change && <p className={`text-sm mt-1 ${changeColor}`}>{change}</p>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5 animate-pulse">
      <div className="h-3 w-20 rounded bg-white/10 mb-3" />
      <div className="h-8 w-24 rounded bg-white/10 mb-2" />
      <div className="h-4 w-28 rounded bg-white/10" />
    </div>
  );
}

/**
 * Summary Stats Row
 *
 * Displays 4 summary stat cards: Total Runs, Total Distance, Average Pace, Current Streak
 * Each card shows the main value plus a weekly change indicator.
 */
export function SummaryStatsRow() {
  const { data, isLoading } = api.stats.getSummary.useQuery();
  const { data: weeklyData } = api.stats.getWeeklyMileage.useQuery({ weeks: 52 });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white/60">No training data available yet.</p>
      </div>
    );
  }

  // Calculate weekly stats
  const thisWeekMileage = weeklyData?.find((w) => w.isCurrentWeek)?.mileage ?? 0;
  const maxWeeklyMileage =
    weeklyData && weeklyData.length > 0 ? Math.max(...weeklyData.map((w) => w.mileage)) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Runs"
        value={data.totalRuns.toString()}
        unit="runs"
        change={data.totalRuns > 0 ? `${data.totalRuns} completed` : undefined}
        changeColor="text-green-400"
      />
      <StatCard
        label="Total Distance"
        value={data.totalDistance.toFixed(1)}
        unit="km"
        change={thisWeekMileage > 0 ? `+${thisWeekMileage.toFixed(1)} this week` : undefined}
        changeColor="text-green-400"
      />
      <StatCard
        label="Average Pace"
        value={data.avgPace || "--:--"}
        unit="/km"
        change={data.avgPace ? "weighted by distance" : undefined}
        changeColor="text-blue-400"
      />
      <StatCard
        label="Current Streak"
        value={data.streak.toString()}
        unit={data.streak === 1 ? "week" : "weeks"}
        change={maxWeeklyMileage > 0 ? `Best week: ${maxWeeklyMileage.toFixed(1)}km` : undefined}
        changeColor="text-amber-400"
      />
    </div>
  );
}
