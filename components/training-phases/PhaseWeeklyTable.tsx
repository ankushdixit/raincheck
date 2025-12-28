/**
 * Phase Weekly Table Component
 *
 * Renders a dynamic table with phase-specific columns.
 * Columns are determined by the phase's tableColumns configuration.
 */

"use client";

import type { TableColumnKey } from "@/server/api/routers/stats";
import { COLUMN_DEFINITIONS, getColumnsForPhase, type WeekData } from "./PhaseTableColumns";

interface PhaseWeeklyTableProps {
  weeks: WeekData[];
  columns: TableColumnKey[];
  phaseColor: string;
}

/** Get highlight color class for current week based on phase */
function getCurrentWeekHighlight(color: string): string {
  const highlights: Record<string, string> = {
    emerald: "bg-emerald-500/10",
    blue: "bg-blue-500/10",
    amber: "bg-amber-500/10",
    purple: "bg-purple-500/10",
  };
  return highlights[color] ?? "bg-blue-500/10";
}

export function PhaseWeeklyTable({ weeks, columns, phaseColor }: PhaseWeeklyTableProps) {
  // Filter columns that have data (hide empty columns)
  const visibleColumns = getColumnsForPhase(columns, weeks, true);
  const currentWeekHighlight = getCurrentWeekHighlight(phaseColor);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/60">
            {visibleColumns.map((colKey) => {
              const colDef = COLUMN_DEFINITIONS[colKey];
              return (
                <th key={colKey} className="pb-3 font-medium">
                  {colDef.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, index) => {
            const prevWeek = index > 0 ? weeks[index - 1] : undefined;
            const isCurrentWeek = week.status === "current";

            return (
              <tr
                key={week.weekNumber}
                className={`border-b border-white/5 ${isCurrentWeek ? currentWeekHighlight : ""}`}
              >
                {visibleColumns.map((colKey) => {
                  const colDef = COLUMN_DEFINITIONS[colKey];
                  return (
                    <td key={colKey} className="py-3">
                      {colDef.render(week, prevWeek)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
