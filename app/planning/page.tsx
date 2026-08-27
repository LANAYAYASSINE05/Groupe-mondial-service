"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DashPanel, KpiTile } from "@/components/DashWidgets";
import {
  WeekBoard,
  formatPlanHours,
  planStatusTone,
} from "@/components/WeekBoard";
import {
  api,
  ApiError,
  planStatusLabel,
  type PlannedControl,
  type PlanStatus,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

type WeekPayload = {
  weekStart: string;
  weekEnd: string;
  dayLabels: string[];
  plans: PlannedControl[];
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
  return planStatusTone(status);
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
            <h1 className="mt-2 font-display text-xl font-semibold text-mist sm:text-2xl">
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiTile label="Affectés" value={week.kpis.total} />
            <KpiTile label="Planifiés" value={week.kpis.planifie} />
            <KpiTile label="En cours" value={week.kpis.enCours} />
            <KpiTile label="Terminés" value={week.kpis.termine} />
          </div>
        ) : null}

        <DashPanel title="Planning de la semaine">
          {!week ? (
            <p className="px-4 py-8 text-center text-sm text-mute">Chargement…</p>
          ) : (
            <WeekBoard
              weekStart={week.weekStart}
              dayLabels={week.dayLabels}
              plans={week.plans}
            >
              {(p) => (
                <article className="border border-line bg-surface/40 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-mist">
                      {p.establishment.name}
                    </p>
                    {p.clientName ? (
                      <p className="truncate text-[0.7rem] text-mute">
                        {p.clientName}
                      </p>
                    ) : null}
                    <p className="mt-0.5 font-display text-[0.7rem] tabular-nums text-mist">
                      {formatPlanHours(p)}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded border px-2 py-0.5 text-[0.65rem] uppercase tracking-wide ${statusTone(p.status)}`}
                    >
                      {planStatusLabel(p.status)}
                    </span>
                    {p.status !== "termine" && p.status !== "non_effectue" ? (
                      <Link
                        href="/controls/new"
                        className="text-xs text-gold hover:underline"
                      >
                        Faire le contrôle
                      </Link>
                    ) : p.controlId ? (
                      <Link
                        href={`/controls/${p.controlId}`}
                        className="text-xs text-gold hover:underline"
                      >
                        Voir rapport
                      </Link>
                    ) : null}
                  </div>
                </article>
              )}
            </WeekBoard>
          )}
        </DashPanel>
      </div>
    </AppShell>
  );
}
