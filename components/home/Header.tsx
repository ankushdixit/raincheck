"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Sparkles, EyeOff, LogOut, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { useIsAuthenticated, useEffectsPreference } from "@/hooks";

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
 * Uses useEffect to avoid hydration mismatch (server/client time difference)
 */
function LiveClock() {
  const [time, setTime] = useState<{ hours: string; minutes: string } | null>(null);
  const [colonVisible, setColonVisible] = useState(true);

  useEffect(() => {
    // Set initial time on client only to avoid hydration mismatch
    setTime(getTimeParts());

    const interval = setInterval(() => {
      setTime(getTimeParts());
      setColonVisible((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Show placeholder during SSR to avoid hydration mismatch
  if (!time) {
    return (
      <span className="text-2xl font-medium text-white font-mono">
        --<span className="opacity-100">:</span>--
      </span>
    );
  }

  return (
    <span className="text-xl sm:text-2xl font-medium text-white font-mono">
      {time.hours}
      <span className={colonVisible ? "opacity-100" : "opacity-0"}>:</span>
      {time.minutes}
    </span>
  );
}

/**
 * Extract just city name from full location string
 * e.g., "Dublin, Leinster, Ireland" -> "Dublin"
 */
function getCityName(location: string): string {
  return location.split(",")[0].trim();
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
      {/* Location - city only on mobile, full on larger screens */}
      <span className="text-xs text-white/70">
        <span className="sm:hidden">{getCityName(weather.location)}</span>
        <span className="hidden sm:inline">{weather.location}</span>
      </span>

      {/* Time */}
      <LiveClock />

      {/* Weather stats - compact on mobile */}
      <span className="text-xs sm:text-sm text-white whitespace-nowrap">
        {Math.round(weather.temperature)}&deg;
        <span className="hidden sm:inline">C</span>
        {" | "}
        {Math.round(weather.precipitation)}%{" | "}
        {Math.round(weather.windSpeed)}
        <span className="hidden sm:inline"> km/h</span>
        <span className="sm:hidden">k</span>
      </span>
    </div>
  );
}

/**
 * Header action button component for consistent styling
 */
function ActionButton({
  onClick,
  label,
  isActive = false,
  children,
}: {
  onClick: () => void;
  label: string;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center
        w-9 h-9 rounded-lg
        transition-all duration-200
        hover:bg-white/25
        focus:outline-none focus:ring-2 focus:ring-amber-400/50
        cursor-pointer
        ${isActive ? "text-amber-400 bg-white/20" : "text-white bg-white/10"}
      `}
      aria-label={label}
      type="button"
    >
      {children}
    </button>
  );
}

/**
 * Header actions: Effects toggle (for all) + Logout (for authenticated users)
 */
function HeaderActions() {
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const { effectsEnabled, toggleEffects, isLoaded: effectsLoaded } = useEffectsPreference();

  // Don't render until preferences are loaded
  if (!effectsLoaded) {
    return <div className="w-9 h-9" />; // Placeholder to prevent layout shift
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex items-center gap-1" data-testid="header-actions">
      {/* Effects Toggle */}
      <ActionButton
        onClick={toggleEffects}
        label={effectsEnabled ? "Disable weather effects" : "Enable weather effects"}
        isActive={effectsEnabled}
      >
        {effectsEnabled ? (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        ) : (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        )}
      </ActionButton>

      {/* Settings & Logout - only for authenticated users */}
      {!authLoading && isAuthenticated && (
        <>
          <Link
            href="/settings"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-white bg-white/10 hover:bg-white/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Link>
          <ActionButton onClick={handleLogout} label="Sign out">
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </ActionButton>
        </>
      )}
    </div>
  );
}

/**
 * Header component with logo/tagline on the left and weather info on the right.
 * Part of the new grid-based layout for the homepage.
 */
export function Header() {
  return (
    <header
      className="flex items-start justify-between w-full px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-6"
      data-testid="header"
    >
      {/* Left: Logo lockup - negative margin compensates for SVG internal whitespace */}
      <Image
        src="/images/logo-lockup-1.svg"
        alt="RainCheck - Weather-aware Marathon Training"
        width={350}
        height={88}
        priority
        className="-ml-1 sm:-ml-2 lg:-ml-3.5 w-[260px] sm:w-[260px] md:w-[280px] lg:w-[350px] h-auto"
      />

      {/* Right: Actions + Weather info */}
      <div className="flex items-start gap-2 sm:gap-4">
        <HeaderActions />
        <WeatherInfo />
      </div>
    </header>
  );
}
