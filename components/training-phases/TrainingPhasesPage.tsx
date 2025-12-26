"use client";

/**
 * Training Phases Page
 *
 * Displays all training phases with weekly breakdown and actual vs target stats.
 * Matches homepage/stats design with dynamic backgrounds and weather effects.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Flag,
  Zap,
  Mountain,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { getTrailImage, getTintColor, getNightTint } from "@/components/trail";
import { WeatherEffectLayer } from "@/components/weather-effects";
import { SolokitBadge } from "@/components/common";

/** Format date to readable string */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IE", {
    month: "short",
    day: "numeric",
  });
}

/** Format date range */
function formatDateRange(start: Date, end: Date): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    return `${formatDate(start)} - ${formatDate(end)}, ${startYear}`;
  }
  return `${formatDate(start)}, ${startYear} - ${formatDate(end)}, ${endYear}`;
}

/** Header with weather info */
function PhasesHeader() {
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
    <header className="flex w-full items-start justify-between px-4 py-4 sm:px-6 lg:px-10 lg:py-6">
      {/* Left: Logo and subtitle */}
      <div>
        <Link href="/" className="inline-block">
          <Image
            src="/images/logo-lockup-1.svg"
            alt="RainCheck"
            width={350}
            height={88}
            priority
            className="-ml-2 h-auto w-[200px] sm:w-[280px] lg:-ml-3.5 lg:w-[350px]"
          />
        </Link>
        <p className="mt-1 text-sm text-white/60">Training Phases</p>
      </div>

      {/* Right: Weather info */}
      <div className="flex flex-col items-end gap-0.5">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="mb-2 h-3 w-24 rounded bg-white/10" />
            <div className="mb-1 h-6 w-16 rounded bg-white/10" />
            <div className="h-4 w-28 rounded bg-white/10" />
          </div>
        ) : weather ? (
          <>
            <span className="text-xs text-white/70">{weather.location}</span>
            <span className="font-mono text-2xl font-medium text-white">
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
          <span className="text-sm text-white/60">Weather unavailable</span>
        )}
      </div>
    </header>
  );
}

/** Phase icon based on phase color */
function PhaseIcon({ color }: { color: string }) {
  const iconClass = "h-5 w-5";
  switch (color) {
    case "emerald":
      return <Mountain className={iconClass} />;
    case "blue":
      return <TrendingUp className={iconClass} />;
    case "amber":
      return <Zap className={iconClass} />;
    case "purple":
      return <Flag className={iconClass} />;
    default:
      return <Target className={iconClass} />;
  }
}

/** Get color classes based on phase color */
function getColorClasses(color: string) {
  const colors: Record<string, { text: string; bg: string; border: string }> = {
    emerald: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/50",
    },
    blue: {
      text: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/50",
    },
    amber: {
      text: "text-amber-400",
      bg: "bg-amber-500/20",
      border: "border-amber-500/50",
    },
    purple: {
      text: "text-purple-400",
      bg: "bg-purple-500/20",
      border: "border-purple-500/50",
    },
  };
  return colors[color] ?? colors.emerald;
}

/** Status badge component */
function StatusBadge({ status }: { status: "completed" | "in_progress" | "upcoming" }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completed
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
          <Clock className="h-3.5 w-3.5" />
          In Progress
        </span>
      );
    case "upcoming":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/60">
          <Circle className="h-3.5 w-3.5" />
          Upcoming
        </span>
      );
  }
}

/** Week status icon */
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

