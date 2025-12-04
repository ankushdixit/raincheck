"use client";

import { api } from "@/lib/api";

/**
 * Format pace seconds to M:SS string
 */
function formatPace(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Pace Progression Chart
 *
 * Line chart showing weekly average pace improvement over time.
 * Lower pace = faster = better, so the chart is inverted (faster at top).
 */
export function PaceProgressionChart() {
  const { data, isLoading, error } = api.stats.getPaceProgression.useQuery({});
  const { data: settings } = api.settings.get.useQuery();

  if (isLoading) {
    return (
      <div className="h-[270px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[270px] flex items-center justify-center">
        <p className="text-red-400 text-sm">Failed to load pace data</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[270px] flex items-center justify-center">
        <p className="text-white/60 text-sm">No pace data available yet</p>
      </div>
    );
  }

  // Calculate target pace from settings (for half marathon)
  const targetTime = settings?.targetTime ?? "2:00:00";
  const [hours, mins, secs] = targetTime.split(":").map(Number);
  const totalMinutes = (hours ?? 0) * 60 + (mins ?? 0) + (secs ?? 0) / 60;
  const targetPaceSeconds = (totalMinutes * 60) / 21.1; // Half marathon distance

  // Filter weeks with valid pace data for scaling
  const weeksWithPace = data.filter((d) => d.paceSeconds !== null);

  if (weeksWithPace.length === 0) {
    return (
      <div className="h-[270px] flex items-center justify-center">
        <p className="text-white/60 text-sm">No pace data available yet</p>
      </div>
    );
  }

  // Get pace range for scaling - include target in range calculation
  const paceValues = weeksWithPace.map((d) => d.paceSeconds as number);
  const dataMin = Math.min(...paceValues);

  // Include target in the minimum (fastest) calculation
  const minPace = Math.min(dataMin, targetPaceSeconds);

  // Fixed y-axis: 8:00 (480 seconds) at bottom, with padding at top for fastest pace
  const FIXED_MAX_PACE = 8 * 60; // 8:00 = 480 seconds
  const paddedMax = FIXED_MAX_PACE;
  const padding = 10; // 10 seconds padding at top
  const paddedMin = minPace - padding;
  const paddedRange = paddedMax - paddedMin;

  // Y-axis labels (4 labels from fast/top to slow/bottom)
  const yLabels = [
    paddedMin,
    paddedMin + paddedRange * 0.33,
    paddedMin + paddedRange * 0.66,
    paddedMax,
  ];

  // Calculate percentage positions for each data point
  // Lower pace = faster = higher on chart (lower Y percentage from top)
  const getYPercent = (paceSeconds: number) => {
    return ((paceSeconds - paddedMin) / paddedRange) * 100;
  };

  // Calculate points for positioning
  const points = data
    .map((d, i) => {
      if (d.paceSeconds === null) return null;
      const xPercent = ((i + 0.5) / data.length) * 100;
      const yPercent = getYPercent(d.paceSeconds);
      return { xPercent, yPercent, pace: d.paceSeconds, week: d.week };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Target line position (percentage from top)
  const targetYPercent = getYPercent(targetPaceSeconds);

  // Create SVG path for the line (using percentage coordinates)
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.xPercent} ${p.yPercent}`)
    .join(" ");

  return (
    <div className="h-[270px] flex flex-col">
      <div className="flex flex-1 min-h-[200px]">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-2 text-right w-12">
          {yLabels.map((pace, i) => (
            <span key={i} className="text-white/50 text-[10px]">
              {formatPace(pace)}
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

          {/* Target pace line - using CSS positioning */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-amber-500/70"
            style={{ top: `${targetYPercent}%` }}
          >
            <span className="absolute right-1 -top-4 text-amber-500 text-[9px] bg-black/50 px-1 rounded whitespace-nowrap">
              Target: {formatPace(targetPaceSeconds)}
            </span>
          </div>

          {/* Line chart - SVG for the connecting line only */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {points.length > 1 && (
              <path
                d={pathD}
                fill="none"
                stroke="#2196F3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Dots - rendered as HTML elements to maintain perfect circles */}
          {points.map((p, i) => (
            <div
              key={i}
              className={`absolute rounded-full bg-blue-500 transform -translate-x-1/2 -translate-y-1/2 ${
                i === points.length - 1 ? "w-2.5 h-2.5 ring-2 ring-white" : "w-1.5 h-1.5"
              }`}
              style={{
                left: `${p.xPercent}%`,
                top: `${p.yPercent}%`,
              }}
              title={`Week ${p.week}: ${formatPace(p.pace)}`}
            />
          ))}
        </div>
      </div>

      {/* X-axis labels - weekly markers */}
      <div className="flex justify-around mt-2 pl-12">
        {data.map((week, i) => (
          <span
            key={i}
            className={`text-[9px] ${i === data.length - 1 ? "text-white font-bold" : "text-white/50"}`}
          >
            W{week.week}
          </span>
        ))}
      </div>
    </div>
  );
}
