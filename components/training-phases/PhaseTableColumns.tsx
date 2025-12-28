/**
 * Phase Table Columns Configuration
 *
 * Defines how each column type should be rendered in the phase weekly table.
 * Different phases show different columns based on their training focus.
 */

import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { TableColumnKey } from "@/server/api/routers/stats";

/** Week data structure from API */
export interface WeekData {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  longRunTarget: number;
  longRunActual: number | null;
  weeklyMileageTarget: number;
  weeklyMileageActual: number | null;
  status: "completed" | "current" | "upcoming";
}

/** Column definition for rendering */
interface ColumnDefinition {
  header: string;
  render: (_week: WeekData, _prevWeek?: WeekData) => React.ReactNode;
  /** Whether this column requires data that might not be available */
  requiresData?: (_week: WeekData) => boolean;
}

/** Format date to readable string */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IE", {
    month: "short",
    day: "numeric",
  });
}

/** Week status icon component */
function WeekStatusIcon({ status }: { status: "completed" | "current" | "upcoming" }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "current":
      return <Clock className="h-4 w-4 text-blue-400" />;
    case "upcoming":
      return <Circle className="h-4 w-4 text-white/30" />;
  }
}

/** Calculate volume trend between weeks */
function calculateVolumeTrend(current: WeekData, prev?: WeekData): string {
  if (!prev || !current.weeklyMileageActual || !prev.weeklyMileageActual) {
    return "—";
  }
  const change = current.weeklyMileageActual - prev.weeklyMileageActual;
  const percent = Math.round((change / prev.weeklyMileageActual) * 100);
  if (percent > 0) return `+${percent}%`;
  if (percent < 0) return `${percent}%`;
  return "0%";
}

/** Calculate volume percentage of target */
function calculateVolumePercent(week: WeekData): string {
  if (!week.weeklyMileageActual || !week.weeklyMileageTarget) {
    return "—";
  }
  const percent = Math.round((week.weeklyMileageActual / week.weeklyMileageTarget) * 100);
  return `${percent}%`;
}

/** Column definitions for all available column types */
export const COLUMN_DEFINITIONS: Record<TableColumnKey, ColumnDefinition> = {
  week: {
    header: "Week",
    render: (week) => <span className="font-medium text-white">W{week.weekNumber}</span>,
  },

  dates: {
    header: "Dates",
    render: (week) => (
      <span className="text-white/70">
        {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
      </span>
    ),
  },

  longRun: {
    header: "Long Run",
    render: (week) => {
      const isAchieved =
        week.longRunActual !== null &&
        week.longRunActual > 0 &&
        week.longRunActual >= week.longRunTarget;
      return (
        <div className="flex items-center gap-2">
          <span className="text-purple-400">{week.longRunTarget} km</span>
          {week.longRunActual !== null && week.longRunActual > 0 && (
            <span className={`text-xs ${isAchieved ? "text-emerald-400" : "text-amber-400"}`}>
              ({week.longRunActual} km)
            </span>
          )}
        </div>
      );
    },
  },

  weeklyMileage: {
    header: "Weekly Mileage",
    render: (week) => {
      const isAchieved =
        week.weeklyMileageActual !== null &&
        week.weeklyMileageActual > 0 &&
        week.weeklyMileageActual >= week.weeklyMileageTarget;
      return (
        <div className="flex items-center gap-2">
          <span className="text-white">{week.weeklyMileageTarget} km</span>
          {week.weeklyMileageActual !== null && week.weeklyMileageActual > 0 && (
            <span className={`text-xs ${isAchieved ? "text-emerald-400" : "text-amber-400"}`}>
              ({week.weeklyMileageActual} km)
            </span>
          )}
        </div>
      );
    },
  },

  runsCompleted: {
    header: "Runs",
    render: (week) => {
      // For Base Building: show if week has activity
      if (week.weeklyMileageActual && week.weeklyMileageActual > 0) {
        return <span className="text-emerald-400">Active</span>;
      }
      if (week.status === "upcoming") {
        return <span className="text-white/40">—</span>;
      }
      return <span className="text-amber-400">Missed</span>;
    },
    requiresData: (week) => week.status !== "upcoming",
  },

  volumeTrend: {
    header: "Volume Trend",
    render: (week, prevWeek) => {
      const trend = calculateVolumeTrend(week, prevWeek);
      const isPositive = trend.startsWith("+");
      const isNegative = trend.startsWith("-");
      return (
        <span
          className={
            isPositive ? "text-emerald-400" : isNegative ? "text-amber-400" : "text-white/50"
          }
        >
          {trend}
        </span>
      );
    },
    requiresData: (week) => week.weeklyMileageActual !== null && week.weeklyMileageActual > 0,
  },

  qualityWorkouts: {
    header: "Quality Workouts",
    render: (week) => {
      // Placeholder - would need additional data for tempo/interval counts
      if (week.status === "upcoming") {
        return <span className="text-white/40">—</span>;
      }
      return <span className="text-white/60">See runs</span>;
    },
  },

  avgPace: {
    header: "Avg Pace",
    render: (week) => {
      // Placeholder - would need pace data aggregated by week
      if (week.status === "upcoming") {
        return <span className="text-white/40">—</span>;
      }
      return <span className="text-white/60">—</span>;
    },
  },

  volumePercent: {
    header: "Volume %",
    render: (week) => {
      const percent = calculateVolumePercent(week);
      const value = parseInt(percent);
      // For taper: lower is expected and good
      const isTaperGood = !isNaN(value) && value <= 70 && value > 0;
      const isOnTrack = !isNaN(value) && value >= 80;
      return (
        <span
          className={
            isTaperGood || isOnTrack
              ? "text-emerald-400"
              : value > 0
                ? "text-amber-400"
                : "text-white/50"
          }
        >
          {percent}
        </span>
      );
    },
    requiresData: (week) => week.weeklyMileageActual !== null && week.weeklyMileageActual > 0,
  },

  status: {
    header: "Status",
    render: (week) => <WeekStatusIcon status={week.status} />,
  },
};

/**
 * Get column definitions for a phase's table columns
 * Filters out columns that don't have data if hideEmpty is true
 */
export function getColumnsForPhase(
  columns: TableColumnKey[],
  weeks: WeekData[],
  hideEmpty = true
): TableColumnKey[] {
  if (!hideEmpty) return columns;

  return columns.filter((col) => {
    const def = COLUMN_DEFINITIONS[col];
    if (!def.requiresData) return true;

    // Check if any week has data for this column
    return weeks.some((week) => def.requiresData!(week));
  });
}
