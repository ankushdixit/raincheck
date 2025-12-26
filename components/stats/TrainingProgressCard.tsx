"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { calculateDaysUntil } from "@/components/countdown/RaceCountdown";

/** Phase display names */
const PHASE_NAMES: Record<string, string> = {
  BASE_BUILDING: "Base Building",
  BASE_EXTENSION: "Base Extension",
  SPEED_DEVELOPMENT: "Speed Development",
  PEAK_TAPER: "Peak & Taper",
};

/** Phase colors */
const PHASE_COLORS: Record<string, string> = {
  BASE_BUILDING: "bg-blue-500/30 text-blue-400",
  BASE_EXTENSION: "bg-green-500/30 text-green-400",
  SPEED_DEVELOPMENT: "bg-orange-500/30 text-orange-400",
  PEAK_TAPER: "bg-amber-500/30 text-amber-400",
};

/**
 * Training Progress Card
 *
 * Shows current training phase, week number, and overall progress bar.
 */
export function TrainingProgressCard() {
  const { data: phaseData, isLoading: phaseLoading } = api.planning.getCurrentPhase.useQuery();
  const { data: settings, isLoading: settingsLoading } = api.settings.get.useQuery();

  const isLoading = phaseLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="rounded-lg bg-forest-deep/50 backdrop-blur-md p-5 animate-pulse">
        <div className="flex gap-8 mb-6">
          <div>
            <div className="h-3 w-24 rounded bg-white/10 mb-2" />
            <div className="h-6 w-28 rounded bg-white/10" />
          </div>
          <div>
            <div className="h-3 w-16 rounded bg-white/10 mb-2" />
            <div className="h-6 w-20 rounded bg-white/10" />
          </div>
        </div>
        <div className="h-3 w-32 rounded bg-white/10 mb-2" />
        <div className="h-3 w-full rounded bg-white/10" />
      </div>
    );
  }

  // Calculate overall progress using Sep 21, 2025 as training start
  // Training period: Sep 21, 2025 to May 17, 2026 (race day) = 34 weeks
  const TRAINING_START = new Date("2025-09-21T00:00:00");
  const TOTAL_WEEKS = 34;

  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const currentWeek = Math.max(
    1,
    Math.floor((now.getTime() - TRAINING_START.getTime()) / msPerWeek) + 1
  );
  const progressPercent =
    TOTAL_WEEKS > 0 ? Math.min(100, Math.round((currentWeek / TOTAL_WEEKS) * 100)) : 0;

  // Days until race - use consistent calculation with homepage
  const raceDate = settings?.raceDate ? new Date(settings.raceDate) : null;
  const daysUntilRace = raceDate ? Math.max(0, calculateDaysUntil(raceDate)) : null;

  const currentPhase = phaseData?.phase ?? "BASE_BUILDING";
  const phaseName = PHASE_NAMES[currentPhase] ?? currentPhase;
  const phaseColor = PHASE_COLORS[currentPhase] ?? "bg-blue-500/30 text-blue-400";

  return (
    <Link
      href="/training-phases"
      className="block rounded-lg bg-forest-deep/50 backdrop-blur-md p-5 transition-all duration-200 hover:bg-forest-deep/70 hover:scale-[1.01] group"
    >
      <div className="flex gap-8 mb-6">
        {/* Current Phase */}
        <div>
          <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Current Phase</p>
          <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${phaseColor}`}>
            {phaseName}
          </span>
        </div>

        {/* Week */}
        <div>
          <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Week</p>
          <p className="text-white text-lg font-bold">
            {currentWeek} <span className="text-white/50 font-normal">of {TOTAL_WEEKS}</span>
          </p>
        </div>

        {/* Days Until Race */}
        {daysUntilRace !== null && (
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Race In</p>
            <p className="text-white text-lg font-bold">
              {daysUntilRace} <span className="text-white/50 font-normal">days</span>
            </p>
          </div>
        )}

        {/* Hover indicator */}
        <div className="flex items-center ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-5 w-5 text-white/60" />
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Overall Progress</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full bg-white/20">
            <div
              className="h-3 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-white/50 text-xs">{progressPercent}%</span>
        </div>
      </div>
    </Link>
  );
}
