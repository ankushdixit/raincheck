"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Run, RunType } from "@prisma/client";

/**
 * Color mapping for run types
 */
const RUN_TYPE_COLORS: Record<RunType, string> = {
  LONG_RUN: "rgba(59, 130, 246, 0.9)", // Blue
  EASY_RUN: "rgba(34, 197, 94, 0.9)", // Green
  TEMPO_RUN: "rgba(249, 115, 22, 0.9)", // Orange
  INTERVAL_RUN: "rgba(168, 85, 247, 0.9)", // Purple
  RECOVERY_RUN: "rgba(156, 163, 175, 0.9)", // Gray
  RACE: "rgba(234, 179, 8, 0.9)", // Gold
};

/**
 * Abbreviated labels for run types
 */
const RUN_TYPE_LABELS: Record<RunType, string> = {
  LONG_RUN: "Long",
  EASY_RUN: "Easy",
  TEMPO_RUN: "Tempo",
  INTERVAL_RUN: "Intervals",
  RECOVERY_RUN: "Recovery",
  RACE: "Race",
};

/**
 * Checkmark icon component for completed runs - positioned in top-right corner
 */
function CheckmarkIcon() {
  return (
    <div
      className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm"
      data-testid="checkmark-icon"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className="text-green-600"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export interface DraggableRunBadgeProps {
  run: Run;
  isDragDisabled?: boolean;
  /** Whether this run is selected in tap-to-move mode */
  isSelected?: boolean;
  /** Callback when run is tapped (for tap-to-move mode) */
  onTap?: (_run: Run) => void;
  /** Whether tap-to-move mode is enabled */
  isTapToMoveEnabled?: boolean;
}

/**
 * Draggable run badge component
 *
 * Wraps a run badge with drag functionality using @dnd-kit.
 * Also supports tap-to-move mode for touch devices.
 *
 * Dragging is disabled when:
 * - isDragDisabled is true (e.g., for unauthenticated users)
 * - The run is already completed (completed runs cannot be rescheduled)
 *
 * Tap-to-move is enabled when:
 * - isTapToMoveEnabled is true (touch device detected)
 * - The run is not completed
 * - User is authenticated (isDragDisabled is false)
 */
export function DraggableRunBadge({
  run,
  isDragDisabled = false,
  isSelected = false,
  onTap,
  isTapToMoveEnabled = false,
}: DraggableRunBadgeProps) {
  // Completed runs should not be draggable or tappable - they've already been done
  const isActuallyDragDisabled = isDragDisabled || run.completed;
  const canTapToMove = isTapToMoveEnabled && !isActuallyDragDisabled && !!onTap;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: run.id,
    data: { run },
    disabled: isActuallyDragDisabled,
  });

  const color = RUN_TYPE_COLORS[run.type];
  const label = RUN_TYPE_LABELS[run.type];

  const handleClick = () => {
    if (canTapToMove) {
      onTap(run);
    }
  };

  // Build class list for selected state
  const classNames = [
    "relative rounded px-1.5 py-0.5 text-white text-xs font-medium flex items-center touch-none",
    "min-h-[44px] min-w-[44px]", // 44px minimum touch target for accessibility
    isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-transparent scale-105" : "",
    isSelected ? "animate-pulse" : "",
    canTapToMove ? "cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    backgroundColor: color,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isActuallyDragDisabled ? "default" : canTapToMove ? "pointer" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      className={classNames}
      style={style}
      data-testid="run-badge"
      data-run-type={run.type}
      data-completed={run.completed}
      data-draggable={!isActuallyDragDisabled}
      data-selected={isSelected}
      data-tap-to-move={canTapToMove}
      onClick={handleClick}
      {...(isActuallyDragDisabled ? {} : { ...attributes, ...listeners })}
    >
      <span className="truncate">
        {label} {run.distance}km
      </span>
      {run.completed && <CheckmarkIcon />}
    </div>
  );
}

/**
 * Static run badge for drag overlay
 *
 * Renders a non-draggable version of the run badge for use in DragOverlay.
 */
export function RunBadgeOverlay({ run }: { run: Run }) {
  const color = RUN_TYPE_COLORS[run.type];
  const label = RUN_TYPE_LABELS[run.type];

  return (
    <div
      className="relative rounded px-1.5 py-0.5 text-white text-xs font-medium flex items-center shadow-lg"
      style={{ backgroundColor: color }}
      data-testid="run-badge-overlay"
    >
      <span className="truncate">
        {label} {run.distance}km
      </span>
      {run.completed && <CheckmarkIcon />}
    </div>
  );
}
