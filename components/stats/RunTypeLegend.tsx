"use client";

/**
 * Run Type Legend
 *
 * Shows color legend for different run types.
 */

const RUN_TYPES = [
  { name: "Easy Run", color: "bg-green-500" },
  { name: "Long Run", color: "bg-purple-500" },
  { name: "Tempo", color: "bg-orange-500" },
  { name: "Interval", color: "bg-blue-500" },
  { name: "Recovery", color: "bg-white/40" },
];

export function RunTypeLegend() {
  return (
    <div className="flex items-center gap-4">
      {RUN_TYPES.map((type) => (
        <div key={type.name} className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${type.color}`} />
          <span className="text-white/60 text-[10px]">{type.name}</span>
        </div>
      ))}
    </div>
  );
}
