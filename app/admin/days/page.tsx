"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DashPanel, PageToolbar } from "@/components/DashWidgets";
import { FieldLabel, Input, Select } from "@/components/Field";
import {
  api,
  ApiError,
  formatDayHeading,
  formatLocalDate,
  localDateISO,
  type DayLog,
  type User,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

type Filters = {
  date: string;
  userId: string;
};

export default function AdminDaysPage() {
  const { push } = useToast();
  const detailRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Filters>({
    date: localDateISO(),
    userId: "",
  });
  const [applied, setApplied] = useState<Filters>({
    date: localDateISO(),
    userId: "",
  });
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [controllers, setControllers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async (filters: Filters) => {
    const q = new URLSearchParams();
    if (filters.date) q.set("date", filters.date);
    if (filters.userId) q.set("userId", filters.userId);
    const qs = q.toString();
    return api<{ logs: DayLog[] }>(
      `/api/admin/day-logs${qs ? `?${qs}` : ""}`
    );
  }, []);

  useEffect(() => {
    api<{ users: User[] }>("/api/admin/users")
      .then((d) =>
        setControllers(d.users.filter((u) => u.role === "controleur"))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadLogs(applied)
      .then((data) => {
        if (cancelled) return;
        setLogs(data.logs);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        push(
          err instanceof ApiError ? err.message : "Chargement impossible.",
          "error"
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applied, loadLogs, push]);

  useEffect(() => {
    if (selectedId && !logs.some((l) => l.id === selectedId)) {
      setSelectedId(null);
    }
  }, [logs, selectedId]);

  const selected = useMemo(
    () => logs.find((l) => l.id === selectedId) ?? null,
    [logs, selectedId]
  );

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setApplied({ ...draft });
    setSelectedId(null);
  }

  function onReset() {
    const empty: Filters = { date: "", userId: "" };
    setDraft(empty);
    setApplied(empty);
    setSelectedId(null);
  }

  function selectLog(id: string) {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      window.setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  return (
    <AppShell requireAdmin title="Journées">
      <PageToolbar
        eyebrow="Opérations"
        title="Compte-rendus de journée"
        description="Consultez les textes rédigés par les contrôleurs."
      />

      <DashPanel title="Filtres">
        <form onSubmit={onSearch} className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
            <div>
              <FieldLabel htmlFor="filter-date">Date</FieldLabel>
              <Input
                id="filter-date"
                type="date"
                className="min-h-11"
                value={draft.date}
                onChange={(e) =>
                  setDraft((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div>
              <FieldLabel htmlFor="filter-user">Contrôleur</FieldLabel>
              <Select
                id="filter-user"
                className="min-h-11"
                value={draft.userId}
                onChange={(e) =>
                  setDraft((f) => ({ ...f, userId: e.target.value }))
                }
              >
                <option value="">— Tous —</option>
                {controllers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" className="min-h-11 w-full lg:w-auto">
              Rechercher
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full lg:w-auto"
              onClick={onReset}
            >
              Réinitialiser
            </Button>
          </div>
        </form>
      </DashPanel>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DashPanel title={`Résultats (${logs.length})`}>
          {loading ? (
            <p className="px-5 py-10 text-sm text-mute">Chargement…</p>
          ) : !logs.length ? (
            <p className="px-5 py-10 text-sm text-mute">
              Aucun compte-rendu pour ces filtres.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {logs.map((log) => {
                const active = log.id === selectedId;
                return (
                  <li key={log.id}>
                    <button
                      type="button"
                      onClick={() => selectLog(log.id)}
                      className={`block w-full scroll-mt-24 px-4 py-3.5 text-left transition hover:bg-surface ${
                        active ? "border-l-2 border-l-brand bg-surface" : ""
                      }`}
                    >
                      <p className="font-medium text-mist">
                        {log.user?.name ?? "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-mute">
                        {formatLocalDate(log.date)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-mute">
                        {log.text}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </DashPanel>

        <div ref={detailRef}>
          <DashPanel title="Détail">
            {!selected ? (
              <p className="px-5 py-10 text-sm text-mute">
                Sélectionnez un compte-rendu dans la liste.
              </p>
            ) : (
              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <p className="font-display text-lg text-mist">
                    {selected.user?.name ?? "—"}
                  </p>
                  <p className="mt-1 text-sm text-mute">
                    {formatDayHeading(selected.date)} ·{" "}
                    {formatLocalDate(selected.date)}
                  </p>
                  {selected.user?.email ? (
                    <p className="mt-0.5 text-xs text-mute">
                      {selected.user.email}
                    </p>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-mist">
                  {selected.text}
                </p>
              </div>
            )}
          </DashPanel>
        </div>
      </div>
    </AppShell>
  );
}
