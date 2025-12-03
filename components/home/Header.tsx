"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { api } from "@/lib/api";

/**
 * Get current time parts (hours and minutes)
 */
function getTimeParts(): { hours: string; minutes: string } {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return { hours, minutes };
}

/**
 * Skeleton loader for the weather info section
 */
function WeatherInfoSkeleton() {
  return (
    <div
      className="flex flex-col items-end gap-1 animate-pulse"
      data-testid="header-weather-skeleton"
    >
      <div className="h-4 w-32 rounded bg-white/10" />
      <div className="h-6 w-16 rounded bg-white/10" />
      <div className="h-4 w-28 rounded bg-white/10" />
    </div>
  );
}

/**
 * Live clock component with blinking colon
 */
function LiveClock() {
  const [time, setTime] = useState(getTimeParts);
  const [colonVisible, setColonVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeParts());
      setColonVisible((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-2xl font-medium text-white font-mono">
      {time.hours}
      <span className={colonVisible ? "opacity-100" : "opacity-0"}>:</span>
      {time.minutes}
    </span>
  );
}

/**
 * Compact weather display for the header
 */
function WeatherInfo() {
  const { data: weather, isLoading, isError } = api.weather.getCurrentWeather.useQuery({});

  if (isLoading) {
    return <WeatherInfoSkeleton />;
  }

  if (isError || !weather) {
    return (
      <div
        className="flex flex-col items-end gap-1 text-white/60"
        data-testid="header-weather-error"
      >
        <span className="text-sm">Weather unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5" data-testid="header-weather-info">
      {/* Location */}
      <span className="text-xs text-white/70">{weather.location}</span>

      {/* Time */}
      <LiveClock />

      {/* Weather stats: temp | precipitation | wind */}
      <span className="text-sm text-white">
        {Math.round(weather.temperature)}&deg;C{"  |  "}
        {Math.round(weather.precipitation)}%{"  |  "}
        {Math.round(weather.windSpeed)} km/h
      </span>
    </div>
  );
}

/**
 * Header component with logo/tagline on the left and weather info on the right.
 * Part of the new grid-based layout for the homepage.
 */
export function Header() {
  return (
    <header className="flex items-start justify-between w-full px-10 py-6" data-testid="header">
      {/* Left: Logo lockup - negative margin compensates for SVG internal whitespace */}
      <Image
        src="/images/logo-lockup-1.svg"
        alt="RainCheck - Weather-aware Marathon Training"
        width={350}
        height={88}
        priority
        className="-ml-3.5"
      />

      {/* Right: Weather info */}
      <WeatherInfo />
    </header>
  );
}
