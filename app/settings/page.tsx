"use client";

/**
 * Settings Page
 *
 * Protected page for managing user settings and runs.
 * Requires authentication - redirects to login if not authenticated.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Trophy, Calendar, Trash2, Check, X, Edit2 } from "lucide-react";
import { api } from "@/lib/api";
import { useIsAuthenticated } from "@/hooks";
import { getTrailImage, getTintColor, getNightTint } from "@/components/trail";
import { WeatherEffectLayer } from "@/components/weather-effects";
import type { Run, RunType } from "@prisma/client";

/** Run type labels for display */
const RUN_TYPE_LABELS: Record<RunType, string> = {
  LONG_RUN: "Long Run",
  EASY_RUN: "Easy Run",
  TEMPO_RUN: "Tempo Run",
  INTERVAL_RUN: "Intervals",
  RECOVERY_RUN: "Recovery",
  RACE: "Race",
};

/** Section card wrapper */
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-forest-deep/50 backdrop-blur-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-amber-400">{icon}</span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/** Location Settings Section */
function LocationSettings() {
  const { data: settings, isLoading } = api.settings.get.useQuery();
  const utils = api.useUtils();

  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const updateMutation = api.settings.updateLocation.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      utils.weather.getCurrentWeather.invalidate();
      utils.weather.getForecast.invalidate();
      setIsEditing(false);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    if (settings?.defaultLocation) {
      setLocation(settings.defaultLocation);
    }
  }, [settings?.defaultLocation]);

  const handleSave = () => {
    if (!location.trim()) {
      setError("Location is required");
      return;
    }
    updateMutation.mutate({ location: location.trim() });
  };

  const handleCancel = () => {
    setLocation(settings?.defaultLocation ?? "");
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <Section title="Location" icon={<MapPin className="h-5 w-5" />}>
        <div className="h-10 w-48 rounded bg-white/10 animate-pulse" />
      </Section>
    );
  }

  return (
    <Section title="Location" icon={<MapPin className="h-5 w-5" />}>
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city name (e.g., Dublin, IE)"
            className="w-full bg-white/10 text-white placeholder:text-white/40 px-4 py-2.5 rounded-lg border-2 border-transparent focus:border-white/40 outline-none"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-white">{settings?.defaultLocation ?? "Not set"}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
      )}
    </Section>
  );
}

