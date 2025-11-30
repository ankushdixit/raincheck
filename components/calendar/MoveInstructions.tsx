"use client";

export interface MoveInstructionsProps {
  /** Whether a run is currently selected for moving */
  isVisible: boolean;
  /** Callback to cancel the selection */
  onCancel?: () => void;
}

/**
 * Move Instructions Component
 *
 * Displays instructions when a run is selected in tap-to-move mode.
 * Shows guidance text and a cancel button for touch users.
 */
export function MoveInstructions({ isVisible, onCancel }: MoveInstructionsProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="px-3 py-2 flex items-center justify-between bg-amber-500/20 border-b border-amber-500/30"
      data-testid="move-instructions"
    >
      <p className="text-sm text-amber-200">Tap a day to move this run</p>
      {onCancel && (
        <button
          onClick={onCancel}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center px-3 py-1 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded transition-colors"
          aria-label="Cancel move"
          data-testid="move-cancel-button"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
