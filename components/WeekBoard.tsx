"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { PlanStatus, PlannedControl } from "@/lib/api-client";

export function planStatusTone(status: PlanStatus) {
  if (status === "termine") return "bg-ok/20 text-ok border-ok/40";
  if (status === "en_cours") return "bg-gold/20 text-gold border-gold/40";
  if (status === "non_effectue")
    return "bg-brand/20 text-brand-light border-brand/40";
  return "bg-surface text-mist border-line";
}

export function formatPlanHours(plan: PlannedControl) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };
  const from = new Date(plan.plannedAt).toLocaleTimeString("fr-FR", opts);
  const until = new Date(plan.plannedUntil || plan.plannedAt).toLocaleTimeString(
    "fr-FR",
    opts
  );
  return `${from}–${until}`;
}

function dayDate(weekStart: string, index: number) {
  const d = new Date(`${weekStart}T12:00:00`);
  d.setDate(d.getDate() + index);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function defaultDayIndex(weekStart: string) {
  const start = dayDate(weekStart, 0);
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    if (isSameDay(dayDate(weekStart, i), today)) return i;
  }
  return start > today ? 0 : 6;
}

export function WeekBoard({
  weekStart,
  dayLabels,
  plans,
  emptyLabel = "Aucun créneau ce jour.",
  children,
}: {
  weekStart: string;
  dayLabels: string[];
  plans: PlannedControl[];
  emptyLabel?: string;
  children: (plan: PlannedControl) => ReactNode;
}) {
  const [day, setDay] = useState(() => defaultDayIndex(weekStart));

  useEffect(() => {
    setDay(defaultDayIndex(weekStart));
  }, [weekStart]);

  const byDay = useMemo(() => {
    const groups: PlannedControl[][] = Array.from({ length: 7 }, () => []);
    for (const plan of plans) {
      const i = Math.min(6, Math.max(0, plan.dayIndex));
      groups[i].push(plan);
    }
    for (const list of groups) {
      list.sort((a, b) => a.plannedAt.localeCompare(b.plannedAt));
    }
    return groups;
  }, [plans]);

  function DayTab({
    index,
    interactive,
  }: {
    index: number;
    interactive?: boolean;
  }) {
    const count = byDay[index].length;
    const today = isSameDay(dayDate(weekStart, index), new Date());
    const selected = day === index;
    const label = dayLabels[index] ?? `J${index + 1}`;
    const number = dayDate(weekStart, index).getDate();
    const className = `flex min-h-12 min-w-0 flex-col items-center justify-center rounded-sm border px-0.5 py-1.5 transition ${
      interactive && selected
        ? "border-brand bg-brand text-white"
        : today
          ? "border-brand/50 bg-brand/5 text-mist"
          : "border-line bg-white text-mute"
    }`;

    const body = (
      <>
        <span className="font-display text-[0.58rem] uppercase tracking-[0.08em]">
          {label}
        </span>
        <span
          className={`font-display text-sm font-semibold tabular-nums ${
            interactive && selected ? "text-white" : "text-mist"
          }`}
        >
          {number}
        </span>
        <span
          className={`text-[0.58rem] tabular-nums ${
            interactive && selected ? "text-white/80" : "text-na"
          }`}
        >
          {count > 0 ? count : "·"}
        </span>
      </>
    );

    if (interactive) {
      return (
        <button
          type="button"
          onClick={() => setDay(index)}
          className={className}
          aria-pressed={selected}
          aria-label={`${label} ${number}${today ? ", aujourd'hui" : ""}, ${count} créneau${count > 1 ? "x" : ""}`}
        >
          {body}
        </button>
      );
    }

    return (
      <div className={`${className} cursor-default`}>
        {body}
      </div>
    );
  }

  function DayList({ index }: { index: number }) {
    const list = byDay[index];
    if (list.length === 0) {
      return <p className="px-1 py-6 text-center text-xs text-mute">{emptyLabel}</p>;
    }
    return (
      <div className="space-y-2">
        {list.map((plan) => (
          <div key={plan.id}>{children(plan)}</div>
        ))}
      </div>
    );
  }

  const selectedDate = dayDate(weekStart, day);
  const selectedToday = isSameDay(selectedDate, new Date());

  return (
    <div>
      <div className="2xl:hidden">
        <div className="grid grid-cols-7 gap-1 p-2">
          {dayLabels.map((_, index) => (
            <DayTab key={index} index={index} interactive />
          ))}
        </div>
        <div className="border-t border-line p-3 sm:p-4">
          <p className="mb-3 font-display text-[0.65rem] uppercase tracking-[0.14em] text-gold">
            {dayLabels[day]} {selectedDate.getDate()}
            {selectedToday ? " · aujourd’hui" : ""}
          </p>
          <DayList index={day} />
        </div>
      </div>

      <div className="hidden 2xl:grid 2xl:grid-cols-7 2xl:gap-px 2xl:bg-line">
        {dayLabels.map((_, index) => (
          <section key={index} className="min-w-0 bg-white p-2">
            <DayTab index={index} />
            <div className="mt-2">
              <DayList index={index} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
