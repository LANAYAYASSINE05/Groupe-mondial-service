"use client";

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between font-display text-[0.68rem] uppercase tracking-label">
        <span className="text-mute">Progression checklist</span>
        <span className="tabular-nums text-gold">{pct}%</span>
      </div>
      <div className="h-1 w-full bg-surface2">
        <div
          className="h-full bg-brand-metal transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
