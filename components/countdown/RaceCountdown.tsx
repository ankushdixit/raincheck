"use client";

import { api } from "@/lib/api";
import { TrainingProgress } from "./TrainingProgress";
import { PhaseBadge } from "./PhaseBadge";
import { WeatherIcon } from "@/components/weather";

/** Maximum days ahead for which weather forecast is available */
const WEATHER_FORECAST_RANGE = 10;

/** Race week threshold in days */
const RACE_WEEK_THRESHOLD = 7;

/**
 * Calculate the number of days between two dates.
 * Normalizes both dates to midnight to avoid time-based edge cases.
 */
export function calculateDaysUntil(targetDate: Date, fromDate: Date = new Date()): number {
  // Normalize both dates to midnight (start of day)
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - from.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format a date for display (e.g., "May 17, 2026")
 */
export function formatRaceDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Check if we're in race week (≤7 days until race)
 */
export function isRaceWeek(daysUntil: number): boolean {
  return daysUntil >= 0 && daysUntil <= RACE_WEEK_THRESHOLD;
}

/**
 * Check if race day weather should be fetched (≤10 days until race)
 */
export function shouldShowRaceWeather(daysUntil: number): boolean {
  return daysUntil >= 0 && daysUntil <= WEATHER_FORECAST_RANGE;
}

/**
 * Get taper reminder message for race week
 */
export function getTaperReminder(daysUntil: number): string | null {
  if (daysUntil < 0) return null;
  if (daysUntil === 0) return "Race day! Trust your training!";
  if (daysUntil === 1) return "Rest up! Tomorrow is the big day!";
  if (daysUntil <= 3) return "Light runs only. Stay fresh!";
  if (daysUntil <= RACE_WEEK_THRESHOLD) return "Taper time! Rest and recover.";
  return null;
}

/**
 * Race Week Banner - displays prominently when race is ≤7 days away
 */
function RaceWeekBanner() {
  return (
    <div
      className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 mb-4"
      data-testid="race-week-banner"
    >
      <p className="text-center text-lg font-bold text-white tracking-wider animate-pulse">
        RACE WEEK!
      </p>
    </div>
  );
}

/**
 * Race Day Weather - displays predicted weather for race day
 */
interface RaceDayWeatherProps {
  condition: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
}

function RaceDayWeather({ condition, temperature, precipitation, windSpeed }: RaceDayWeatherProps) {
  return (
    <div className="w-full rounded-lg bg-forest-deep/50 p-3 mt-3" data-testid="race-day-weather">
      <p className="text-xs text-text-primary/60 mb-2 text-center">Race Day Forecast</p>
      <div className="flex items-center justify-center gap-3">
        <WeatherIcon condition={condition} className="text-2xl" />
        <div className="text-sm text-text-primary">
          <p data-testid="race-weather-temp">{Math.round(temperature)}°C</p>
          <p className="text-xs text-text-primary/60" data-testid="race-weather-details">
            {precipitation}% rain • {Math.round(windSpeed)} km/h wind
          </p>
        </div>
      </div>
      <p
        className="text-xs text-center text-text-primary/50 mt-1"
        data-testid="race-weather-condition"
      >
        {condition}
      </p>
    </div>
  );
}

/**
 * Taper Reminder - displays during race week
 */
function TaperReminder({ message }: { message: string }) {
  return (
    <p className="text-xs text-amber-400 mt-2 italic text-center" data-testid="taper-reminder">
      {message}
    </p>
  );
}

/**
 * Loading skeleton that matches the countdown card layout
 */
function CountdownSkeleton() {
  return (
    <div className="w-full max-w-sm rounded-xl bg-forest-dark p-6" data-testid="countdown-skeleton">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        {/* Days number placeholder */}
        <div className="h-16 w-24 rounded bg-forest-deep/50" />
        {/* "days until race day" placeholder */}
        <div className="h-6 w-40 rounded bg-forest-deep/50" />
        {/* Race name placeholder */}
        <div className="h-5 w-64 rounded bg-forest-deep/50" />
        {/* Race date placeholder */}
        <div className="h-4 w-32 rounded bg-forest-deep/50" />
        {/* Progress bar placeholder */}
        <div className="w-full mt-4 pt-4 border-t border-amber-600/30">
          <div className="h-4 w-24 rounded bg-forest-deep/50 mb-2" />
          <div className="h-2 w-full rounded-full bg-forest-deep/50" />
        </div>
      </div>
    </div>
  );
}

/**
 * Error state with retry button
 */
function CountdownError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="w-full max-w-sm rounded-xl bg-forest-dark p-6" data-testid="countdown-error">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-5xl" role="img" aria-label="Warning">
          &#x26A0;&#xFE0F;
        </span>
        <p className="text-text-primary/80">Unable to load race info</p>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="retry-button"
        >
          {isRetrying ? "Retrying..." : "Retry"}
        </button>
      </div>
    </div>
  );
}

