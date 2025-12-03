"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";

interface ChartDataPoint {
  week: string;
  weekStart: Date;
  mileage: number;
  target: number;
  isCurrentWeek: boolean;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
}

/**
 * Custom dot renderer for the actual mileage line.
 * Highlights the current week with a larger glowing dot.
 */
function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx === undefined || cy === undefined) return null;

  const isCurrentWeek = payload?.isCurrentWeek;

  if (isCurrentWeek) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="#ffa726"
        stroke="#ffd54f"
        strokeWidth={3}
        filter="url(#glow)"
      />
    );
  }
  return <circle cx={cx} cy={cy} r={4} fill="#ffa726" />;
}

/**
 * Loading skeleton placeholder for the chart
 */
function ChartSkeleton() {
  return (
    <div className="animate-pulse" data-testid="chart-skeleton">
      <div className="h-[250px] md:h-[300px] lg:h-[350px] bg-forest-deep/50 rounded-lg" />
    </div>
  );
}

/**
 * Empty state when no data is available
 */
function EmptyState() {
  return (
    <div
      className="flex items-center justify-center h-[250px] md:h-[300px] lg:h-[350px] bg-forest-deep/30 rounded-lg border border-forest-medium/30"
      data-testid="empty-state"
    >
      <p className="text-text-secondary text-sm">No mileage data available yet</p>
    </div>
  );
}

export interface WeeklyMileageChartProps {
  weeks?: number;
}

/**
 * Weekly Mileage Chart
 *
 * Displays weekly mileage trends over time with actual vs target lines.
 * Uses Recharts for visualization with forest/amber theme styling.
 *
 * @param weeks - Number of weeks to display (default: 12)
 */
export function WeeklyMileageChart({ weeks = 12 }: WeeklyMileageChartProps) {
  const { data, isLoading, error } = api.stats.getWeeklyMileage.useQuery({ weeks });

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-[250px] md:h-[300px] lg:h-[350px] bg-error/20 rounded-lg border border-error/30"
        data-testid="error-state"
      >
        <p className="text-error text-sm">Failed to load mileage data</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Note: Recharts components require inline styles for theming
  // as they don't support Tailwind classes internally
  return (
    <div className="w-full h-[250px] md:h-[300px] lg:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a4a2a" />
          <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} tick={{ fill: "#9ca3af" }} />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tick={{ fill: "#9ca3af" }}
            label={{
              value: "km",
              position: "insideLeft",
              fill: "#9ca3af",
              fontSize: 12,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a2e1a",
              border: "1px solid #2a4a2a",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#9ca3af" }}
            itemStyle={{ color: "#9ca3af" }}
            formatter={(value: number, name: string) => [`${value.toFixed(1)} km`, name]}
          />
          <Legend
            wrapperStyle={{ color: "#9ca3af" }}
            formatter={(value) => <span style={{ color: "#9ca3af" }}>{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="mileage"
            name="Actual"
            stroke="#ffa726"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 8, fill: "#ffa726", stroke: "#ffd54f", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target"
            stroke="#607d8b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
