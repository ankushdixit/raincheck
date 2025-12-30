/**
 * Recommendation Card Component
 *
 * Displays a single recommendation with priority, category, and description.
 */

import type { RecommendationCategory, RecommendationPriority, Phase } from "@prisma/client";
import type { ReactNode } from "react";

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

interface RecommendationCardProps {
  recommendation: Recommendation;
  getCategoryColorClasses: (_category: RecommendationCategory) => { text: string; bg: string };
  formatCategoryName: (_category: RecommendationCategory) => string;
  CategoryIcon: (_props: { category: RecommendationCategory }) => ReactNode;
}

/** Priority badge component */
function PriorityBadge({ priority }: { priority: RecommendationPriority }) {
  switch (priority) {
    case "HIGH":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
          HIGH
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
          MEDIUM
        </span>
      );
    case "LOW":
      return (
        <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/60">
          LOW
        </span>
      );
    default:
      return null;
  }
}

export function RecommendationCard({
  recommendation,
  getCategoryColorClasses,
  formatCategoryName,
  CategoryIcon,
}: RecommendationCardProps) {
  const catColors = getCategoryColorClasses(recommendation.category);

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      {/* Header: Title + Priority */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-medium text-white">{recommendation.title}</h4>
        <PriorityBadge priority={recommendation.priority} />
      </div>

      {/* Category tag */}
      <div className="mt-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${catColors.bg} ${catColors.text}`}
        >
          <CategoryIcon category={recommendation.category} />
          {formatCategoryName(recommendation.category)}
        </span>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm leading-relaxed text-white/70">{recommendation.description}</p>

      {/* Source (if present) */}
      {recommendation.source && (
        <p className="mt-3 text-xs text-white/40">Source: {recommendation.source}</p>
      )}
    </div>
  );
}
