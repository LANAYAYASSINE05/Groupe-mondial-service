"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DashPanel, KpiTile } from "@/components/DashWidgets";
import {
  api,
  ApiError,
  formatDate,
  planStatusLabel,
  type PlannedControl,
  type PlanStatus,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

type WeekRow = {
  establishmentId: string;
  siteName: string;
  clientName: string;
  byDay: (PlannedControl | null)[];
  reportRefs: { id: string; label: string }[];
};

type WeekPayload = {
  weekStart: string;
  weekEnd: string;
  dayLabels: string[];
  plans: PlannedControl[];
  rows: WeekRow[];
  kpis: {
    total: number;
    planifie: number;
    enCours: number;
    termine: number;
    nonEffectue: number;
  };
};

function shiftWeek(weekStart: string, deltaDays: number) {
  const d = new Date(`${weekStart}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function statusTone(status: PlanStatus) {
  if (status === "termine") return "bg-ok/20 text-ok border-ok/40";
  if (status === "en_cours") return "bg-gold/20 text-gold border-gold/40";
  if (status === "non_effectue")
    return "bg-brand/20 text-brand-light border-brand/40";
  return "bg-surface text-mist border-line";
}

export default function ControllerPlanningPage() {
  const { push } = useToast();
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [week, setWeek] = useState<WeekPayload | null>(null);

  const loadWeek = useCallback(async (ws?: string) => {
    const q = ws ? `?week=${encodeURIComponent(ws)}` : "";
    const data = await api<WeekPayload>(`/api/planning/week${q}`);
    setWeek(data);
    setWeekStart(data.weekStart);
  }, []);

  useEffect(() => {
    loadWeek().catch((err) =>
      push(
        err instanceof ApiError ? err.message : "Chargement impossible.",
        "error"
      )
    );
  }, [loadWeek, push]);

  const weekLabel = useMemo(() => {
    if (!week) return "";
    return `${week.weekStart} → ${week.weekEnd}`;
  }, [week]);

  return (
    <AppShell title="Mon planning">
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="gms-eyebrow">Opérations</p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-mist">
              Planning des contrôles
            </h1>
            <p className="mt-2 text-sm text-mute">
              Sites qui vous sont affectés pour la semaine.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                weekStart && loadWeek(shiftWeek(weekStart, -7)).catch(() => {})
              }
            >
              ←
            </Button>
            <span className="rounded border border-line px-3 py-2 font-display text-xs uppercase tracking-[0.12em] text-gold">
              {weekLabel || "…"}
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                weekStart && loadWeek(shiftWeek(weekStart, 7)).catch(() => {})
              }
            >
              →
            </Button>
          </div>
        </div>

        {week ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile label="Affectés" value={week.kpis.total} />
            <KpiTile label="Planifiés" value={week.kpis.planifie} />
            <KpiTile label="En cours" value={week.kpis.enCours} />
            <KpiTile label="Terminés" value={week.kpis.termine} />
          </div>
        ) : null}

        <DashPanel title="Mes créneaux">
          <ul className="divide-y divide-line">
            {!week || week.plans.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-mute">
                Aucune affectation cette semaine.
              </li>
            ) : (
              week.plans.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-mist">
                      {p.establishment.name}
                      {p.clientName ? (
                        <span className="text-mute"> · {p.clientName}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-mute">
                      {p.dayLabel} · {formatDate(p.plannedAt)}
                      {" → "}
                      {formatDate(p.plannedUntil || p.plannedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded border px-2 py-0.5 text-[0.65rem] uppercase tracking-wide ${statusTone(p.status)}`}
                    >
                      {planStatusLabel(p.status)}
                    </span>
                    {p.status !== "termine" && p.status !== "non_effectue" ? (
                      <Link
                        href="/controls/new"
                        className="text-sm text-gold hover:underline"
                      >
                        Faire le contrôle
                      </Link>
                    ) : p.controlId ? (
                      <Link
                        href={`/controls/${p.controlId}`}
                        className="text-sm text-gold hover:underline"
                      >
                        Voir rapport
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </DashPanel>

        <DashPanel title="Vue hebdomadaire">
          <div className="overflow-x-auto p-2">
            <table className="min-w-[900px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-surface/80 text-[0.65rem] uppercase tracking-[0.1em] text-mute">
                  <th className="border border-line px-3 py-2 text-left">
                    Site
                  </th>
                  {(week?.dayLabels ?? []).map((d) => (
                    <th
                      key={d}
                      className="border border-line px-2 py-2 text-center"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!week || week.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border border-line px-4 py-6 text-center text-mute"
                    >
                      —
                    </td>
                  </tr>
                ) : (
                  week.rows.map((row) => (
                    <tr key={`${row.establishmentId}-${row.clientName}`}>
                      <td className="border border-line px-3 py-2">
                        {row.siteName}
                      </td>
                      {row.byDay.map((plan, i) => (
                        <td
                          key={i}
                          className="border border-line px-2 py-2 text-center"
                        >
                          {plan ? (
                            <span
                              className={`inline-block rounded border px-2 py-0.5 text-[0.65rem] ${statusTone(plan.status)}`}
                            >
                              {new Date(plan.plannedAt).toLocaleTimeString(
                                "fr-FR",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashPanel>
      </div>
    </AppShell>
  );
}
