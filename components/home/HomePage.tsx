"use client";

import { useState, useCallback } from "react";
import { getTrailImage, getTintColor } from "@/components/trail";
import { CurrentWeather, WeatherForecast } from "@/components/weather";

/** Selected day data for background coordination */
interface SelectedDay {
  condition: string;
  datetime: Date;
}

/**
 * HomePage component that coordinates the weather-reactive background
 * with the weather display components.
 * Background changes based on the selected forecast day.
 */
export function HomePage() {
  // Track selected day from forecast for background
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);

  // Memoize callback to prevent unnecessary re-renders
  const handleDaySelect = useCallback((day: SelectedDay) => {
    setSelectedDay(day);
  }, []);

  // Use selected day's condition for background, or default if not loaded
  const condition = selectedDay?.condition ?? "default";

  // Get the trail image and tint for the current condition
  const trailImage = getTrailImage(condition);
  const tintColor = getTintColor(condition);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(${tintColor}, ${tintColor}), url('/images/trails/${trailImage}')`,
      }}
      data-testid="trail-background"
    >
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
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
      </div>
    </main>
  );
}
