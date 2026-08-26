import Link from "next/link";
import type { ReactNode } from "react";
import { FormTypeBadge } from "@/components/FormTypeBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, type Control } from "@/lib/api-client";

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
    <div
      className={`border border-line/80 border-l-2 ${barClass} bg-surface/60 px-3 py-3 sm:px-4 sm:py-3.5`}
    >
      <p className="font-display text-[0.58rem] uppercase tracking-[0.14em] text-mute">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${valueClass}`}
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
    <section className="min-w-0 overflow-hidden border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
        <h2 className="min-w-0 font-display text-[0.62rem] uppercase tracking-[0.16em] text-gold sm:text-[0.68rem]">
          {title}
        </h2>
        {action ? <div className="min-w-0 shrink-0">{action}</div> : null}
      </div>
      <div className="p-0">{children}</div>
    </section>
  );
}

export function DashTable({
  columns,
  children,
  minWidth = "36rem",
  stacked,
}: {
  columns: string[];
  children: React.ReactNode;
  minWidth?: string;
  stacked?: ReactNode;
}) {
  return (
    <>
      {stacked ? <div className="md:hidden">{stacked}</div> : null}
      <div className={`gms-table-scroll ${stacked ? "hidden md:block" : ""}`}>
        <table
          className="w-full text-left text-sm"
          style={{ minWidth }}
        >
          <thead>
            <tr className="border-b border-line bg-surface/50">
              {columns.map((c) => (
                <th
                  key={c}
                  className="px-3 py-3 font-display text-[0.62rem] font-medium uppercase tracking-[0.14em] text-mute sm:px-4"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </>
  );
}

export function ControlCards({
  controls,
  linkLabel = "Ouvrir",
  showController = false,
}: {
  controls: Control[];
  linkLabel?: string;
  showController?: boolean;
}) {
  return (
    <ul className="divide-y divide-line">
      {controls.map((c) => (
        <li key={c.id} className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-mist">
                {c.establishment?.name ?? "—"}
              </p>
              <p className="mt-1 text-xs text-mute">
                {formatDate(c.createdAt)}
                {showController && c.user?.name ? ` · ${c.user.name}` : ""}
              </p>
            </div>
            <Link
              href={`/controls/${c.id}`}
              className="shrink-0 text-xs text-gold hover:underline"
            >
              {linkLabel}
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <FormTypeBadge formType={c.formType} />
            <StatusBadge tone={c.anomaly ? "alert" : "ok"}>
              {c.anomaly ? "Anomalie" : "OK"}
            </StatusBadge>
            {c.latitude != null && c.longitude != null ? (
              <span className="text-[0.62rem] uppercase tracking-label text-ok">
                GPS
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PageToolbar({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="gms-eyebrow">{eyebrow}</p>
        <h2 className="mt-1 font-display text-xl text-mist sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-mute">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          {children}
        </div>
      ) : null}
    </div>
  );
}
