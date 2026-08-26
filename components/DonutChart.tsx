"use client";

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

export function DonutChart({
  slices,
  centerValue,
  centerLabel,
  emptyLabel = "Aucune donnée.",
  size = 132,
}: {
  slices: DonutSlice[];
  centerValue?: string;
  centerLabel?: string;
  emptyLabel?: string;
  size?: number;
}) {
  const data = slices.filter((s) => s.value > 0);
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  if (total <= 0 || data.length === 0) {
    return <p className="px-5 py-10 text-sm text-mute">{emptyLabel}</p>;
  }

  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const arcs = data.map((slice) => {
    const len = (slice.value / total) * circ;
    const dashoffset = circ * 0.25 - offset;
    offset += len;
    return { ...slice, len, dashoffset };
  });

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={slices
            .map((s) => `${s.label}: ${s.value}`)
            .join(", ")}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#eeeeee"
            strokeWidth={stroke}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.len} ${circ - arc.len}`}
              strokeDashoffset={arc.dashoffset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue ? (
            <p className="font-display text-xl font-semibold tabular-nums text-mist">
              {centerValue}
            </p>
          ) : null}
          {centerLabel ? (
            <p className="max-w-[4.5rem] font-display text-[0.55rem] uppercase leading-tight tracking-[0.1em] text-mute">
              {centerLabel}
            </p>
          ) : null}
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-2 sm:w-auto">
        {slices.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <li key={s.label} className="flex items-center justify-between gap-4 text-sm">
              <span className="inline-flex items-center gap-2 text-mist">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: s.color }}
                  aria-hidden
                />
                {s.label}
              </span>
              <span className="font-display tabular-nums text-mute">
                {s.value}
                <span className="ml-1 text-[0.7rem]">({pct} %)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
