"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { FieldLabel, Input, Select, Textarea } from "@/components/Field";
import { FormTypeBadge } from "@/components/FormTypeBadge";
import { DashPanel, KpiTile } from "@/components/DashWidgets";
import {
  WeekBoard,
  formatPlanHours,
  planStatusTone,
} from "@/components/WeekBoard";
import {
  api,
  ApiError,
  formatDate,
  planStatusLabel,
  type Establishment,
  type PlannedControl,
  type PlanStatus,
  type User,
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

type SiteHistory = {
  establishment: { id: string; name: string; address: string };
  planned: PlannedControl[];
  controls: {
    id: string;
    formType: string;
    anomaly: boolean;
    createdAt: string;
    user: { id: string; name: string; email: string };
    ref: string;
  }[];
};

const STATUSES: PlanStatus[] = [
  "planifie",
  "en_cours",
  "termine",
  "non_effectue",
];

function shiftWeek(weekStart: string, deltaDays: number) {
  const d = new Date(`${weekStart}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valeur datetime-local pour maintenant (aujourd'hui, heure courante). */
function nowLocalInputValue() {
  return toLocalInputValue(new Date().toISOString());
}

/** Par défaut : dans 2 heures. */
function defaultUntilLocalInputValue(fromLocal: string) {
  const from = new Date(fromLocal);
  if (Number.isNaN(from.getTime())) return nowLocalInputValue();
  from.setHours(from.getHours() + 2);
  return toLocalInputValue(from.toISOString());
}

function fromLocalInputValue(local: string) {
  // Interprété en heure locale du navigateur
  return new Date(local).toISOString();
}

function statusTone(status: PlanStatus) {
  return planStatusTone(status);
}

function ControllerMultiSelect({
  users,
  value,
  onChange,
}: {
  users: User[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selected = users.filter((u) => value.includes(u.id));
  const label =
    selected.length === 0
      ? "— Sélectionner —"
      : selected.length === 1
        ? selected[0].name
        : `${selected.length} contrôleurs`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="gms-field gms-select flex w-full min-h-11 items-center justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected.length === 0 ? "text-mute" : "text-mist"}>
          {label}
        </span>
        <span className="text-mute">▾</span>
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-line bg-[var(--gms-field)] p-2 shadow-lg">
          {users.map((u) => {
            const checked = value.includes(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() =>
                  onChange(
                    checked
                      ? value.filter((id) => id !== u.id)
                      : [...value, u.id]
                  )
                }
                className={`mb-1 flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm last:mb-0 ${
                  checked
                    ? "border-gold/40 bg-gold-dim text-mist"
                    : "border-transparent text-mist hover:bg-black/5"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border text-[0.55rem] ${
                    checked
                      ? "border-gold bg-gold text-ink"
                      : "border-line text-transparent"
                  }`}
                >
                  ✓
                </span>
                {u.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminPlanningPage() {
  const { push } = useToast();
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [week, setWeek] = useState<WeekPayload | null>(null);
  const [sites, setSites] = useState<Establishment[]>([]);
  const [controllers, setControllers] = useState<User[]>([]);
  const [busy, setBusy] = useState(false);

  const [establishmentId, setEstablishmentId] = useState("");
  const [clientName, setClientName] = useState("");
  const [plannedFromLocal, setPlannedFromLocal] = useState("");
  const [plannedUntilLocal, setPlannedUntilLocal] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [historySiteId, setHistorySiteId] = useState("");
  const [history, setHistory] = useState<SiteHistory | null>(null);

  const loadWeek = useCallback(
    async (ws?: string) => {
      const q = ws ? `?week=${encodeURIComponent(ws)}` : "";
      const data = await api<WeekPayload>(`/api/planning/week${q}`);
      setWeek(data);
      setWeekStart(data.weekStart);
      return data;
    },
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const [w, est, users] = await Promise.all([
          loadWeek(),
          api<{ establishments: Establishment[] }>(
            "/api/admin/establishments"
          ),
          api<{ users: User[] }>("/api/admin/users"),
        ]);
        setSites(est.establishments.filter((s) => s.active));
        setControllers(
          users.users.filter((u) => u.role === "controleur" && u.active)
        );
        if (!plannedFromLocal) {
          const from = nowLocalInputValue();
          setPlannedFromLocal(from);
          setPlannedUntilLocal(defaultUntilLocalInputValue(from));
        }
      } catch (err) {
        push(
          err instanceof ApiError ? err.message : "Chargement impossible.",
          "error"
        );
      }
    })();
  }, [loadWeek, plannedFromLocal, push]);

  async function refreshHistory(siteId: string) {
    if (!siteId) {
      setHistory(null);
      return;
    }
    try {
      const data = await api<SiteHistory>(
        `/api/planning/history?establishmentId=${encodeURIComponent(siteId)}`
      );
      setHistory(data);
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Historique indisponible.",
        "error"
      );
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (
      !establishmentId ||
      !plannedFromLocal ||
      !plannedUntilLocal ||
      assigneeIds.length === 0
    ) {
      push("Site, dates du/au et contrôleurs sont obligatoires.", "error");
      return;
    }
    if (new Date(plannedUntilLocal) < new Date(plannedFromLocal)) {
      push("La date « au » doit être après la date « du ».", "error");
      return;
    }
    setBusy(true);
    try {
      await api("/api/planning", {
        method: "POST",
        body: JSON.stringify({
          establishmentId,
          clientName,
          plannedAt: fromLocalInputValue(plannedFromLocal),
          plannedUntil: fromLocalInputValue(plannedUntilLocal),
          assigneeIds,
          notes,
        }),
      });
      push("Contrôle planifié.");
      setNotes("");
      await loadWeek(weekStart ?? undefined);
      if (historySiteId === establishmentId) {
        await refreshHistory(establishmentId);
      }
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Création impossible.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(planId: string, status: PlanStatus) {
    try {
      await api(`/api/planning/${planId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      push("État mis à jour.");
      await loadWeek(weekStart ?? undefined);
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Mise à jour impossible.",
        "error"
      );
    }
  }

  async function linkControl(planId: string, controlId: string) {
    const id = controlId.trim();
    if (!id) return;
    try {
      await api(`/api/planning/${planId}`, {
        method: "PATCH",
        body: JSON.stringify({ controlId: id }),
      });
      push("Rapport lié.");
      await loadWeek(weekStart ?? undefined);
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Liaison impossible.",
        "error"
      );
    }
  }

  async function removePlan(planId: string) {
    if (!confirm("Supprimer cette planification ?")) return;
    try {
      await api(`/api/planning/${planId}`, { method: "DELETE" });
      push("Planification supprimée.");
      await loadWeek(weekStart ?? undefined);
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Suppression impossible.",
        "error"
      );
    }
  }

  const weekLabel = useMemo(() => {
    if (!week) return "";
    return `${week.weekStart} → ${week.weekEnd}`;
  }, [week]);

  return (
    <AppShell requireAdmin title="Planning hebdomadaire">
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="gms-eyebrow">Opérations</p>
            <h1 className="mt-2 font-display text-xl font-semibold text-mist sm:text-2xl">
              Planification des contrôles hebdomadaires
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-mute">
              Programmez les sites à contrôler, affectez les contrôleurs et
              suivez l’état semaine par semaine.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 flex-1 sm:flex-none"
              onClick={() =>
                weekStart && loadWeek(shiftWeek(weekStart, -7)).catch(() => {})
              }
            >
              ← Préc.
            </Button>
            <span className="order-first w-full rounded border border-line px-3 py-2 text-center font-display text-[0.65rem] uppercase tracking-[0.12em] text-gold sm:order-none sm:w-auto">
              {weekLabel || "…"}
            </span>
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 flex-1 sm:flex-none"
              onClick={() =>
                weekStart && loadWeek(shiftWeek(weekStart, 7)).catch(() => {})
              }
            >
              Suiv. →
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 w-full sm:w-auto"
              onClick={() => loadWeek().catch(() => {})}
            >
              Aujourd’hui
            </Button>
          </div>
        </div>

        {week ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KpiTile label="Total" value={week.kpis.total} />
            <KpiTile label="Planifiés" value={week.kpis.planifie} />
            <KpiTile label="En cours" value={week.kpis.enCours} />
            <KpiTile label="Terminés" value={week.kpis.termine} />
            <KpiTile label="Non effectués" value={week.kpis.nonEffectue} />
          </div>
        ) : null}

        <DashPanel title="Nouveau créneau">
          <form
            onSubmit={onCreate}
            className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <div>
              <FieldLabel htmlFor="plan-site">Site</FieldLabel>
              <Select
                id="plan-site"
                required
                value={establishmentId}
                onChange={(e) => {
                  setEstablishmentId(e.target.value);
                  const site = sites.find((s) => s.id === e.target.value);
                  if (site && !clientName) setClientName(site.name);
                }}
              >
                <option value="">— Choisir —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="plan-client">Client</FieldLabel>
              <Input
                id="plan-client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nom du client"
              />
            </div>
            <div>
              <FieldLabel htmlFor="plan-from">Date du</FieldLabel>
              <Input
                id="plan-from"
                type="datetime-local"
                required
                value={plannedFromLocal}
                onChange={(e) => {
                  const v = e.target.value;
                  setPlannedFromLocal(v);
                  if (
                    !plannedUntilLocal ||
                    new Date(plannedUntilLocal) < new Date(v)
                  ) {
                    setPlannedUntilLocal(defaultUntilLocalInputValue(v));
                  }
                }}
              />
            </div>
            <div>
              <FieldLabel htmlFor="plan-until">Date au</FieldLabel>
              <Input
                id="plan-until"
                type="datetime-local"
                required
                value={plannedUntilLocal}
                min={plannedFromLocal || undefined}
                onChange={(e) => setPlannedUntilLocal(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-mute">
                Période prévue du contrôle (début → fin).
              </p>
            </div>
            <div>
              <FieldLabel>Contrôleurs affectés</FieldLabel>
              <ControllerMultiSelect
                users={controllers}
                value={assigneeIds}
                onChange={setAssigneeIds}
              />
            </div>
            <div className="md:col-span-2 xl:col-span-2">
              <FieldLabel htmlFor="plan-notes">Notes</FieldLabel>
              <Textarea
                id="plan-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Consignes, priorité…"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Enregistrement…" : "Planifier le contrôle"}
              </Button>
            </div>
          </form>
        </DashPanel>

        <DashPanel title="Planning de la semaine">
          {!week ? (
            <p className="px-4 py-8 text-center text-sm text-mute">Chargement…</p>
          ) : (
            <WeekBoard
              weekStart={week.weekStart}
              dayLabels={week.dayLabels}
              plans={week.plans}
            >
              {(plan) => (
                <article className="border border-line bg-surface/40 p-3">
                  <button
                    type="button"
                    className="min-w-0 w-full text-left"
                    onClick={() => {
                      setHistorySiteId(plan.establishmentId);
                      void refreshHistory(plan.establishmentId);
                    }}
                  >
                    <p className="truncate font-medium text-mist">
                      {plan.establishment.name}
                    </p>
                    {plan.clientName ? (
                      <p className="truncate text-[0.7rem] text-mute">
                        {plan.clientName}
                      </p>
                    ) : null}
                    <p className="mt-0.5 font-display text-[0.7rem] tabular-nums text-mist">
                      {formatPlanHours(plan)}
                    </p>
                  </button>
                  <p className="mt-1.5 truncate text-xs text-mute">
                    {plan.assignees.map((a) => a.name.split(" ")[0]).join(", ") ||
                      "—"}
                  </p>
                  <select
                    className={`mt-2 w-full rounded border px-2 py-1.5 text-[0.65rem] ${statusTone(plan.status)}`}
                    value={plan.status}
                    onChange={(e) =>
                      updateStatus(plan.id, e.target.value as PlanStatus)
                    }
                    aria-label="État du contrôle"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {planStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {plan.control ? (
                      <Link
                        href={`/controls/${plan.control.id}`}
                        className="text-xs text-gold hover:underline"
                      >
                        Rapport
                      </Link>
                    ) : (
                      <form
                        className="flex min-w-0 flex-1 gap-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          void linkControl(plan.id, String(fd.get("ref") || ""));
                          e.currentTarget.reset();
                        }}
                      >
                        <input
                          name="ref"
                          placeholder="UUID"
                          className="gms-field min-h-8 flex-1 px-2 py-1 text-[0.65rem]"
                          aria-label="Référence rapport"
                        />
                        <button
                          type="submit"
                          className="shrink-0 text-xs text-gold hover:underline"
                        >
                          Lier
                        </button>
                      </form>
                    )}
                    <button
                      type="button"
                      className="ml-auto text-xs text-mute hover:text-brand"
                      onClick={() => void removePlan(plan.id)}
                    >
                      Suppr.
                    </button>
                  </div>
                </article>
              )}
            </WeekBoard>
          )}
        </DashPanel>

        <DashPanel title="Historique par site">
          <div className="space-y-4 p-4">
            <div className="max-w-md">
              <FieldLabel htmlFor="hist-site">Site</FieldLabel>
              <Select
                id="hist-site"
                value={historySiteId}
                onChange={(e) => {
                  setHistorySiteId(e.target.value);
                  refreshHistory(e.target.value);
                }}
              >
                <option value="">— Choisir un site —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            {history ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-gold">
                    Planifications — {history.establishment.name}
                  </h3>
                  <ul className="space-y-2">
                    {history.planned.length === 0 ? (
                      <li className="text-sm text-mute">Aucune planification.</li>
                    ) : (
                      history.planned.map((p) => (
                        <li
                          key={p.id}
                          className="rounded border border-line bg-surface/40 px-3 py-2 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-mist">
                              {formatDate(p.plannedAt)}
                              {" → "}
                              {formatDate(p.plannedUntil || p.plannedAt)}
                            </span>
                            <span
                              className={`rounded border px-2 py-0.5 text-[0.65rem] uppercase tracking-wide ${statusTone(p.status)}`}
                            >
                              {planStatusLabel(p.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-mute">
                            {p.assignees.map((a) => a.name).join(", ")}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 font-display text-xs uppercase tracking-[0.14em] text-gold">
                    Contrôles réalisés
                  </h3>
                  <ul className="space-y-2">
                    {history.controls.length === 0 ? (
                      <li className="text-sm text-mute">Aucun contrôle enregistré.</li>
                    ) : (
                      history.controls.map((c) => (
                        <li
                          key={c.id}
                          className="rounded border border-line bg-surface/40 px-3 py-2 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Link
                              href={`/controls/${c.id}`}
                              className="font-mono text-xs text-gold hover:underline"
                            >
                              {c.ref}
                            </Link>
                            <span className="text-mute">
                              {formatDate(c.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mute">
                            <span>{c.user.name}</span>
                            <FormTypeBadge formType={c.formType} />
                            {c.anomaly ? <span>· anomalie</span> : null}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-mute">
                Sélectionnez un site pour afficher l’historique des contrôles.
              </p>
            )}
          </div>
        </DashPanel>
      </div>
    </AppShell>
  );
}

