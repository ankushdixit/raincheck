"use client";

import { useState, useCallback, useRef } from "react";
import { getTrailImage, getTintColor } from "@/components/trail";
import { CurrentWeather, WeatherForecast } from "@/components/weather";
import { RunSuggestions } from "@/components/suggestions";
import { useIsAuthenticated } from "@/hooks";

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

/**
 * HomePage component that coordinates the weather-reactive background
 * with the weather display components.
 * Background changes based on the selected forecast day with smooth cross-fade.
 */
export function HomePage() {
  // Get authentication state
  const { isAuthenticated } = useIsAuthenticated();

  // Default background configuration
  const defaultImage = getTrailImage("default");
  const defaultTint = getTintColor("default");

  // Two background layers for cross-fade effect
  const [layers, setLayers] = useState<[BackgroundLayer, BackgroundLayer]>([
    { image: defaultImage, tint: defaultTint },
    { image: defaultImage, tint: defaultTint },
  ]);

  // Track which layer is currently visible (0 or 1)
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);

  // Use ref to track active layer in callback without causing re-renders
  const activeLayerRef = useRef<0 | 1>(0);

  // Memoize callback that handles day selection and background transition
  const handleDaySelect = useCallback((day: SelectedDay) => {
    const condition = day.condition;
    const newImage = getTrailImage(condition);
    const newTint = getTintColor(condition);

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

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center"
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

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-[4rem]">
          RainCheck
        </h1>
        <p className="mt-4 text-lg text-text-primary/80 sm:text-xl">
          Weather-aware half-marathon training
        </p>

        <div className="mt-8">
          <CurrentWeather />
        </div>

        <div className="mt-8 w-full max-w-4xl">
          <WeatherForecast onDaySelect={handleDaySelect} />
        </div>

        {/* Run Suggestions Section */}
        <div className="mt-12 w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Suggested Runs</h2>
          <RunSuggestions isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </main>
  );
}
