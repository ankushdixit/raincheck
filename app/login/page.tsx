"use client";

/**
 * Login Page
 *
 * Immersive password authentication page with weather-reactive background.
 * Matches the homepage's visual design with dynamic trail images,
 * weather effects, and time-aware night overlay.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { LoginForm } from "@/components/auth";
import { getTrailImage, getTintColor, getNightTint } from "@/components/trail";
import { WeatherEffectLayer } from "@/components/weather-effects";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  // Fetch current weather for dynamic background
  const { data: currentWeather } = api.weather.getCurrentWeather.useQuery(
    {},
    { enabled: status !== "authenticated" }
  );

  // Background state
  const [backgroundImage, setBackgroundImage] = useState(getTrailImage("default"));
  const [backgroundTint, setBackgroundTint] = useState(getTintColor("default"));
  const [displayedCondition, setDisplayedCondition] = useState("");

  // Night overlay state (updates every minute)
  const [nightTint, setNightTint] = useState<string>(getNightTint());

  // Update night overlay every minute
  useEffect(() => {
    const updateNightTint = () => setNightTint(getNightTint());
    const interval = setInterval(updateNightTint, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update background when weather loads
  useEffect(() => {
    if (currentWeather) {
      const condition = currentWeather.condition;
      setBackgroundImage(getTrailImage(condition));
      setBackgroundTint(getTintColor(condition));
      setDisplayedCondition(condition);
    }
  }, [currentWeather]);

  // Redirect authenticated users to homepage
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <main className="relative h-screen w-screen overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(${getTintColor("default")}, ${getTintColor("default")}), url('/images/trails/${getTrailImage("default")}')`,
          }}
          aria-hidden="true"
        />
        {/* Loading indicator */}
        <div className="relative z-10 flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        </div>
      </main>
    );
  }

  // Don't render login form if authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Dynamic Background Layer */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `linear-gradient(${backgroundTint}, ${backgroundTint}), url('/images/trails/${backgroundImage}')`,
        }}
        aria-hidden="true"
      />

      {/* Weather Effects Layer */}
      {displayedCondition && <WeatherEffectLayer condition={displayedCondition} />}

      {/* Night Overlay Layer */}
      {nightTint !== "transparent" && (
        <div
          className="absolute inset-0 z-[5] pointer-events-none transition-opacity duration-1000"
          style={{ backgroundColor: nightTint }}
          aria-hidden="true"
        />
      )}

      {/* Content Layer */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Header with Logo */}
        <header className="px-10 py-6">
          <Image
            src="/images/logo-lockup-1.svg"
            alt="RainCheck - Weather-aware Marathon Training"
            width={280}
            height={70}
            priority
            className="-ml-3"
          />
        </header>

        {/* Centered Login Card */}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-xl bg-forest-deep/50 backdrop-blur-md p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
              <p className="text-white/60 mt-1">Sign in to manage your training</p>
            </div>

            <LoginForm />
          </div>
        </div>

        {/* Footer spacer for visual balance */}
        <div className="h-20" />
      </div>
    </main>
  );
}
