"use client";

export type HistogramBar = {
  label: string;
  value: number;
  secondary?: number;
  tone?: "default" | "alert" | "ok" | "gold" | "audit" | "passager";
};

function toneClass(tone: HistogramBar["tone"]) {
  if (tone === "alert") return "bg-brand";
  if (tone === "ok") return "bg-ok";
  if (tone === "gold" || tone === "audit") return "bg-audit";
  if (tone === "passager") return "bg-passager";
  return "bg-brand-light";
}

/** Histogramme CSS (sans librairie), alimenté par des totaux numériques. */
export function HistogramChart({
  bars,
  emptyLabel = "Aucune donnée.",
  valueLabel = "Total",
  secondaryLabel,
  maxBars = 8,
}: {
  bars: HistogramBar[];
  emptyLabel?: string;
  valueLabel?: string;
  secondaryLabel?: string;
  maxBars?: number;
}) {
  const data = bars
    .filter((b) => b.value > 0 || (b.secondary ?? 0) > 0)
    .slice(0, maxBars);
  const max = Math.max(
    1,
    ...data.map((b) => Math.max(b.value, b.secondary ?? 0))
  );

  if (data.length === 0) {
    return <p className="px-5 py-10 text-sm text-mute">{emptyLabel}</p>;
  }

  return (
    <div className="px-3 py-3 sm:px-4 sm:py-4">
      <div className="mb-2.5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-line/60 bg-surface/50 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.1em] text-mute">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-sm ${
              data[0]?.tone === "passager"
                ? "bg-passager"
                : data[0]?.tone === "ok"
                  ? "bg-ok"
                  : "bg-audit"
            }`}
          />
          {valueLabel}
        </span>
        {secondaryLabel ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line/60 bg-surface/50 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.1em] text-mute">
            <span className="inline-block h-1.5 w-1.5 rounded-sm bg-brand" />
            {secondaryLabel}
          </span>
        ) : null}
      </div>
      <div className="flex h-36 items-end gap-1.5 sm:gap-2">
        {data.map((bar) => {
          const h = Math.max(4, Math.round((bar.value / max) * 100));
          const h2 =
            bar.secondary != null
              ? Math.max(0, Math.round((bar.secondary / max) * 100))
              : null;
          return (
            <div
              key={bar.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              title={`${bar.label}: ${bar.value}${
                bar.secondary != null ? ` · anomalies ${bar.secondary}` : ""
              }`}
            >
              <div className="flex h-28 w-full items-end justify-center gap-0.5">
                <div
                  className={`w-full max-w-[1.25rem] rounded-t ${toneClass(
                    bar.tone
                  )} transition-[height] duration-500`}
                  style={{ height: `${h}%` }}
                />
                {h2 != null ? (
                  <div
                    className="w-full max-w-[1.25rem] rounded-t bg-brand/80 transition-[height] duration-500"
                    style={{ height: `${Math.max(h2, h2 > 0 ? 4 : 0)}%` }}
                  />
                ) : null}
              </div>
              <p className="w-full truncate text-center text-[0.55rem] uppercase tracking-[0.06em] text-mute">
                {bar.label}
              </p>
              <p className="font-display text-[0.65rem] tabular-nums text-mist">
                {bar.value}
                {bar.secondary != null ? (
                  <span className="text-brand-light">/{bar.secondary}</span>
                ) : null}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
