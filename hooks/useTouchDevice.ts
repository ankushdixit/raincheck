"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the current device is a touch device
 *
 * Uses the CSS media query '(pointer: coarse)' to determine if the device
 * has a coarse pointing device (like a finger on a touchscreen) as the
 * primary input method.
 *
 * @returns Object containing:
 *  - isTouchDevice: true if the device is a touch device
 *  - isLoading: true while detection is in progress (SSR/hydration)
 */
export interface UseTouchDeviceResult {
  isTouchDevice: boolean;
  isLoading: boolean;
}

export function useTouchDevice(): UseTouchDeviceResult {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === "undefined") {
      return;
    }

    // Use matchMedia to detect coarse pointer (touch device)
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    setIsTouchDevice(mediaQuery.matches);
    setIsLoading(false);

    // Listen for changes (e.g., hybrid devices switching input modes)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsTouchDevice(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return { isTouchDevice, isLoading };
}
