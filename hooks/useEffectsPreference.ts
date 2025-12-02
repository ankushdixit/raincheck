"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "raincheck:effects-enabled";

/**
 * Effects preference state and controls
 */
export interface EffectsPreferenceResult {
  /** Whether effects are enabled */
  effectsEnabled: boolean;
  /** Toggle effects on/off */
  toggleEffects: () => void;
  /** Set effects enabled state explicitly */
  setEffectsEnabled: (_enabled: boolean) => void;
  /** Whether preference has been loaded from storage */
  isLoaded: boolean;
}

/**
 * Hook to manage user preference for weather effects
 *
 * Persists preference to localStorage and provides controls
 * for toggling effects on/off.
 *
 * @param defaultEnabled - Default enabled state (default: true)
 * @returns Preference state and controls
 *
 * @example
 * ```tsx
 * const { effectsEnabled, toggleEffects } = useEffectsPreference();
 *
 * return (
 *   <button onClick={toggleEffects}>
 *     Effects: {effectsEnabled ? 'On' : 'Off'}
 *   </button>
 * );
 * ```
 */
export function useEffectsPreference(defaultEnabled: boolean = true): EffectsPreferenceResult {
  const [effectsEnabled, setEffectsEnabledState] = useState(defaultEnabled);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoaded(true);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setEffectsEnabledState(stored === "true");
      }
    } catch {
      // localStorage not available, use default
    }

    setIsLoaded(true);
  }, []);

  // Save preference to localStorage
  const setEffectsEnabled = useCallback((enabled: boolean) => {
    setEffectsEnabledState(enabled);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, String(enabled));
      } catch {
        // localStorage not available
      }
    }
  }, []);

  // Toggle effects
  const toggleEffects = useCallback(() => {
    setEffectsEnabled(!effectsEnabled);
  }, [effectsEnabled, setEffectsEnabled]);

  return {
    effectsEnabled,
    toggleEffects,
    setEffectsEnabled,
    isLoaded,
  };
}
