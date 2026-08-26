"use client";

export function CountUp({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-b border-gold-soft py-5 pr-4">
      <p className="gms-eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl tabular-nums tracking-tight text-mist">
        {value}
      </p>
    </div>
  );
}
