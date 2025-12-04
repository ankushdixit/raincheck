"use client";

import { api } from "@/lib/api";

/**
 * Weekly Mileage Chart (Histogram)
 *
 * Displays weekly mileage as a bar chart with target line.
 * Uses pure CSS/SVG for rendering without external chart libraries.
 */
export function WeeklyMileageChart() {
  const { data, isLoading, error } = api.stats.getWeeklyMileage.useQuery({ weeks: 12 });

  if (isLoading) {
    return (
      <div className="h-full min-h-[250px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full min-h-[250px] flex items-center justify-center">
        <p className="text-red-400 text-sm">Failed to load mileage data</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full min-h-[250px] flex items-center justify-center">
        <p className="text-white/60 text-sm">No mileage data available yet</p>
      </div>
    );
  }

  // Calculate max value for scaling - fixed at 30km for clean display
  const roundedMax = 30;

  // Bar width as percentage
  const barWidth = 100 / data.length - 2; // percentage, with gap

  // Y-axis labels
  const yLabels = [roundedMax, roundedMax * 0.75, roundedMax * 0.5, roundedMax * 0.25, 0];

  // Calculate target line points for SVG (diagonal line showing progression)
  const targetPoints = data.map((week, i) => {
    const x = ((i + 0.5) / data.length) * 100; // Center of each bar
    const y = 100 - (week.target / roundedMax) * 100; // Invert Y for SVG
    return `${x},${y}`;
  });

  return (
    <div className="h-full min-h-[250px] flex flex-col">
      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-white/70 text-xs">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t-2 border-dashed border-amber-500" />
          <span className="text-white/70 text-xs">Target</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-[200px]">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-2 text-right">
          {yLabels.map((label) => (
            <span key={label} className="text-white/50 text-[10px]">
              {label}km
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {yLabels.map((_, i) => (
              <div key={i} className="border-t border-white/10" />
            ))}
          </div>

          {/* Target line (diagonal showing linear progression) */}
          {data.some((d) => d.target > 0) && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polyline
                points={targetPoints.join(" ")}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeOpacity="0.7"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-around px-1">
            {data.map((week, i) => {
              const heightPercent = (week.mileage / roundedMax) * 100;
              const isCurrentWeek = week.isCurrentWeek;

              return (
                <div
                  key={i}
                  className="h-full flex flex-col justify-end items-center"
                  style={{ width: `${barWidth}%` }}
                >
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isCurrentWeek
                        ? "bg-green-500/40 border-2 border-dashed border-green-500"
                        : "bg-green-500/80"
                    }`}
                    style={{
                      height: `${heightPercent}%`,
                      minHeight: week.mileage > 0 ? "4px" : "0",
                    }}
                    title={`${week.week}: ${week.mileage.toFixed(1)}km`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels - outside the chart area with proper spacing */}
      <div className="flex justify-around mt-2 pl-8">
        {data.map((week, i) => (
          <span
            key={i}
            className={`text-[9px] ${week.isCurrentWeek ? "text-white font-bold" : "text-white/50"}`}
          >
            {week.week.replace("Week ", "W")}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface WeeklyMileageChartProps {
  weeks?: number;
}
