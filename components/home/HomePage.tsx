"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getTrailImage, getTintColor, getNightTint } from "@/components/trail";
import { WeatherForecast } from "@/components/weather";
import { WeatherEffectLayer } from "@/components/weather-effects";
import { RunSuggestions } from "@/components/suggestions";
import { TrainingCalendar } from "@/components/calendar";
import { useIsAuthenticated } from "@/hooks";
import { api } from "@/lib/api";
import { Header } from "./Header";
import { InfoBoxes } from "./InfoBoxes";
import { StoryCard } from "./StoryCard";

/** Selected day data for background coordination */
interface SelectedDay {
  condition: string;
  datetime: Date;
}

/** Background layer state for cross-fade */
interface BackgroundLayer {
  image: string;
  tint: string;
}

/** Duration to show selected day preview before reverting to current weather */
const PREVIEW_DURATION_MS = 10000;

/**
 * HomePage component that coordinates the weather-reactive background
 * with the weather display components.
 * - Default background based on current weather + time of day (night overlay)
 * - Clicking a forecast day shows preview for 10 seconds, then reverts
 */
export function HomePage() {
  // Get authentication state
  const { isAuthenticated } = useIsAuthenticated();

  // Fetch current weather for default background
  const { data: currentWeather } = api.weather.getCurrentWeather.useQuery({});

  // Get current condition (from current weather, updated on load)
  const currentConditionRef = useRef<string>("");

  // Two background layers for cross-fade effect
  const [layers, setLayers] = useState<[BackgroundLayer, BackgroundLayer]>([
    { image: getTrailImage("default"), tint: getTintColor("default") },
    { image: getTrailImage("default"), tint: getTintColor("default") },
  ]);

  // Track which layer is currently visible (0 or 1)
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);

  // Track displayed weather condition for weather effects
  const [displayedCondition, setDisplayedCondition] = useState<string>("");

  // Track selected forecast day index (null = showing current weather)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Timer ref for auto-clearing selection
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track auto-disable notification
  const [showAutoDisableToast, setShowAutoDisableToast] = useState(false);

  // Use ref to track active layer in callback without causing re-renders
  const activeLayerRef = useRef<0 | 1>(0);

  // Night overlay state (updates every minute)
  const [nightTint, setNightTint] = useState<string>(getNightTint());

  // Update night overlay every minute
  useEffect(() => {
    const updateNightTint = () => setNightTint(getNightTint());
    const interval = setInterval(updateNightTint, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update background helper function
  const updateBackground = useCallback((condition: string) => {
    const newImage = getTrailImage(condition);
    const newTint = getTintColor(condition);

    // Update weather condition for effects layer
    setDisplayedCondition(condition);

    // Determine which layer to update (the inactive one)
    const currentActive = activeLayerRef.current;
    const inactiveLayer: 0 | 1 = currentActive === 0 ? 1 : 0;

    // Update the inactive layer with new background
    setLayers((prev) => {
      const newLayers: [BackgroundLayer, BackgroundLayer] = [...prev];
      newLayers[inactiveLayer] = { image: newImage, tint: newTint };
      return newLayers;
    });

    // Toggle active layer to trigger cross-fade
    activeLayerRef.current = inactiveLayer;
    setActiveLayer(inactiveLayer);
  }, []);

  // Set default background based on current weather when it loads
  useEffect(() => {
    if (currentWeather && selectedDayIndex === null) {
      const condition = currentWeather.condition;
      currentConditionRef.current = condition;
      updateBackground(condition);
    }
  }, [currentWeather, selectedDayIndex, updateBackground]);

  // Revert to current weather
  const revertToCurrentWeather = useCallback(() => {
    setSelectedDayIndex(null);
    if (currentConditionRef.current) {
      updateBackground(currentConditionRef.current);
    }
  }, [updateBackground]);

  // Handle effects auto-disable due to low FPS
  const handleEffectsAutoDisable = useCallback(() => {
    setShowAutoDisableToast(true);
    setTimeout(() => setShowAutoDisableToast(false), 5000);
  }, []);

  // Handle day selection with 10-second preview
  const handleDaySelect = useCallback(
    (day: SelectedDay, index: number) => {
      // Clear any existing timer
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }

      // Update selection and background
      setSelectedDayIndex(index);
      updateBackground(day.condition);

      // Set timer to revert after 10 seconds
      previewTimerRef.current = setTimeout(() => {
        revertToCurrentWeather();
      }, PREVIEW_DURATION_MS);
    },
    [updateBackground, revertToCurrentWeather]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    };
  }, []);

  return (
    <main
      className="relative h-screen w-screen overflow-hidden"
      data-testid="trail-background"
      data-active-layer={activeLayer}
      data-layer0-image={layers[0].image}
      data-layer1-image={layers[1].image}
    >
      {/* Background Layer 0 */}
      <div
        className="absolute top-0 left-0 w-full h-full z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: `linear-gradient(${layers[0].tint}, ${layers[0].tint}), url('/images/trails/${layers[0].image}')`,
          opacity: activeLayer === 0 ? 1 : 0,
        }}
        data-testid="background-layer-0"
        aria-hidden="true"
      />

      {/* Background Layer 1 */}
      <div
        className="absolute top-0 left-0 w-full h-full z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: `linear-gradient(${layers[1].tint}, ${layers[1].tint}), url('/images/trails/${layers[1].image}')`,
          opacity: activeLayer === 1 ? 1 : 0,
        }}
        data-testid="background-layer-1"
        aria-hidden="true"
      />

      {/* Weather Effects Layer */}
      {displayedCondition && (
        <WeatherEffectLayer
          condition={displayedCondition}
          onAutoDisable={handleEffectsAutoDisable}
        />
      )}

      {/* Night Overlay Layer - on top of weather effects to dim them (only when not previewing a day) */}
      {nightTint !== "transparent" && selectedDayIndex === null && (
        <div
          className="absolute top-0 left-0 w-full h-full z-[5] pointer-events-none transition-opacity duration-1000"
          style={{ backgroundColor: nightTint }}
          data-testid="night-overlay"
          aria-hidden="true"
        />
      )}

      {/* Auto-disable Toast Notification */}
      {showAutoDisableToast && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
            px-4 py-3 bg-surface/95 backdrop-blur-sm rounded-lg
            border border-amber-400/30 shadow-lg
            text-sm text-text-primary
            animate-in fade-in slide-in-from-bottom-4 duration-300"
          role="alert"
          aria-live="polite"
        >
          <span className="text-amber-400">Effects disabled</span> for better performance
        </div>
      )}

      {/* Content Layer - Full viewport, no scroll */}
      <div className="relative z-10 flex h-screen w-full flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Story Section - Top area */}
        <div className="px-10 mt-6 mb-8">
          <StoryCard />
        </div>

        {/* Info Boxes Row: Phase, Progress, Countdown */}
        <InfoBoxes />

        {/* Main content area - Two column grid layout */}
        <div className="flex gap-5 px-10 mt-5 pb-6 overflow-hidden">
          {/* Left Column: Weather + Suggested Runs (~65%) */}
          <div className="flex-[2] flex flex-col gap-8 overflow-y-auto">
            {/* Weather Section */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white/50 mb-4">
                Weather
              </h3>
              <WeatherForecast onDaySelect={handleDaySelect} selectedIndex={selectedDayIndex} />
            </div>

            {/* Suggested Runs Section */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white/50 mb-4">
                Suggested Runs
              </h3>
              <RunSuggestions isAuthenticated={isAuthenticated} />
            </div>
          </div>

          {/* Right Column: Calendar (~35%) */}
          <div className="flex-[1] overflow-y-auto">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/50 mb-4">
              Calendar
            </h3>
            <TrainingCalendar />
          </div>
        </div>
      </div>
    </main>
  );
}
