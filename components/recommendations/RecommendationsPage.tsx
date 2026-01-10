"use client";

/**
 * Recommendations Page
 *
 * Displays training recommendations grouped by phase.
 * Matches training-phases design with expandable sections.
 * Public - no authentication required.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ArrowLeft,
  Shield,
  Apple,
  Gauge,
  Moon,
  Shirt,
  Brain,
  Mountain,
  TrendingUp,
  Zap,
  Flag,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { SolokitBadge } from "@/components/common";
import { RecommendationCard } from "./RecommendationCard";
import type { RecommendationCategory, RecommendationPriority, Phase } from "@prisma/client";

/** Header with weather info */
function RecommendationsHeader() {
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
            width={210}
            height={53}
            priority
            className="-ml-2 h-auto w-[120px] sm:w-[168px] lg:-ml-3.5 lg:w-[210px]"
          />
        </Link>
        <p className="mt-1 text-sm text-white/60">Training Recommendations</p>
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

/** Category icon component */
function CategoryIcon({ category }: { category: RecommendationCategory }) {
  const iconClass = "h-4 w-4";
  switch (category) {
    case "INJURY_PREVENTION":
      return <Shield className={iconClass} />;
    case "NUTRITION":
      return <Apple className={iconClass} />;
    case "PACING":
      return <Gauge className={iconClass} />;
    case "RECOVERY":
      return <Moon className={iconClass} />;
    case "GEAR":
      return <Shirt className={iconClass} />;
    case "MENTAL":
      return <Brain className={iconClass} />;
    default:
      return <Sparkles className={iconClass} />;
  }
}

/** Phase icon component */
function PhaseIcon({ phase }: { phase: Phase | null }) {
  const iconClass = "h-5 w-5";
  if (!phase) return <Sparkles className={iconClass} />;
  switch (phase) {
    case "BASE_BUILDING":
      return <Mountain className={iconClass} />;
    case "BASE_EXTENSION":
      return <TrendingUp className={iconClass} />;
    case "SPEED_DEVELOPMENT":
      return <Zap className={iconClass} />;
    case "PEAK_TAPER":
      return <Flag className={iconClass} />;
    default:
      return <Sparkles className={iconClass} />;
  }
}

/** Get phase color classes */
function getPhaseColorClasses(phase: Phase | null) {
  const colors: Record<string, { text: string; bg: string; border: string }> = {
    GENERAL: {
      text: "text-cyan-400",
      bg: "bg-cyan-500/20",
      border: "border-cyan-500/50",
    },
    BASE_BUILDING: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/50",
    },
    BASE_EXTENSION: {
      text: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/50",
    },
    SPEED_DEVELOPMENT: {
      text: "text-amber-400",
      bg: "bg-amber-500/20",
      border: "border-amber-500/50",
    },
    PEAK_TAPER: {
      text: "text-purple-400",
      bg: "bg-purple-500/20",
      border: "border-purple-500/50",
    },
  };
  return colors[phase ?? "GENERAL"] ?? colors.GENERAL;
}

/** Get category color classes */
function getCategoryColorClasses(category: RecommendationCategory) {
  const colors: Record<string, { text: string; bg: string }> = {
    INJURY_PREVENTION: { text: "text-red-400", bg: "bg-red-500/20" },
    NUTRITION: { text: "text-green-400", bg: "bg-green-500/20" },
    PACING: { text: "text-blue-400", bg: "bg-blue-500/20" },
    RECOVERY: { text: "text-indigo-400", bg: "bg-indigo-500/20" },
    GEAR: { text: "text-orange-400", bg: "bg-orange-500/20" },
    MENTAL: { text: "text-pink-400", bg: "bg-pink-500/20" },
  };
  return colors[category] ?? { text: "text-white/60", bg: "bg-white/10" };
}