/** Race Settings Section */
function RaceSettings() {
  const { data: settings, isLoading } = api.settings.get.useQuery();
  const utils = api.useUtils();

  const [isEditing, setIsEditing] = useState(false);
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [targetTime, setTargetTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const updateMutation = api.settings.updateRace.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      setIsEditing(false);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    if (settings) {
      setRaceName(settings.raceName ?? "");
      setRaceDate(settings.raceDate ? new Date(settings.raceDate).toISOString().split("T")[0] : "");
      setTargetTime(settings.targetTime ?? "");
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      raceName: raceName.trim() || undefined,
      raceDate: raceDate ? new Date(raceDate) : undefined,
      targetTime: targetTime.trim() || undefined,
    });
  };

  const handleCancel = () => {
    if (settings) {
      setRaceName(settings.raceName ?? "");
      setRaceDate(settings.raceDate ? new Date(settings.raceDate).toISOString().split("T")[0] : "");
      setTargetTime(settings.targetTime ?? "");
    }
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Section title="Race" icon={<Trophy className="h-5 w-5" />}>
        <div className="space-y-3">
          <div className="h-6 w-64 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-48 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
        </div>
      </Section>
    );
  }

  return (
    <Section title="Race" icon={<Trophy className="h-5 w-5" />}>
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-1">Race Name</label>
            <input
              type="text"
              value={raceName}
              onChange={(e) => setRaceName(e.target.value)}
              placeholder="e.g., Dublin Half Marathon"
              className="w-full bg-white/10 text-white placeholder:text-white/40 px-4 py-2.5 rounded-lg border-2 border-transparent focus:border-white/40 outline-none"
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1">Race Date</label>
            <input
              type="date"
              value={raceDate}
              onChange={(e) => setRaceDate(e.target.value)}
              className="w-full bg-white/10 text-white px-4 py-2.5 rounded-lg border-2 border-transparent focus:border-white/40 outline-none [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1">Target Time (H:MM:SS)</label>
            <input
              type="text"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              placeholder="e.g., 2:00:00"
              className="w-full bg-white/10 text-white placeholder:text-white/40 px-4 py-2.5 rounded-lg border-2 border-transparent focus:border-white/40 outline-none"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-lg font-medium">{settings?.raceName ?? "Not set"}</p>
              {settings?.raceDate && (
                <p className="text-white/60 text-sm">{formatDate(settings.raceDate)}</p>
              )}
              {settings?.targetTime && (
                <p className="text-white/60 text-sm">Target: {settings.targetTime}</p>
              )}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

/** Runs Management Section */
function RunsManagement() {
  const { data: runs, isLoading } = api.runs.getAll.useQuery({});
  const utils = api.useUtils();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRun, setEditingRun] = useState<Run | null>(null);

  const deleteMutation = api.runs.delete.useMutation({
    onSuccess: () => {
      utils.runs.getAll.invalidate();
      utils.runs.getByDateRange.invalidate();
      setDeletingId(null);
    },
  });

  const toggleCompleteMutation = api.runs.markComplete.useMutation({
    onSuccess: () => {
      utils.runs.getAll.invalidate();
      utils.runs.getByDateRange.invalidate();
    },
  });

  const updateMutation = api.runs.update.useMutation({
    onSuccess: () => {
      utils.runs.getAll.invalidate();
      utils.runs.getByDateRange.invalidate();
      setEditingRun(null);
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleToggleComplete = (run: Run) => {
    toggleCompleteMutation.mutate({ id: run.id, completed: !run.completed });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Section title="Runs" icon={<Calendar className="h-5 w-5" />}>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/10 animate-pulse" />
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section title="Runs" icon={<Calendar className="h-5 w-5" />}>
      {!runs || runs.length === 0 ? (
        <p className="text-white/60">No runs scheduled yet.</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {runs.map((run) => (
            <div
              key={run.id}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 rounded-lg ${
                run.completed ? "bg-green-500/10" : "bg-white/5"
              }`}
            >
              {editingRun?.id === run.id ? (
                <EditRunForm
                  run={editingRun}
                  onSave={(data) => updateMutation.mutate({ id: run.id, data })}
                  onCancel={() => setEditingRun(null)}
                  isSaving={updateMutation.isPending}
                />
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{formatDate(run.date)}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          run.completed
                            ? "bg-green-500/30 text-green-300"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {run.completed ? "Completed" : "Scheduled"}
                      </span>
                    </div>
                    <div className="text-white/60 text-sm">
                      {RUN_TYPE_LABELS[run.type]} • {run.distance}km • {run.pace}/km
                    </div>
                    {run.notes && (
                      <div className="text-white/40 text-xs mt-1 truncate">{run.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleToggleComplete(run)}
                      disabled={toggleCompleteMutation.isPending}
                      className={`p-2 rounded-lg transition-colors ${
                        run.completed
                          ? "text-green-400 hover:bg-green-500/20"
                          : "text-white/50 hover:bg-white/10"
                      }`}
                      title={run.completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingRun(run)}
                      className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit run"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {deletingId === run.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(run.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Confirm delete"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="p-2 text-white/50 hover:bg-white/10 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(run.id)}
                        className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete run"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/** Edit Run Form */
function EditRunForm({
  run,
  onSave,
  onCancel,
  isSaving,
}: {
  run: Run;
  onSave: (_data: { distance?: number; pace?: string; notes?: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [distance, setDistance] = useState(run.distance.toString());
  const [pace, setPace] = useState(run.pace);
  const [notes, setNotes] = useState(run.notes ?? "");

  const handleSave = () => {
    onSave({
      distance: parseFloat(distance) || undefined,
      pace: pace || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="flex-1 space-y-2">
      <div className="flex gap-2">
        <input
          type="number"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          placeholder="Distance (km)"
          step="0.1"
          className="w-24 bg-white/10 text-white px-3 py-1.5 rounded text-sm border border-transparent focus:border-white/40 outline-none"
        />
        <input
          type="text"
          value={pace}
          onChange={(e) => setPace(e.target.value)}
          placeholder="Pace (M:SS)"
          className="w-24 bg-white/10 text-white px-3 py-1.5 rounded text-sm border border-transparent focus:border-white/40 outline-none"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          className="flex-1 bg-white/10 text-white px-3 py-1.5 rounded text-sm border border-transparent focus:border-white/40 outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1 px-3 py-1 bg-green-600/80 hover:bg-green-600 text-white rounded text-sm disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Main Settings Page */
export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();

  // Fetch current weather for dynamic background
  const { data: currentWeather } = api.weather.getCurrentWeather.useQuery({});

  // Background state
  const [backgroundImage, setBackgroundImage] = useState(getTrailImage("default"));
  const [backgroundTint, setBackgroundTint] = useState(getTintColor("default"));
  const [displayedCondition, setDisplayedCondition] = useState("");

  // Night overlay state - initialize with "transparent" to avoid hydration mismatch
  const [nightTint, setNightTint] = useState<string>("transparent");

  // Set initial night tint on client and update every minute
  useEffect(() => {
    const updateNightTint = () => setNightTint(getNightTint());
    updateNightTint(); // Set initial value on client
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <main className="relative min-h-screen w-full">
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(${getTintColor("default")}, ${getTintColor("default")}), url('/images/trails/${getTrailImage("default")}')`,
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        </div>
      </main>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="relative min-h-screen w-full">
      {/* Dynamic Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `linear-gradient(${backgroundTint}, ${backgroundTint}), url('/images/trails/${backgroundImage}')`,
        }}
        aria-hidden="true"
      />

      {/* Weather Effects Layer */}
      {displayedCondition && <WeatherEffectLayer condition={displayedCondition} />}

      {/* Night Overlay */}
      {nightTint !== "transparent" && (
        <div
          className="fixed inset-0 z-[5] pointer-events-none transition-opacity duration-1000"
          style={{ backgroundColor: nightTint }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4 lg:py-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <Image
            src="/images/logo-lockup-1.svg"
            alt="RainCheck"
            width={200}
            height={50}
            priority
            className="w-[120px] sm:w-[160px] lg:w-[200px] h-auto"
          />
        </header>

        {/* Page Title */}
        <div className="px-4 sm:px-6 lg:px-10 mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/60 mt-1 text-sm lg:text-base">
            Manage your training configuration and runs
          </p>
        </div>

        {/* Settings Sections */}
        <div className="px-4 sm:px-6 lg:px-10 pb-10 space-y-6 max-w-4xl">
          <LocationSettings />
          <RaceSettings />
          <RunsManagement />
        </div>
      </div>
    </main>
  );
}