export default function TrainingPhasesPage() {
  // Fetch training phases data
  const { data, isLoading } = api.stats.getTrainingPhases.useQuery();

  // Fetch current weather for dynamic background
  const { data: currentWeather } = api.weather.getCurrentWeather.useQuery({});

  // Expanded phase state
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  // Background state
  const [backgroundImage, setBackgroundImage] = useState(getTrailImage("default"));
  const [backgroundTint, setBackgroundTint] = useState(getTintColor("default"));
  const [displayedCondition, setDisplayedCondition] = useState("");

  // Night overlay state
  const [nightTint, setNightTint] = useState<string>("transparent");

  // Set initial night tint on client and update every minute
  useEffect(() => {
    const updateNightTint = () => setNightTint(getNightTint());
    updateNightTint();
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

  // Auto-expand current phase
  useEffect(() => {
    if (data?.currentPhase) {
      setExpandedPhase(data.currentPhase.id);
    }
  }, [data?.currentPhase]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };

  return (
    <main className="relative min-h-screen w-full">
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
          className="pointer-events-none fixed inset-0 z-[5] transition-opacity duration-1000"
          style={{ backgroundColor: nightTint }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <PhasesHeader />

        {isLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        ) : !data || data.phases.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-6 lg:px-10">
            <p className="text-white/60">No training plan data available</p>
          </div>
        ) : (
          <>
            {/* Summary Stats Row */}
            <div className="mb-6 grid grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:px-6 lg:px-10">
              <div className="rounded-lg bg-forest-deep/50 p-4 backdrop-blur-md">
                <div className="text-sm text-white/60">Total Weeks</div>
                <div className="mt-1 text-2xl font-bold text-white">
                  {data.summary?.totalWeeks ?? 0}
                </div>
                <div className="text-xs text-white/40">in training plan</div>
              </div>
              <div className="rounded-lg bg-forest-deep/50 p-4 backdrop-blur-md">
                <div className="text-sm text-white/60">Weeks Completed</div>
                <div className="mt-1 text-2xl font-bold text-emerald-400">
                  {data.summary?.weeksCompleted ?? 0}
                </div>
                <div className="text-xs text-white/40">
                  of {data.summary?.totalWeeks ?? 0} weeks
                </div>
              </div>
              <div className="rounded-lg bg-forest-deep/50 p-4 backdrop-blur-md">
                <div className="text-sm text-white/60">Completion Rate</div>
                <div className="mt-1 text-2xl font-bold text-emerald-400">
                  {data.summary?.overallCompletionRate ?? 0}%
                </div>
                <div className="text-xs text-emerald-400/60">
                  {(data.summary?.overallCompletionRate ?? 0) >= 80 ? "On Track" : "Keep Going"}
                </div>
              </div>
              <div className="rounded-lg bg-forest-deep/50 p-4 backdrop-blur-md">
                <div className="text-sm text-white/60">Race Day</div>
                <div className="mt-1 text-2xl font-bold text-amber-400">
                  {data.summary?.daysUntilRace ?? 0}
                </div>
                <div className="text-xs text-white/40">days to go</div>
              </div>
            </div>

            {/* Phase Timeline */}
            <div className="mb-6 px-4 sm:px-6 lg:px-10">
              <div className="overflow-hidden rounded-lg bg-forest-deep/50 p-6 backdrop-blur-md">
                <h2 className="mb-6 text-lg font-semibold text-white">Training Timeline</h2>

                {/* Phase range bars - proportional to weeks */}
                <div className="relative">
                  {/* Phase bars container */}
                  <div className="flex h-8 w-full overflow-hidden rounded-lg">
                    {data.phases.map((phase, index) => {
                      const colors = getColorClasses(phase.color);
                      const widthPercent =
                        (phase.weekCount / (data.summary?.totalWeeks ?? 1)) * 100;
                      const isFirst = index === 0;
                      const isLast = index === data.phases.length - 1;

                      return (
                        <div
                          key={phase.id}
                          className={`relative flex items-center justify-center ${
                            phase.status === "completed"
                              ? colors.bg.replace("/20", "/60")
                              : phase.status === "in_progress"
                                ? colors.bg.replace("/20", "/40")
                                : "bg-white/10"
                          } ${isFirst ? "rounded-l-lg" : ""} ${isLast ? "rounded-r-lg" : ""}`}
                          style={{ width: `${widthPercent}%` }}
                        >
                          {/* Phase name inside bar */}
                          <span
                            className={`text-xs font-medium ${
                              phase.status === "upcoming" ? "text-white/50" : "text-white"
                            } truncate px-2`}
                          >
                            {phase.weekCount >= 5 ? phase.name : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current position marker */}
                  {data.summary && data.summary.currentWeek <= data.summary.totalWeeks && (
                    <div
                      className="absolute top-0 h-8 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      style={{
                        left: `${((data.summary.currentWeek - 0.5) / data.summary.totalWeeks) * 100}%`,
                      }}
                    >
                      {/* Current week indicator */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white px-2 py-0.5 text-xs font-medium text-gray-900">
                        Week {data.summary.currentWeek}
                      </div>
                    </div>
                  )}

                  {/* Phase labels below the bar */}
                  <div className="mt-3 flex">
                    {data.phases.map((phase) => {
                      const colors = getColorClasses(phase.color);
                      const widthPercent =
                        (phase.weekCount / (data.summary?.totalWeeks ?? 1)) * 100;

                      return (
                        <div
                          key={`label-${phase.id}`}
                          className="flex flex-col items-center"
                          style={{ width: `${widthPercent}%` }}
                        >
                          <div className={`text-center text-xs font-medium ${colors.text}`}>
                            {phase.name}
                          </div>
                          <div className="text-center text-xs text-white/40">
                            {phase.duration} • W{phase.weeks[0]?.weekNumber}-
                            {phase.weeks[phase.weeks.length - 1]?.weekNumber}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Race day marker at the end */}
                  <div className="absolute -right-2 top-0 flex h-8 items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400/20">
                      <Flag className="h-4 w-4 text-amber-400" />
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-emerald-500/60" />
                    <span className="text-white/60">Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-emerald-500/40" />
                    <span className="text-white/60">In Progress</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-white/10" />
                    <span className="text-white/60">Upcoming</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-0.5 bg-white" />
                    <span className="text-white/60">Current Week</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Phase Highlight */}
            {data.currentPhase && (
              <div className="mb-6 px-4 sm:px-6 lg:px-10">
                <div className="rounded-lg bg-emerald-500/10 p-6 backdrop-blur-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">CURRENT PHASE</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white">{data.currentPhase.name}</h2>
                      <p className="mt-2 text-white/70">{data.currentPhase.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/60">Week</div>
                      <div className="text-3xl font-bold text-white">
                        {data.currentPhase.currentWeekNumber}
                        <span className="text-lg text-white/40">
                          {" "}
                          of {data.summary?.totalWeeks ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* This week's targets */}
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-forest-deep/30 p-4 backdrop-blur-md">
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Target className="h-4 w-4" />
                        Weekly Mileage Target
                      </div>
                      <div className="mt-1 text-xl font-bold text-white">
                        {data.currentPhase.thisWeekTarget} km
                      </div>
                      {data.currentPhase.thisWeekActual > 0 && (
                        <div className="mt-1 text-sm text-emerald-400">
                          {Math.round(data.currentPhase.thisWeekActual * 10) / 10} km completed
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg bg-forest-deep/30 p-4 backdrop-blur-md">
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <TrendingUp className="h-4 w-4" />
                        Long Run Target
                      </div>
                      <div className="mt-1 text-xl font-bold text-purple-400">
                        {data.currentPhase.thisWeekLongRunTarget} km
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Phase Cards */}
            <div className="space-y-4 px-4 sm:px-6 lg:px-10">
              <h2 className="text-lg font-semibold text-white">All Phases</h2>

              {data.phases.map((phase) => {
                const colors = getColorClasses(phase.color);
                const isExpanded = expandedPhase === phase.id;

                return (
                  <div
                    key={phase.id}
                    className={`overflow-hidden rounded-lg backdrop-blur-md transition-all ${
                      phase.status === "in_progress" ? colors.bg : "bg-forest-deep/50"
                    }`}
                  >
                    {/* Phase Header - Clickable */}
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`rounded-lg p-2 ${colors.bg}`}>
                          <span className={colors.text}>
                            <PhaseIcon color={phase.color} />
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-white">{phase.name}</h3>
                            <StatusBadge status={phase.status} />
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-white/60">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDateRange(phase.startDate, phase.endDate)}
                            </span>
                            <span>{phase.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Quick stats */}
                        <div className="hidden text-right sm:block">
                          <div className="text-sm text-white/60">Long Runs</div>
                          <div className="font-medium text-purple-400">{phase.longRunRange}</div>
                        </div>
                        <div className="hidden text-right sm:block">
                          <div className="text-sm text-white/60">Weekly</div>
                          <div className="font-medium text-white">{phase.mileageRange}</div>
                        </div>
                        {phase.completionRate !== null && (
                          <div className="hidden text-right sm:block">
                            <div className="text-sm text-white/60">Completion</div>
                            <div className="font-medium text-emerald-400">
                              {phase.completionRate}%
                            </div>
                          </div>
                        )}
                        <ChevronDown
                          className={`h-5 w-5 text-white/60 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-6">
                        {/* Description and Focus */}
                        <div className="mb-6 grid gap-6 sm:grid-cols-2">
                          <div>
                            <h4 className="mb-2 text-sm font-medium text-white/60">
                              About This Phase
                            </h4>
                            <p className="text-sm text-white/80">{phase.description}</p>
                          </div>
                          <div>
                            <h4 className="mb-2 text-sm font-medium text-white/60">
                              Key Focus Areas
                            </h4>
                            <ul className="space-y-1">
                              {phase.focus.map((item, i) => (
                                <li
                                  key={i}
                                  className="flex items-center gap-2 text-sm text-white/80"
                                >
                                  <ChevronRight className={`h-3 w-3 ${colors.text}`} />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Weekly Breakdown */}
                        <div>
                          <h4 className="mb-3 text-sm font-medium text-white/60">
                            Weekly Breakdown
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-sm">
                              <thead>
                                <tr className="border-b border-white/10 text-left text-white/60">
                                  <th className="pb-3 font-medium">Week</th>
                                  <th className="pb-3 font-medium">Dates</th>
                                  <th className="pb-3 font-medium">Long Run</th>
                                  <th className="pb-3 font-medium">Weekly Mileage</th>
                                  <th className="pb-3 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {phase.weeks.map((week) => (
                                  <tr
                                    key={week.weekNumber}
                                    className={`border-b border-white/5 ${
                                      week.status === "current" ? "bg-blue-500/10" : ""
                                    }`}
                                  >
                                    <td className="py-3 font-medium text-white">
                                      W{week.weekNumber}
                                    </td>
                                    <td className="py-3 text-white/70">
                                      {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                                    </td>
                                    <td className="py-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-purple-400">
                                          {week.longRunTarget} km
                                        </span>
                                        {week.longRunActual !== null && week.longRunActual > 0 && (
                                          <span
                                            className={`text-xs ${
                                              week.longRunActual >= week.longRunTarget
                                                ? "text-emerald-400"
                                                : "text-amber-400"
                                            }`}
                                          >
                                            ({week.longRunActual} km)
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-white">
                                          {week.weeklyMileageTarget} km
                                        </span>
                                        {week.weeklyMileageActual !== null &&
                                          week.weeklyMileageActual > 0 && (
                                            <span
                                              className={`text-xs ${
                                                week.weeklyMileageActual >= week.weeklyMileageTarget
                                                  ? "text-emerald-400"
                                                  : "text-amber-400"
                                              }`}
                                            >
                                              ({week.weeklyMileageActual} km)
                                            </span>
                                          )}
                                      </div>
                                    </td>
                                    <td className="py-3">
                                      <WeekStatusIcon status={week.status} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Race Day Card */}
            <div className="mt-8 px-4 sm:px-6 lg:px-10">
              <div className="rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-amber-500/20 p-3">
                      <Flag className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {data.summary?.raceName ?? "Half Marathon"}
                      </h3>
                      <p className="text-white/60">Half Marathon • 21.1km</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-amber-400">
                      {data.summary?.daysUntilRace ?? 0}
                    </div>
                    <div className="text-sm text-white/60">days to go</div>
                    <div className="mt-1 text-sm font-medium text-amber-400">
                      {data.summary?.raceDate
                        ? new Date(data.summary.raceDate).toLocaleDateString("en-IE", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "May 17, 2026"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col items-start justify-between gap-4 px-4 pb-4 pt-6 sm:flex-row sm:items-center sm:px-6 lg:px-10">
              <Link
                href="/"
                className="flex items-center gap-2 text-white/60 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>

            {/* Solokit Badge */}
            <div className="px-4 py-3 text-center sm:px-6 lg:px-10">
              <SolokitBadge />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
