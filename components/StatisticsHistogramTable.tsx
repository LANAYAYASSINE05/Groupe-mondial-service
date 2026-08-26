"use client";

export type StatRow = {
  category: string;
  label: string;
  total: number;
  anomalies?: number;
  tone?: "default" | "alert" | "ok" | "gold";
};

function barTone(tone: StatRow["tone"]) {
  if (tone === "alert") return "bg-brand";
  if (tone === "ok") return "bg-ok";
  if (tone === "gold") return "bg-gold";
  return "bg-brand-light";
}

/** Histogramme consolidé unique — toutes les stats des rapports en un graphique. */
export function ConsolidatedStatisticsHistogram({
  rows,
  emptyLabel = "Aucune donnée disponible.",
}: {
  rows: StatRow[];
  emptyLabel?: string;
}) {
  const data = rows.filter((r) => r.total > 0 || (r.anomalies ?? 0) > 0);
  const max = Math.max(
    1,
    ...data.map((r) => Math.max(r.total, r.anomalies ?? 0))
  );

  if (data.length === 0) {
    return <p className="px-5 py-10 text-sm text-mute">{emptyLabel}</p>;
  }

  const groups = data.reduce<Record<string, StatRow[]>>((acc, row) => {
    if (!acc[row.category]) acc[row.category] = [];
    acc[row.category].push(row);
    return acc;
  }, {});

  const categoryOrder = [
    "Type",
    "Conformité",
    "Mois",
    "Établissement",
    "Contrôleur",
  ];
  const orderedGroups = categoryOrder
    .filter((c) => groups[c]?.length)
    .map((c) => ({ category: c, rows: groups[c] }));

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-[0.65rem] uppercase tracking-[0.12em] text-mute">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-light" />
            Contrôles
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand" />
            Anomalies
          </span>
        </div>
        <p className="text-xs text-mute">
          {data.length} indicateur{data.length > 1 ? "s" : ""} · max {max}
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-end gap-6 sm:gap-8">
          {orderedGroups.map(({ category, rows: groupRows }) => (
            <div
              key={category}
              className="flex shrink-0 flex-col border-l border-line/60 pl-4 first:border-l-0 first:pl-0"
            >
              <p className="mb-3 font-display text-[0.62rem] uppercase tracking-[0.14em] text-gold">
                {category}
              </p>
              <div className="flex items-end gap-2 sm:gap-3">
                {groupRows.map((row) => {
                  const h = Math.max(4, Math.round((row.total / max) * 100));
                  const hAnomaly =
                    row.anomalies != null
                      ? Math.max(
                          row.anomalies > 0 ? 4 : 0,
                          Math.round((row.anomalies / max) * 100)
                        )
                      : null;

                  return (
                    <div
                      key={`${category}-${row.label}`}
                      className="flex w-[3.25rem] flex-col items-center gap-2 sm:w-[3.75rem]"
                      title={`${row.label} — ${row.total} contrôle(s)${
                        row.anomalies != null
                          ? `, ${row.anomalies} anomalie(s)`
                          : ""
                      }`}
                    >
                      <div className="flex h-52 w-full items-end justify-center gap-0.5">
                        <div
                          className={`w-full max-w-[1.35rem] rounded-t-sm ${barTone(
                            row.tone
                          )} transition-[height] duration-500`}
                          style={{ height: `${h}%` }}
                        />
                        {hAnomaly != null ? (
                          <div
                            className="w-full max-w-[1.35rem] rounded-t-sm bg-brand/85 transition-[height] duration-500"
                            style={{ height: `${hAnomaly}%` }}
                          />
                        ) : null}
                      </div>
                      <p className="line-clamp-2 min-h-[2rem] w-full text-center font-display text-[0.58rem] uppercase leading-tight tracking-[0.06em] text-mute">
                        {row.label}
                      </p>
                      <p className="font-display text-xs tabular-nums text-mist">
                        {row.total}
                        {row.anomalies != null && row.anomalies > 0 ? (
                          <span className="text-brand-light">
                            /{row.anomalies}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** @deprecated Utiliser ConsolidatedStatisticsHistogram */
export const StatisticsHistogramTable = ConsolidatedStatisticsHistogram;
