"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Configuration options for FPS monitoring
 */
export interface FPSMonitorConfig {
  /** Minimum FPS threshold before triggering callback (default: 20) */
  threshold?: number;
  /** Duration in seconds FPS must be below threshold to trigger (default: 3) */
  sustainedDuration?: number;
  /** Whether monitoring is enabled (default: true) */
  enabled?: boolean;
}

/**
 * FPS monitoring state and controls
 */
export interface FPSMonitorResult {
  /** Current rolling average FPS (1 second window) */
  fps: number;
  /** Whether FPS is below threshold for sustained duration */
  isLowFPS: boolean;
  /** Start monitoring */
  start: () => void;
  /** Stop monitoring */
  stop: () => void;
  /** Whether monitoring is active */
  isMonitoring: boolean;
}

const DEFAULT_THRESHOLD = 20;
const DEFAULT_SUSTAINED_DURATION = 3;
const FPS_SAMPLE_WINDOW_MS = 1000;

/**
 * Hook to monitor frame rate and detect sustained low FPS
 *
 * Uses requestAnimationFrame to calculate frame times and tracks
 * a rolling average FPS over 1 second. Triggers when FPS stays
 * below threshold for the specified duration.
 *
 * @param onLowFPS - Callback fired when sustained low FPS is detected
 * @param config - Optional configuration
 * @returns FPS monitoring state and controls
 *
 * @example
 * ```tsx
 * const { fps, isLowFPS, start, stop } = useFPSMonitor(
 *   () => setEffectsEnabled(false),
 *   { threshold: 20, sustainedDuration: 3 }
 * );
 * ```
 */
export function useFPSMonitor(
  onLowFPS?: () => void,
  config: FPSMonitorConfig = {}
): FPSMonitorResult {
  const {
    threshold = DEFAULT_THRESHOLD,
    sustainedDuration = DEFAULT_SUSTAINED_DURATION,
    enabled = true,
  } = config;

  const [fps, setFps] = useState(60);
  const [isLowFPS, setIsLowFPS] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameTimesRef = useRef<number[]>([]);
  const lowFPSStartRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef(false);

  const calculateFPS = useCallback((frameTimes: number[]): number => {
    if (frameTimes.length < 2) return 60;

    // Calculate average frame time
    let totalFrameTime = 0;
    for (let i = 1; i < frameTimes.length; i++) {
      totalFrameTime += frameTimes[i] - frameTimes[i - 1];
    }
    const avgFrameTime = totalFrameTime / (frameTimes.length - 1);

    // Convert to FPS
    return avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 60;
  }, []);

  const tick = useCallback(
    (timestamp: number) => {
      // Record frame time
      frameTimesRef.current.push(timestamp);

      // Remove old frame times (older than 1 second)
      const cutoffTime = timestamp - FPS_SAMPLE_WINDOW_MS;
      while (frameTimesRef.current.length > 0 && frameTimesRef.current[0] < cutoffTime) {
        frameTimesRef.current.shift();
      }

      // Calculate FPS if we have enough samples (update every 10 frames to reduce re-renders)
      if (frameTimesRef.current.length >= 10) {
        const currentFPS = calculateFPS(frameTimesRef.current);

        // Only update state if FPS changed significantly (by at least 2)
        setFps((prev) => {
          if (Math.abs(prev - currentFPS) >= 2) {
            return currentFPS;
          }
          return prev;
        });

        // Check for sustained low FPS
        if (currentFPS < threshold) {
          if (lowFPSStartRef.current === null) {
            lowFPSStartRef.current = timestamp;
          } else {
            const lowDuration = (timestamp - lowFPSStartRef.current) / 1000;
            if (lowDuration >= sustainedDuration && !hasTriggeredRef.current) {
              setIsLowFPS(true);
              hasTriggeredRef.current = true;
              onLowFPS?.();
            }
          }
        } else {
          // FPS recovered
          lowFPSStartRef.current = null;
          if (hasTriggeredRef.current) {
            // Reset after a sustained period of good FPS
            const goodDuration = timestamp - (lastTimeRef.current || timestamp);
            if (goodDuration > FPS_SAMPLE_WINDOW_MS * 2) {
              setIsLowFPS(false);
              hasTriggeredRef.current = false;
            }
          }
        }
      }

      lastTimeRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(tick);
    },
    [calculateFPS, onLowFPS, sustainedDuration, threshold]
  );

  const start = useCallback(() => {
    if (animationFrameRef.current !== null || typeof window === "undefined") {
      return;
    }

    // Reset state
    frameTimesRef.current = [];
    lowFPSStartRef.current = null;
    hasTriggeredRef.current = false;
    setIsLowFPS(false);
    setFps(60);
    setIsMonitoring(true);

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, start, stop]);

  return {
    fps,
    isLowFPS,
    start,
    stop,
    isMonitoring,
  };
}
