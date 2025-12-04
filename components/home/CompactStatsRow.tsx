"use client";

import { Route, MapPin, Timer, Flame, ArrowRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

interface CompactStatCardProps {
  icon: React.ReactNode;
  value: string;
  unit: string;
  label: string;
}

function CompactStatCard({ icon, value, unit, label }: CompactStatCardProps) {
  return (
    <div
      className="bg-forest-deep/50 backdrop-blur-md rounded-lg p-2 sm:p-3 flex flex-col justify-between h-full"
      title={label}
    >
      <div className="text-amber-500">{icon}</div>
      <div>
        <div className="flex items-baseline gap-0.5 sm:gap-1">
          <span className="text-white text-base sm:text-xl font-bold whitespace-nowrap">
            {value}
          </span>
          <span className="text-white/50 text-[10px] sm:text-xs whitespace-nowrap">{unit}</span>
        </div>
        <p className="text-white/40 text-[8px] sm:text-[10px] uppercase tracking-wide truncate">
          {label}
        </p>
      </div>
    </div>
  );
}

function CompactStatCardSkeleton() {
  return (
    <div className="bg-forest-deep/50 backdrop-blur-md rounded-lg p-2 sm:p-3 animate-pulse h-full flex flex-col justify-between">
      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded bg-white/10" />
      <div>
        <div className="h-5 sm:h-6 w-10 sm:w-12 rounded bg-white/10 mb-1" />
        <div className="h-2 sm:h-3 w-12 sm:w-16 rounded bg-white/10" />
      </div>
    </div>
  );
}

/**
 * Compact Stats Row for Homepage
 *
 * Displays 5 square cards: Total Runs, Total Distance, Average Pace, Current Streak, and See Stats link
 */
export function CompactStatsRow() {
  const { data, isLoading } = api.stats.getSummary.useQuery();
  const { data: weeklyData } = api.stats.getWeeklyMileage.useQuery({ weeks: 52 });

  // Calculate max weekly mileage for best week display
  const maxWeeklyMileage =
    weeklyData && weeklyData.length > 0 ? Math.max(...weeklyData.map((w) => w.mileage)) : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 h-full w-full">
        <CompactStatCardSkeleton />
        <CompactStatCardSkeleton />
        <CompactStatCardSkeleton />
        <CompactStatCardSkeleton />
        <CompactStatCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 h-full w-full">
      <CompactStatCard
        icon={<Route className="h-4 w-4 sm:h-5 sm:w-5" />}
        value={data?.totalRuns.toString() ?? "0"}
        unit="runs"
        label="Total Runs"
      />
      <CompactStatCard
        icon={<MapPin className="h-4 w-4 sm:h-5 sm:w-5" />}
        value={data?.totalDistance.toFixed(0) ?? "0"}
        unit="km"
        label="Total Dist..."
      />
      <CompactStatCard
        icon={<Timer className="h-4 w-4 sm:h-5 sm:w-5" />}
        value={data?.avgPace || "--:--"}
        unit="/km"
        label="Avg Pace"
      />
      <CompactStatCard
        icon={<Flame className="h-4 w-4 sm:h-5 sm:w-5" />}
        value={data?.streak.toString() ?? "0"}
        unit="wks"
        label={maxWeeklyMileage > 0 ? `Best: ${maxWeeklyMileage.toFixed(0)}km` : "Streak"}
      />
      <Link
        href="/stats"
        className="bg-amber-500/50 hover:bg-amber-500/60 backdrop-blur-md rounded-lg p-2 sm:p-3 flex flex-col justify-between transition-colors group h-full"
      >
        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:translate-x-1 transition-transform" />
        <div>
          <p className="text-white text-[10px] sm:text-xs font-medium">See All</p>
          <p className="text-white/80 text-[8px] sm:text-[10px] uppercase tracking-wide">Stats</p>
        </div>
      </Link>
    </div>
  );
}
