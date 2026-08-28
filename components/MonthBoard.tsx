"use client";

import { useMemo, type ReactNode } from "react";
import {
  formatDayHeading,
  isPlanRescheduled,
  localDateISO,
  type PlannedControl,
} from "@/lib/api-client";
import { planStatusTone } from "@/components/WeekBoard";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type GridDay = {
  iso: string;
  inMonth: boolean;
  date: number;
  today: boolean;
  plans: PlannedControl[];
};

function buildGrid(month: string, plans: PlannedControl[]): GridDay[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const start = new Date(first);
  const mondayOffset = (first.getDay() + 6) % 7;
  start.setDate(first.getDate() - mondayOffset);
  const today = localDateISO();
  const byDate = new Map<string, PlannedControl[]>();
  for (const plan of plans) {
    const keys = new Set<string>();
    keys.add(localDateISO(new Date(plan.plannedAt)));
    if (plan.reportedAt && isPlanRescheduled(plan)) {
      keys.add(localDateISO(new Date(plan.reportedAt)));
    }
    for (const key of keys) {
      const list = byDate.get(key) ?? [];
      if (!list.some((p) => p.id === plan.id)) list.push(plan);
      byDate.set(key, list);
    }
  }
  for (const list of byDate.values()) {
    list.sort((a, b) => a.plannedAt.localeCompare(b.plannedAt));
  }

  const days: GridDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = localDateISO(d);
    days.push({
      iso,
      inMonth: d.getMonth() === m - 1,
      date: d.getDate(),
      today: iso === today,
      plans: byDate.get(iso) ?? [],
    });
  }
  if (days.slice(35).every((d) => !d.inMonth)) days.length = 35;
  return days;
}

function statusDot(status: PlannedControl["status"]) {
  if (status === "termine") return "bg-ok";
  if (status === "en_cours") return "bg-gold";
  if (status === "non_effectue") return "bg-brand";
  return "bg-mute";
}

export function PlanningViewToggle({
  value,
  onChange,
}: {
  value: "month" | "week";
  onChange: (v: "month" | "week") => void;
}) {
  return (
    <div className="flex w-full rounded-md border border-line p-0.5 sm:inline-flex sm:w-auto">
      <button
        type="button"
        onClick={() => onChange("month")}
        className={`min-h-11 flex-1 rounded px-3 py-2 font-display text-[0.62rem] uppercase tracking-[0.12em] transition-colors sm:min-h-0 sm:flex-none sm:py-1.5 ${
          value === "month" ? "bg-brand text-white" : "text-mute hover:text-mist"
        }`}
      >
        Mois
      </button>
      <button
        type="button"
        onClick={() => onChange("week")}
        className={`min-h-11 flex-1 rounded px-3 py-2 font-display text-[0.62rem] uppercase tracking-[0.12em] transition-colors sm:min-h-0 sm:flex-none sm:py-1.5 ${
          value === "week" ? "bg-brand text-white" : "text-mute hover:text-mist"
        }`}
      >
        Semaine
      </button>
    </div>
  );
}

export function MonthBoard({
  month,
  plans,
  selectedDate,
  onSelectDate,
  emptyLabel = "Aucun créneau ce jour.",
  children,
}: {
  month: string;
  plans: PlannedControl[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  emptyLabel?: string;
  children: (plan: PlannedControl) => ReactNode;
}) {
  const days = useMemo(() => buildGrid(month, plans), [month, plans]);
  const selected = days.find((d) => d.iso === selectedDate);
  const selectedPlans = selected?.plans ?? [];

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
      <div className="min-w-0 p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-px bg-line">
          {WEEKDAYS.map((label) => (
            <div
              key={label}
              className="bg-surface/80 py-2 text-center font-display text-[0.58rem] uppercase tracking-[0.12em] text-mute"
            >
              {label}
            </div>
          ))}
          {days.map((day) => {
            const selectedDay = day.iso === selectedDate;
            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => onSelectDate(day.iso)}
                className={`flex min-h-[3.35rem] flex-col items-stretch gap-0.5 bg-white p-1 text-left transition sm:min-h-[5.5rem] sm:p-1.5 md:min-h-[6.5rem] ${
                  selectedDay
                    ? "ring-1 ring-inset ring-brand"
                    : "hover:bg-surface/70"
                } ${day.today && !selectedDay ? "bg-brand/5" : ""} ${
                  day.inMonth ? "" : "bg-surface/40"
                }`}
                aria-pressed={selectedDay}
                aria-label={`${formatDayHeading(day.iso)}, ${day.plans.length} créneau${day.plans.length > 1 ? "x" : ""}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center font-display text-xs tabular-nums ${
                    selectedDay
                      ? "bg-brand text-white"
                      : day.today
                        ? "text-brand"
                        : day.inMonth
                          ? "text-mist"
                          : "text-na"
                  }`}
                >
                  {day.date}
                </span>
                <span className="mt-auto flex flex-wrap gap-0.5 md:hidden">
                  {day.plans.slice(0, 4).map((p) => (
                    <span
                      key={p.id}
                      className={`h-1.5 w-1.5 rounded-full ${statusDot(p.status)}`}
                    />
                  ))}
                </span>
                <ul className="mt-auto hidden space-y-0.5 md:block">
                  {day.plans.slice(0, 2).map((p) => (
                    <li
                      key={p.id}
                      className={`truncate rounded border px-1 py-0.5 text-[0.58rem] leading-tight ${planStatusTone(p.status)}`}
                    >
                      {p.establishment.name}
                    </li>
                  ))}
                  {day.plans.length > 2 ? (
                    <li className="text-[0.58rem] text-mute">
                      +{day.plans.length - 2}
                    </li>
                  ) : null}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line p-3 sm:p-4 lg:border-l lg:border-t-0">
        <p className="mb-3 font-display text-[0.65rem] uppercase tracking-[0.14em] text-gold">
          {formatDayHeading(selectedDate)}
          {selected?.today ? " · aujourd’hui" : ""}
        </p>
        {selectedPlans.length === 0 ? (
          <p className="py-6 text-center text-xs text-mute">{emptyLabel}</p>
        ) : (
          <div className="space-y-2">
            {selectedPlans.map((plan) => (
              <div key={plan.id}>{children(plan)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
