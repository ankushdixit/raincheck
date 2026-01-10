/**
 * Recommendation Card Component
 *
 * Displays a single recommendation with priority, category, and description.
 */

import type { RecommendationCategory, RecommendationPriority, Phase } from "@prisma/client";
import type { ReactNode } from "react";

/**
 * Formats description text with basic markdown-like styling
 * Handles: line breaks, **bold**, bullet points (• or -), and section headers
 */
function FormattedDescription({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        // Skip empty lines but preserve spacing
        if (!trimmedLine) {
          return <div key={index} className="h-1" />;
        }

        // Check if it's a section header (ends with colon and is short, or starts with **)
        const isHeader =
          (trimmedLine.endsWith(":") &&
            trimmedLine.length < 50 &&
            !trimmedLine.startsWith("•") &&
            !trimmedLine.startsWith("-")) ||
          (trimmedLine.startsWith("**") && trimmedLine.endsWith(":**"));

        // Check if it's a bullet point
        const isBullet =
          trimmedLine.startsWith("•") || trimmedLine.startsWith("-") || trimmedLine.startsWith("*");

        // Check if it's an emoji indicator line (like 🔴, 🟡, 🟢)
        const isEmojiLine = /^(?:🔴|🟡|🟢|⚠️|✓|✅|❌)/.test(trimmedLine);

        // Format bold text (**text**)
        const formatBold = (content: string) => {
          const parts = content.split(/(\*\*[^*]+\*\*)/g);
          return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <span key={i} className="font-semibold text-white/90">
                  {part.slice(2, -2)}
                </span>
              );
            }
            return part;
          });
        };

        if (isHeader) {
          // Render as header
          const headerText = trimmedLine
            .replace(/^\*\*/, "")
            .replace(/\*\*$/, "")
            .replace(/:$/, "");
          return (
            <h5 key={index} className="mt-3 font-semibold text-white/90 first:mt-0">
              {headerText}:
            </h5>
          );
        }

        if (isBullet || isEmojiLine) {
          // Render as bullet point
          const bulletContent = trimmedLine.replace(/^[•\-*]\s*/, "");
          return (
            <div key={index} className="flex gap-2 pl-2">
              <span className="text-white/50">{isEmojiLine ? "" : "•"}</span>
              <span>{formatBold(isEmojiLine ? trimmedLine : bulletContent)}</span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={index} className="text-white/70">
            {formatBold(trimmedLine)}
          </p>
        );
      })}
    </div>
  );
}

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
  /** Hide category badge when cards are already grouped by category */
  hideCategoryBadge?: boolean;
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
  hideCategoryBadge = false,
}: RecommendationCardProps) {
  const catColors = getCategoryColorClasses(recommendation.category);

  return (
    <div className="flex h-full flex-col rounded-lg border border-white/10 bg-black/20 p-4">
      {/* Header: Title + Priority */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-tight text-white">{recommendation.title}</h4>
        <PriorityBadge priority={recommendation.priority} />
      </div>

      {/* Category tag - only show if not grouped by category */}
      {!hideCategoryBadge && (
        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${catColors.bg} ${catColors.text}`}
          >
            <CategoryIcon category={recommendation.category} />
            {formatCategoryName(recommendation.category)}
          </span>
        </div>
      )}

      {/* Description - formatted with markdown-like styling */}
      <div className="flex-1">
        <FormattedDescription text={recommendation.description} />
      </div>

      {/* Source (if present) */}
      {recommendation.source && (
        <p className="mt-3 text-xs text-white/40">Source: {recommendation.source}</p>
      )}
    </div>
  );
}
