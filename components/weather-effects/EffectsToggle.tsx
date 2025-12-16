"use client";

import { Sparkles, EyeOff } from "lucide-react";
import { useEffectsPreference } from "@/hooks";

interface EffectsToggleProps {
  /** Optional class name for custom styling */
  className?: string;
}

/**
 * Toggle button for enabling/disabling weather effects.
 * Persists user preference to localStorage.
 *
 * @example
 * ```tsx
 * <EffectsToggle className="absolute top-4 right-4" />
 * ```
 */
export function EffectsToggle({ className = "" }: EffectsToggleProps) {
  const { effectsEnabled, toggleEffects, isLoaded } = useEffectsPreference();

  // Don't render until preference is loaded to prevent flicker
  if (!isLoaded) {
    return null;
  }

  return (
    <button
      onClick={toggleEffects}
      className={`
        flex items-center gap-2 px-3 py-2
        min-w-[44px] min-h-[44px]
        bg-surface/80 backdrop-blur-sm
        rounded-lg border border-white/10
        text-sm font-medium
        transition-all duration-200
        hover:bg-surface hover:border-white/20
        focus:outline-none focus:ring-2 focus:ring-amber-400/50
        cursor-pointer
        ${effectsEnabled ? "text-amber-400" : "text-text-secondary"}
        ${className}
      `}
      aria-label={effectsEnabled ? "Disable weather effects" : "Enable weather effects"}
      aria-pressed={effectsEnabled}
      type="button"
    >
      {effectsEnabled ? (
        <>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Effects On</span>
        </>
      ) : (
        <>
          <EyeOff className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Effects Off</span>
        </>
      )}
    </button>
  );
}

export default EffectsToggle;
