"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { WeeklyMileageChart, StatsSummaryCard, CompletionRateCard } from "@/components/stats";

/**
 * Stats Dashboard Page
 *
 * Displays all training analytics in a comprehensive dashboard layout.
 * Components are arranged in a responsive grid.
 */
export default function StatsPage() {
  return (
    <main className="min-h-screen bg-[#0a0f0a]">
      {/* Header with navigation */}
      <header className="sticky top-0 z-10 bg-[#0a0f0a]/95 backdrop-blur-sm border-b border-[#2a4a2a]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2 text-amber-400">
              <BarChart3 className="h-6 w-6" />
              <h1 className="text-xl font-bold text-[#f5f5f5]">Training Stats</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:gap-8">
          {/* Summary Cards Row */}
          <section>
            <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">Summary</h2>
            <StatsSummaryCard />
          </section>

          {/* Charts Row - Summary Cards + Completion Rate on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Weekly Mileage Chart - takes 2 columns on desktop */}
            <section className="md:col-span-2">
              <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">Weekly Mileage</h2>
              <div className="bg-[#1a2e1a]/80 border border-[#2a4a2a] backdrop-blur-sm rounded-lg p-4">
                <WeeklyMileageChart />
              </div>
            </section>

            {/* Completion Rate - single column */}
            <section>
              <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">Completion</h2>
              <CompletionRateCard />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
