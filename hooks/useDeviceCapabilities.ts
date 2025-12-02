"use client";

import { useState, useEffect } from "react";

/**
 * Device tier classification for performance optimization
 */
export type DeviceTier = "high" | "medium" | "low";

/**
 * Device capabilities for adaptive rendering
 */
export interface DeviceCapabilities {
  /** Whether the device is mobile (touch-primary) */
  isMobile: boolean;
  /** Whether the user prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Number of logical CPU cores (0 if unavailable) */
  hardwareConcurrency: number;
  /** Device tier for performance optimization */
  tier: DeviceTier;
  /** Whether detection is complete */
  isLoading: boolean;
}

/**
 * Calculate device tier based on capabilities
 */
function calculateDeviceTier(isMobile: boolean, hardwareConcurrency: number): DeviceTier {
  // Low-end: mobile with 4 or fewer cores, or any device with 2 or fewer cores
  if (hardwareConcurrency <= 2 || (isMobile && hardwareConcurrency <= 4)) {
    return "low";
  }
  // Medium: mobile with more than 4 cores, or desktop with 4-6 cores
  if (isMobile || hardwareConcurrency <= 6) {
    return "medium";
  }
  // High: desktop with more than 6 cores
  return "high";
}

/**
 * Hook to detect device capabilities for performance optimization
 *
 * Detects:
 * - Mobile vs desktop (via matchMedia pointer: coarse)
 * - Prefers reduced motion (via matchMedia)
 * - Hardware concurrency (navigator.hardwareConcurrency)
 * - Device tier based on capabilities
 *
 * @returns Device capabilities object
 *
 * @example
 * ```tsx
 * const { isMobile, tier, prefersReducedMotion } = useDeviceCapabilities();
 *
 * if (prefersReducedMotion || tier === 'low') {
 *   // Skip animations
 * }
 * ```
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    prefersReducedMotion: false,
    hardwareConcurrency: 0,
    tier: "high",
    isLoading: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Detect mobile via coarse pointer (touch device)
    const mobileQuery = window.matchMedia("(pointer: coarse)");
    const isMobile = mobileQuery.matches;

    // Detect reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = motionQuery.matches;

    // Get hardware concurrency (defaults to 4 if not available)
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    // Calculate device tier
    const tier = calculateDeviceTier(isMobile, hardwareConcurrency);

    setCapabilities({
      isMobile,
      prefersReducedMotion,
      hardwareConcurrency,
      tier,
      isLoading: false,
    });

    // Listen for mobile/pointer changes
    const handleMobileChange = (event: MediaQueryListEvent) => {
      setCapabilities((prev) => {
        const newIsMobile = event.matches;
        return {
          ...prev,
          isMobile: newIsMobile,
          tier: calculateDeviceTier(newIsMobile, prev.hardwareConcurrency),
        };
      });
    };

    // Listen for motion preference changes
    const handleMotionChange = (event: MediaQueryListEvent) => {
      setCapabilities((prev) => ({
        ...prev,
        prefersReducedMotion: event.matches,
      }));
    };

    mobileQuery.addEventListener("change", handleMobileChange);
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      mobileQuery.removeEventListener("change", handleMobileChange);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return capabilities;
}
