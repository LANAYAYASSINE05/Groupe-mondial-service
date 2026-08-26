export function KpiTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "alert" | "ok" | "audit" | "passager";
}) {
  const valueClass =
    tone === "alert"
      ? "text-brand-light"
      : tone === "ok"
        ? "text-ok"
        : tone === "audit"
          ? "text-audit"
          : tone === "passager"
            ? "text-passager"
            : "text-mist";

  const barClass =
    tone === "passager"
      ? "border-l-passager"
      : tone === "audit"
        ? "border-l-audit"
        : "border-l-brand";

  return (
    <div className={`border border-line/80 border-l-2 ${barClass} bg-surface/60 px-3 py-3 sm:px-4 sm:py-3.5`}>
      <p className="font-display text-[0.58rem] uppercase tracking-[0.14em] text-mute">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight ${valueClass}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[0.65rem] text-mute">{hint}</p>}
    </div>
  );
}

export function DashPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <h2 className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-gold">
          {title}
        </h2>
        {action}
      </div>
      <div className="p-0">{children}</div>
    </section>
  );
}

export function DashTable({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-surface/50">
            {columns.map((c) => (
              <th
                key={c}
                className="px-4 py-3 font-display text-[0.62rem] font-medium uppercase tracking-[0.14em] text-mute"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