/**
 * RaceCountdown component
 *
 * Displays a prominent countdown showing days until race day,
 * along with the race name and date. Uses amber accents for
 * visual emphasis matching the design system.
 *
 * Enhanced features:
 * - Race Week banner when ≤7 days away
 * - Race day weather forecast when ≤10 days away
 * - Taper reminders during race week
 */
export function RaceCountdown() {
  const { data: settings, isLoading, isError, refetch, isFetching } = api.settings.get.useQuery();

  // Calculate days until race for conditional weather fetching
  const raceDate = settings ? new Date(settings.raceDate) : null;
  const daysUntil = raceDate ? calculateDaysUntil(raceDate) : null;
  const shouldFetchWeather = daysUntil !== null && shouldShowRaceWeather(daysUntil);

  // Fetch race day weather when within forecast range
  const { data: raceDayWeather } = api.weather.getForecast.useQuery(
    {
      location: settings?.defaultLocation,
      days: daysUntil !== null ? daysUntil + 1 : 1, // Fetch enough days to include race day
    },
    {
      enabled: shouldFetchWeather && !!settings,
    }
  );

  // Find the race day forecast from the weather data
  const raceDayForecast = raceDayWeather?.find((day) => {
    if (!raceDate) return false;
    const forecastDate = new Date(day.datetime);
    forecastDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(raceDate);
    targetDate.setHours(0, 0, 0, 0);
    return forecastDate.getTime() === targetDate.getTime();
  });

  // Show skeleton during initial load
  if (isLoading) {
    return <CountdownSkeleton />;
  }

  // Show error state with retry
  if (isError || !settings) {
    return <CountdownError onRetry={() => refetch()} isRetrying={isFetching} />;
  }

  const formattedDate = formatRaceDate(raceDate!);
  const showRaceWeekBanner = daysUntil !== null && isRaceWeek(daysUntil);
  const taperMessage = daysUntil !== null ? getTaperReminder(daysUntil) : null;

  // Handle race day and past race scenarios
  const getDaysLabel = () => {
    if (daysUntil === 0) return "Race Day!";
    if (daysUntil === 1) return "day until race day";
    if (daysUntil !== null && daysUntil < 0) return "days since race day";
    return "days until race day";
  };

  const displayDays = daysUntil !== null ? Math.abs(daysUntil) : 0;

  return (
    <div
      className="w-full max-w-sm rounded-xl bg-forest-dark p-6 border border-amber-600/30"
      data-testid="countdown-card"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Race Week Banner */}
        {showRaceWeekBanner && <RaceWeekBanner />}

        {/* Days countdown number with subtle glow animation */}
        <p
          className="text-6xl sm:text-7xl font-bold text-amber-500 animate-pulse [animation-duration:3s]"
          data-testid="countdown-days"
        >
          {daysUntil === 0 ? "🏃" : displayDays}
        </p>

        {/* "days until race day" label */}
        <p className="text-lg text-text-primary/80" data-testid="countdown-label">
          {getDaysLabel()}
        </p>

        {/* Taper Reminder */}
        {taperMessage && <TaperReminder message={taperMessage} />}

        {/* Divider */}
        <div className="w-16 h-px bg-amber-600/50 my-2" />

        {/* Race name */}
        <p className="text-sm sm:text-base font-medium text-text-primary" data-testid="race-name">
          {settings.raceName}
        </p>

        {/* Race date */}
        <p className="text-sm text-text-primary/60" data-testid="race-date">
          {formattedDate}
        </p>

        {/* Target time */}
        {settings.targetTime && (
          <p className="text-xs text-amber-500/80 mt-1" data-testid="target-time">
            Target: {settings.targetTime}
          </p>
        )}

        {/* Race Day Weather Forecast */}
        {raceDayForecast && (
          <RaceDayWeather
            condition={raceDayForecast.condition}
            temperature={raceDayForecast.temperature}
            precipitation={raceDayForecast.precipitation}
            windSpeed={raceDayForecast.windSpeed}
          />
        )}

        {/* Current Phase Badge */}
        <div className="mt-3" data-testid="phase-badge-container">
          <PhaseBadge />
        </div>

        {/* Training Progress Bar */}
        <div className="w-full mt-4 pt-4 border-t border-amber-600/30">
          <TrainingProgress />
        </div>
      </div>
    </div>
  );
}
