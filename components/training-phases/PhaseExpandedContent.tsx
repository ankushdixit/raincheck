/**
 * Phase Expanded Content Component
 *
 * Displays rich, phase-specific content when a phase card is expanded:
 * - Science explanation + Success criteria (left column)
 * - Common mistakes + Coach tip (right column)
 * - External resources with links
 * - Phase-specific weekly table
 */

"use client";

import {
  ChevronRight,
  ExternalLink,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import type { PhaseResource, TableColumnKey } from "@/server/api/routers/stats";
import { PhaseWeeklyTable } from "./PhaseWeeklyTable";
import type { WeekData } from "./PhaseTableColumns";

/** Props for phase data from API */
interface PhaseData {
  id: string;
  name: string;
  description: string;
  focus: string[];
  color: string;
  science: string;
  successCriteria: string[];
  commonMistakes: string[];
  coachTip: string;
  tableColumns: TableColumnKey[];
  resources: PhaseResource[];
  status: "completed" | "in_progress" | "upcoming" | "interrupted";
  weeks: WeekData[];
}

interface PhaseExpandedContentProps {
  phase: PhaseData;
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
    teal: {
      text: "text-teal-400",
      bg: "bg-teal-500/20",
      border: "border-teal-500/50",
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

/** Science & Success Criteria Section */
function ScienceSection({
  science,
  successCriteria,
  colors,
}: {
  science: string;
  successCriteria: string[];
  colors: ReturnType<typeof getColorClasses>;
}) {
  return (
    <div className="space-y-4">
      {/* The Science */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className={`h-4 w-4 ${colors.text}`} />
          <h4 className="text-sm font-medium text-white/80">The Science</h4>
        </div>
        <p className="text-sm leading-relaxed text-white/70">{science}</p>
      </div>

      {/* Success Criteria */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <h4 className="text-sm font-medium text-white/80">What Success Looks Like</h4>
        </div>
        <ul className="space-y-1.5">
          {successCriteria.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
              <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Mistakes & Coach Tip Section */
function AdviceSection({
  commonMistakes,
  coachTip,
  colors,
}: {
  commonMistakes: string[];
  coachTip: string;
  colors: ReturnType<typeof getColorClasses>;
}) {
  return (
    <div className="space-y-4">
      {/* Common Mistakes */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h4 className="text-sm font-medium text-white/80">Common Mistakes</h4>
        </div>
        <ul className="space-y-1.5">
          {commonMistakes.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
              <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Coach Tip */}
      <div className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}>
        <div className="mb-2 flex items-center gap-2">
          <Lightbulb className={`h-4 w-4 ${colors.text}`} />
          <h4 className={`text-sm font-medium ${colors.text}`}>Coach&apos;s Tip</h4>
        </div>
        <p className="text-sm italic leading-relaxed text-white/80">&ldquo;{coachTip}&rdquo;</p>
      </div>
    </div>
  );
}

/** External Resources Section */
function ResourcesSection({
  resources,
  colors,
}: {
  resources: PhaseResource[];
  colors: ReturnType<typeof getColorClasses>;
}) {
  if (!resources.length) return null;

  return (
    <div className="mt-6">
      <h4 className="mb-3 text-sm font-medium text-white/60">Learn More</h4>
      <div className="flex flex-wrap gap-3">
        {resources.map((resource, i) => (
          <a
            key={i}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center gap-2 rounded-lg border ${colors.border} ${colors.bg} px-3 py-2 text-sm transition-all hover:scale-[1.02]`}
          >
            <span className="text-white/80">{resource.title}</span>
            <span className="text-xs text-white/40">({resource.source})</span>
            <ExternalLink className="h-3.5 w-3.5 text-white/40 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </div>
    </div>
  );
}

/** Main expanded content component */
export function PhaseExpandedContent({ phase }: PhaseExpandedContentProps) {
  const colors = getColorClasses(phase.color);

  return (
    <div className="border-t border-white/10 p-6">
      {/* Two-column grid: Science/Success + Mistakes/Tip */}
      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <ScienceSection
          science={phase.science}
          successCriteria={phase.successCriteria}
          colors={colors}
        />
        <AdviceSection
          commonMistakes={phase.commonMistakes}
          coachTip={phase.coachTip}
          colors={colors}
        />
      </div>

      {/* External Resources */}
      <ResourcesSection resources={phase.resources} colors={colors} />

      {/* Phase-specific Weekly Table */}
      <div className="mt-6">
        <h4 className="mb-3 text-sm font-medium text-white/60">Weekly Breakdown</h4>
        <PhaseWeeklyTable
          weeks={phase.weeks}
          columns={phase.tableColumns}
          phaseColor={phase.color}
        />
      </div>
    </div>
  );
}