/** Format phase name for display */
function formatPhaseName(phase: Phase | null): string {
  if (!phase) return "General";
  return phase
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/** Format category name for display */
function formatCategoryName(category: RecommendationCategory): string {
  return category
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/** Recommendation type from API */
interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  phase: Phase | null;
  priority: RecommendationPriority;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Phase section with recommendations */
interface PhaseSectionProps {
  phase: Phase | null;
  recommendations: Recommendation[];
  isExpanded: boolean;
  onToggle: () => void;
}

/** Group recommendations by category */
function groupByCategory(
  recommendations: Recommendation[]
): Record<RecommendationCategory, Recommendation[]> {
  const grouped: Record<string, Recommendation[]> = {};

  // Define category order
  const categoryOrder: RecommendationCategory[] = [
    "INJURY_PREVENTION",
    "RECOVERY",
    "NUTRITION",
    "PACING",
    "MENTAL",
    "GEAR",
  ];

  // Initialize all categories
  categoryOrder.forEach((cat) => {
    grouped[cat] = [];
  });

  // Group recommendations
  recommendations.forEach((rec) => {
    if (grouped[rec.category]) {
      grouped[rec.category].push(rec);
    }
  });

  return grouped as Record<RecommendationCategory, Recommendation[]>;
}

function PhaseSection({ phase, recommendations, isExpanded, onToggle }: PhaseSectionProps) {
  const colors = getPhaseColorClasses(phase);
  const count = recommendations.length;
  const groupedByCategory = groupByCategory(recommendations);

  // Get categories that have recommendations
  const categoriesWithRecs = Object.entries(groupedByCategory).filter(
    ([, recs]) => recs.length > 0
  ) as [RecommendationCategory, Recommendation[]][];

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-all ${
        count > 0 ? `${colors.bg} ${colors.border}` : "border-white/10 bg-white/5"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${colors.bg}`}>
            <span className={colors.text}>
              <PhaseIcon phase={phase} />
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{formatPhaseName(phase)}</h3>
            <p className="text-sm text-white/60">
              {count} recommendation{count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-white/60 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && count > 0 && (
        <div className="border-t border-white/10 p-4">
          {categoriesWithRecs.map(([category, recs]) => {
            const catColors = getCategoryColorClasses(category);
            return (
              <div key={category} className="mb-6 last:mb-0">
                {/* Category Header */}
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full p-1.5 ${catColors.bg}`}>
                    <span className={catColors.text}>
                      <CategoryIcon category={category} />
                    </span>
                  </span>
                  <h4 className={`text-sm font-semibold ${catColors.text}`}>
                    {formatCategoryName(category)}
                  </h4>
                  <span className="text-xs text-white/40">({recs.length})</span>
                </div>

                {/* 3-Column Grid of Cards */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {recs.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      getCategoryColorClasses={getCategoryColorClasses}
                      formatCategoryName={formatCategoryName}
                      CategoryIcon={CategoryIcon}
                      hideCategoryBadge
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isExpanded && count === 0 && (
        <div className="border-t border-white/10 p-6 text-center">
          <p className="text-sm text-white/40">No recommendations for this phase yet</p>
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  const { data, isLoading } = api.recommendations.getGroupedByPhase.useQuery();

  // Track expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["GENERAL"]));

  const toggleSection = (phase: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  // Phase order for display
  const phaseOrder: (Phase | null)[] = [
    null, // General
    "BASE_BUILDING",
    "BASE_EXTENSION",
    "SPEED_DEVELOPMENT",
    "PEAK_TAPER",
  ];

  return (
    <main className="relative min-h-screen w-full">
      {/* Dark Background */}
      <div className="fixed inset-0 z-0 bg-forest-deep" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10">
        <RecommendationsHeader />

        {isLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        ) : !data || data.total === 0 ? (
          <div className="px-4 py-12 text-center sm:px-6 lg:px-10">
            <div className="mx-auto max-w-md">
              <Sparkles className="mx-auto h-12 w-12 text-white/20" />
              <h2 className="mt-4 text-lg font-semibold text-white">No recommendations yet</h2>
              <p className="mt-2 text-sm text-white/60">
                Training recommendations will appear here as you progress through your training.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Stats Row */}
            <div className="mb-6 grid grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:px-6 lg:grid-cols-7 lg:px-10">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-white/60">Total</div>
                <div className="mt-1 text-2xl font-bold text-white">{data.total}</div>
                <div className="text-xs text-white/40">recommendations</div>
              </div>

              {/* Category counts */}
              {Object.entries(data.categoryCounts).map(([category, count]) => {
                const catColors = getCategoryColorClasses(category as RecommendationCategory);
                return (
                  <div key={category} className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className={`flex items-center gap-1.5 text-sm ${catColors.text}`}>
                      <CategoryIcon category={category as RecommendationCategory} />
                      <span className="truncate">
                        {formatCategoryName(category as RecommendationCategory)}
                      </span>
                    </div>
                    <div className={`mt-1 text-2xl font-bold ${catColors.text}`}>{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Phase Sections */}
            <div className="space-y-4 px-4 sm:px-6 lg:px-10">
              <h2 className="text-lg font-semibold text-white">By Training Phase</h2>

              {phaseOrder.map((phase) => {
                const key = phase ?? "GENERAL";
                const recommendations = (data.grouped[key] ?? []) as Recommendation[];
                return (
                  <PhaseSection
                    key={key}
                    phase={phase}
                    recommendations={recommendations}
                    isExpanded={expandedSections.has(key)}
                    onToggle={() => toggleSection(key)}
                  />
                );
              })}
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
