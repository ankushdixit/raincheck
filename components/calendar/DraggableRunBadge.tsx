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
 * Checkmark icon component for completed runs
 */
function CheckmarkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      data-testid="checkmark-icon"
      className="inline-block ml-1 flex-shrink-0"
      style={{ minWidth: "12px", minHeight: "12px" }}
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export interface DraggableRunBadgeProps {
  run: Run;
  isDragDisabled?: boolean;
}

/**
 * Draggable run badge component
 *
 * Wraps a run badge with drag functionality using @dnd-kit.
 * Dragging is disabled when:
 * - isDragDisabled is true (e.g., for unauthenticated users)
 * - The run is already completed (completed runs cannot be rescheduled)
 */
export function DraggableRunBadge({ run, isDragDisabled = false }: DraggableRunBadgeProps) {
  // Completed runs should not be draggable - they've already been done
  const isActuallyDragDisabled = isDragDisabled || run.completed;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: run.id,
    data: { run },
    disabled: isActuallyDragDisabled,
  });

  const color = RUN_TYPE_COLORS[run.type];
  const label = RUN_TYPE_LABELS[run.type];

  const style = {
    backgroundColor: color,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isActuallyDragDisabled ? "default" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      className="rounded px-1.5 py-0.5 text-white text-xs font-medium flex items-center touch-none"
      style={style}
      data-testid="run-badge"
      data-run-type={run.type}
      data-completed={run.completed}
      data-draggable={!isActuallyDragDisabled}
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
      className="rounded px-1.5 py-0.5 text-white text-xs font-medium flex items-center shadow-lg"
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
