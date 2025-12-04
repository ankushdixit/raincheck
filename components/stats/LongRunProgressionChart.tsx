"use client";

import { api } from "@/lib/api";

/** Half marathon distance */
const RACE_DISTANCE = 21.1;

/**
 * Long Run Progression Chart
 *
 * Bar chart showing long run distance progression with race distance target.
 */
export function LongRunProgressionChart() {
  const { data, isLoading, error } = api.stats.getLongRunProgression.useQuery();

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
        <p className="text-red-400 text-sm">Failed to load long run data</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[270px] flex items-center justify-center">
        <p className="text-white/60 text-sm">No long run data available yet</p>
      </div>
    );
  }

  // Calculate max for scaling
  const maxDistance = Math.max(...data.map((d) => d.distance), RACE_DISTANCE);
  const roundedMax = Math.ceil(maxDistance / 3) * 3; // Round to nearest 3km

  // Y-axis labels
  const yLabels = [roundedMax, roundedMax * 0.75, roundedMax * 0.5, roundedMax * 0.25, 0];

  // Bar width
  const barWidth = 100 / data.length - 4;

  return (
    <div className="h-[270px]">
      <div className="flex h-[220px]">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-2 text-right w-10">
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

          {/* Race distance target line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-purple-500/70"
            style={{ top: `${100 - (RACE_DISTANCE / roundedMax) * 100}%` }}
          >
            <span className="absolute right-2 -top-4 text-purple-400 text-[10px] bg-black/30 px-1 rounded">
              Race: {RACE_DISTANCE}km
            </span>
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-around px-1">
            {data.map((run, i) => {
              const heightPercent = (run.distance / roundedMax) * 100;
              const isLatest = i === data.length - 1;

              return (
                <div
                  key={i}
                  className="h-full flex flex-col justify-end items-center relative"
                  style={{ width: `${barWidth}%` }}
                >
                  {/* Distance label - positioned above bar */}
                  <span
                    className={`absolute text-[9px] ${isLatest ? "text-white" : "text-white/70"}`}
                    style={{ bottom: `calc(${heightPercent}% + 4px)` }}
                  >
                    {run.distance}km
                  </span>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isLatest
                        ? "bg-purple-500/40 border-2 border-dashed border-purple-500"
                        : "bg-purple-500/80"
                    }`}
                    style={{
                      height: `${heightPercent}%`,
                      minHeight: run.distance > 0 ? "4px" : "0",
                    }}
                    title={`${run.distance}km on ${new Date(run.date).toLocaleDateString()}`}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute -bottom-5 left-0 right-0 flex justify-around">
            {data.map((item, i) => (
              <span
                key={i}
                className={`text-[9px] ${i === data.length - 1 ? "text-white font-bold" : "text-white/50"}`}
              >
                W{"week" in item ? item.week : i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
