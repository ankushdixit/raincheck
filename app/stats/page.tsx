"use client";

/**
 * Stats Dashboard Page
 *
 * Comprehensive training analytics dashboard with immersive styling.
 * Matches homepage design with dynamic backgrounds and weather effects.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { getTrailImage, getTintColor, getNightTint } from "@/components/trail";
import { WeatherEffectLayer } from "@/components/weather-effects";
import {
  SummaryStatsRow,
  WeeklyMileageChart,
  TrainingProgressCard,
  CompletionRateCard,
  PaceProgressionChart,
  LongRunProgressionChart,
  RunTypeLegend,
} from "@/components/stats";
import { SolokitBadge } from "@/components/common";

/** Header with weather info */
function StatsHeader() {
  const { data: weather, isLoading } = api.weather.getCurrentWeather.useQuery({});

  const [time, setTime] = useState({ hours: "00", minutes: "00" });
  const [colonVisible, setColonVisible] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime({
        hours: now.getHours().toString().padStart(2, "0"),
        minutes: now.getMinutes().toString().padStart(2, "0"),
      });
      setColonVisible((prev) => !prev);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-start justify-between w-full px-10 py-6">
      {/* Left: Logo and subtitle */}
      <div>
        <Link href="/" className="inline-block">
          <Image
            src="/images/logo-lockup-1.svg"
            alt="RainCheck"
            width={350}
            height={88}
            priority
            className="-ml-3.5"
          />
        </Link>
        <p className="text-white/60 text-sm mt-1">Training Statistics</p>
      </div>

      {/* Right: Weather info */}
      <div className="flex flex-col items-end gap-0.5">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-3 w-24 rounded bg-white/10 mb-2" />
            <div className="h-6 w-16 rounded bg-white/10 mb-1" />
            <div className="h-4 w-28 rounded bg-white/10" />
          </div>
        ) : weather ? (
          <>
            <span className="text-xs text-white/70">{weather.location}</span>
            <span className="text-2xl font-medium text-white font-mono">
              {time.hours}
              <span className={colonVisible ? "opacity-100" : "opacity-0"}>:</span>
              {time.minutes}
            </span>
            <span className="text-sm text-white">
              {Math.round(weather.temperature)}&deg;C{"  |  "}
              {Math.round(weather.precipitation)}%{"  |  "}
              {Math.round(weather.windSpeed)} km/h
            </span>
          </>
        ) : (
          <span className="text-white/60 text-sm">Weather unavailable</span>
        )}
      </div>
    </header>
  );
}

export default function StatsPage() {
  // Fetch current weather for dynamic background
  const { data: currentWeather } = api.weather.getCurrentWeather.useQuery({});

  // Background state
  const [backgroundImage, setBackgroundImage] = useState(getTrailImage("default"));
  const [backgroundTint, setBackgroundTint] = useState(getTintColor("default"));
  const [displayedCondition, setDisplayedCondition] = useState("");

  // Night overlay state
  const [nightTint, setNightTint] = useState<string>(getNightTint());

  // Update night overlay every minute
  useEffect(() => {
    const updateNightTint = () => setNightTint(getNightTint());
    const interval = setInterval(updateNightTint, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update background when weather loads
  useEffect(() => {
    if (currentWeather) {
      const condition = currentWeather.condition;
      setBackgroundImage(getTrailImage(condition));
      setBackgroundTint(getTintColor(condition));
      setDisplayedCondition(condition);
    }
  }, [currentWeather]);

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden">
      {/* Dynamic Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `linear-gradient(${backgroundTint}, ${backgroundTint}), url('/images/trails/${backgroundImage}')`,
        }}
        aria-hidden="true"
      />

      {/* Weather Effects Layer */}
      {displayedCondition && <WeatherEffectLayer condition={displayedCondition} />}

      {/* Night Overlay */}
      {nightTint !== "transparent" && (
        <div
          className="fixed inset-0 z-[5] pointer-events-none transition-opacity duration-1000"
          style={{ backgroundColor: nightTint }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <StatsHeader />

        {/* Summary Stats Row */}
        <div className="px-10 mb-6">
          <SummaryStatsRow />
        </div>

        {/* Main Content: Two Column Layout */}
        <div className="px-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 mb-6">
          {/* Left Column: Weekly Mileage Chart - height matches right column */}
          <div className="flex flex-col">
            <p className="text-white/50 text-xs font-bold tracking-wide mb-2">WEEKLY MILEAGE</p>
            <div className="rounded-xl bg-forest-deep/50 backdrop-blur-md p-4 flex-1">
              <WeeklyMileageChart />
            </div>
          </div>

          {/* Right Column: Training Progress + Completion Rate */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-white/50 text-xs font-bold tracking-wide mb-2">
                TRAINING PROGRESS
              </p>
              <TrainingProgressCard />
            </div>

            <div>
              <p className="text-white/50 text-xs font-bold tracking-wide mb-2">COMPLETION RATE</p>
              <CompletionRateCard />
            </div>
          </div>
        </div>

        {/* Bottom Row: Pace & Long Run Progression */}
        <div className="px-10 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-white/50 text-xs font-bold tracking-wide mb-2">PACE PROGRESSION</p>
            <div className="rounded-xl bg-forest-deep/50 backdrop-blur-md p-4">
              <PaceProgressionChart />
            </div>
          </div>

          <div>
            <p className="text-white/50 text-xs font-bold tracking-wide mb-2">
              LONG RUN PROGRESSION
            </p>
            <div className="rounded-xl bg-forest-deep/50 backdrop-blur-md p-4">
              <LongRunProgressionChart />
            </div>
          </div>
        </div>

        {/* Footer: Legend + Back Link */}
        <div className="px-10 pb-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <RunTypeLegend />
        </div>

        {/* Solokit Badge */}
        <div className="px-10 py-3 text-center">
          <SolokitBadge />
        </div>
      </div>
    </main>
  );
}
