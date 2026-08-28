"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DashPanel, KpiTile, PageToolbar } from "@/components/DashWidgets";
import { MonthBoard, PlanningViewToggle } from "@/components/MonthBoard";
import {
  WeekBoard,
  formatPlanHours,
  planStatusTone,
} from "@/components/WeekBoard";
import {
  api,
  ApiError,
  currentMonthISO,
  localDateISO,
  mondayOfDate,
  monthLabel,
  planStatusLabel,
  shiftMonth,
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

type MonthPayload = {
  month: string;
  label: string;
  plans: PlannedControl[];
  kpis: WeekPayload["kpis"];
};

function shiftWeek(weekStart: string, deltaDays: number) {
  const d = new Date(`${weekStart}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function statusTone(status: PlanStatus) {
  return planStatusTone(status);
}

function PlanCard({ p }: { p: PlannedControl }) {
  return (
    <article className="border border-line bg-surface/40 p-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-mist">{p.establishment.name}</p>
        {p.clientName ? (
          <p className="truncate text-[0.7rem] text-mute">{p.clientName}</p>
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
        {p.status !== "non_effectue" && !p.controlId ? (
          <Link
            href={`/controls/new?planId=${encodeURIComponent(p.id)}`}
            className="text-xs font-medium text-gold hover:underline"
          >
            Reporter le contrôle
          </Link>
        ) : p.controlId ? (
          <Link
            href={`/controls/${p.controlId}`}
            className="text-xs text-gold hover:underline"
          >
            Voir le rapport
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export default function ControllerPlanningPage() {
  const { push } = useToast();
  const [view, setView] = useState<"month" | "week">("month");
  const [month, setMonth] = useState(currentMonthISO);
  const [selectedDate, setSelectedDate] = useState(localDateISO);
  const [monthData, setMonthData] = useState<MonthPayload | null>(null);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [week, setWeek] = useState<WeekPayload | null>(null);

  const loadMonth = useCallback(async (m: string) => {
    const data = await api<MonthPayload>(
      `/api/planning/month?month=${encodeURIComponent(m)}`
    );
    setMonthData(data);
    setMonth(data.month);
  }, []);

  const loadWeek = useCallback(async (ws?: string) => {
    const q = ws ? `?week=${encodeURIComponent(ws)}` : "";
    const data = await api<WeekPayload>(`/api/planning/week${q}`);
    setWeek(data);
    setWeekStart(data.weekStart);
  }, []);

  useEffect(() => {
    loadMonth(month).catch((err) =>
      push(
        err instanceof ApiError ? err.message : "Chargement impossible.",
        "error"
      )
    );
  }, [loadMonth, month, push]);

  useEffect(() => {
    if (view !== "week") return;
    loadWeek(weekStart ?? mondayOfDate(selectedDate)).catch((err) =>
      push(
        err instanceof ApiError ? err.message : "Chargement impossible.",
        "error"
      )
    );
    // Charge la semaine au passage d’onglet ; prev/next appellent loadWeek directement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, loadWeek, push]);

  const kpis = view === "month" ? monthData?.kpis : week?.kpis;
  const weekLabel = useMemo(() => {
    if (!week) return "";
    return `${week.weekStart} → ${week.weekEnd}`;
  }, [week]);

  function goMonth(delta: number) {
    const next = shiftMonth(month, delta);
    const today = localDateISO();
    setMonth(next);
    setSelectedDate(today.startsWith(next) ? today : `${next}-01`);
  }

  return (
    <AppShell title="Mon planning">
      <PageToolbar
        eyebrow="Opérations"
        title="Planning des contrôles"
        description="Sites qui vous sont affectés ce mois."
      >
        <PlanningViewToggle
          value={view}
          onChange={(v) => {
            if (v === "week") setWeekStart(mondayOfDate(selectedDate));
            setView(v);
          }}
        />
      </PageToolbar>

      <div className="mb-6 flex w-full flex-wrap items-center gap-2">
        {view === "month" ? (
          <>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() => goMonth(-1)}
            >
              ←
            </Button>
            <span className="order-first w-full rounded border border-line px-3 py-2 text-center font-display text-xs uppercase tracking-[0.12em] text-gold sm:order-none sm:w-auto">
              {monthData?.label || monthLabel(month)}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() => goMonth(1)}
            >
              →
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => {
                const now = currentMonthISO();
                setMonth(now);
                setSelectedDate(localDateISO());
              }}
            >
              Ce mois
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() =>
                weekStart && loadWeek(shiftWeek(weekStart, -7)).catch(() => {})
              }
            >
              ←
            </Button>
            <span className="order-first w-full rounded border border-line px-3 py-2 text-center font-display text-xs uppercase tracking-[0.12em] text-gold sm:order-none sm:w-auto">
              {weekLabel || "…"}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() =>
                weekStart && loadWeek(shiftWeek(weekStart, 7)).catch(() => {})
              }
            >
              →
            </Button>
          </>
        )}
      </div>

      {kpis ? (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile label="Affectés" value={kpis.total} />
          <KpiTile label="Planifiés" value={kpis.planifie} />
          <KpiTile label="En cours" value={kpis.enCours} />
          <KpiTile label="Terminés" value={kpis.termine} />
        </div>
      ) : null}

      {view === "month" ? (
        <DashPanel title="Planning du mois">
          {!monthData ? (
            <p className="px-4 py-8 text-center text-sm text-mute">
              Chargement…
            </p>
          ) : (
            <MonthBoard
              month={monthData.month}
              plans={monthData.plans}
              selectedDate={selectedDate}
              onSelectDate={(iso) => {
                const nextMonth = iso.slice(0, 7);
                if (nextMonth !== month) setMonth(nextMonth);
                setSelectedDate(iso);
              }}
            >
              {(p) => <PlanCard p={p} />}
            </MonthBoard>
          )}
        </DashPanel>
      ) : (
        <DashPanel title="Planning de la semaine">
          {!week ? (
            <p className="px-4 py-8 text-center text-sm text-mute">
              Chargement…
            </p>
          ) : (
            <WeekBoard
              weekStart={week.weekStart}
              dayLabels={week.dayLabels}
              plans={week.plans}
            >
              {(p) => <PlanCard p={p} />}
            </WeekBoard>
          )}
        </DashPanel>
      )}
    </AppShell>
  );
}
