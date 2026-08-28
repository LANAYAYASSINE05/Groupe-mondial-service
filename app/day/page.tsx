"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DashPanel, PageToolbar } from "@/components/DashWidgets";
import { FieldLabel, Input, Textarea } from "@/components/Field";
import {
  api,
  ApiError,
  formatDayHeading,
  formatLocalDate,
  localDateISO,
  shiftLocalDate,
  type DayLog,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

type DayPayload = {
  log: DayLog | null;
  recent: DayLog[];
};

export default function MyDayPage() {
  const { push } = useToast();
  const [date, setDate] = useState(localDateISO);
  const [text, setText] = useState("");
  const [recent, setRecent] = useState<DayLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async (iso: string) => {
    return api<DayPayload>(`/api/day-logs?date=${encodeURIComponent(iso)}`);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    load(date)
      .then((data) => {
        if (cancelled) return;
        setText(data.log?.text ?? "");
        setRecent(data.recent);
        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        push(
          err instanceof ApiError ? err.message : "Chargement impossible.",
          "error"
        );
      });
    return () => {
      cancelled = true;
    };
  }, [date, load, push]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/day-logs", {
        method: "PUT",
        body: JSON.stringify({ date, text }),
      });
      const data = await load(date);
      setText(data.log?.text ?? text);
      setRecent(data.recent);
      push("Journée enregistrée.");
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Enregistrement impossible.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Ma journée">
      <PageToolbar
        eyebrow="Opérations"
        title="Compte-rendu de la journée"
        description="Décrivez les contrôles réalisés, les anomalies observées et les points à suivre."
      />

      <form onSubmit={onSave} className="space-y-6">
        <DashPanel title="Écrire la journée">
          <div className="space-y-5 p-4 sm:p-5">
            <div>
              <FieldLabel htmlFor="day-date">Date</FieldLabel>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 w-11 shrink-0 px-0"
                  aria-label="Jour précédent"
                  onClick={() => setDate((d) => shiftLocalDate(d, -1))}
                >
                  ←
                </Button>
                <Input
                  id="day-date"
                  type="date"
                  className="min-h-11 min-w-0 flex-1 sm:max-w-xs"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 w-11 shrink-0 px-0"
                  aria-label="Jour suivant"
                  onClick={() => setDate((d) => shiftLocalDate(d, 1))}
                >
                  →
                </Button>
              </div>
              <p className="mt-2 text-sm text-mute">{formatDayHeading(date)}</p>
            </div>

            <div>
              <FieldLabel htmlFor="day-text">Texte de la journée</FieldLabel>
              <Textarea
                id="day-text"
                className="min-h-[12rem] sm:min-h-[14rem]"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex. : Matin — contrôle audit site X... Après-midi — passager site Y... Remarques..."
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                className="min-h-11 w-full sm:w-auto"
                disabled={saving || !loaded}
              >
                {saving ? "Enregistrement…" : "Enregistrer la journée"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => setDate(localDateISO())}
              >
                Aujourd&apos;hui
              </Button>
            </div>
          </div>
        </DashPanel>
      </form>

      <div className="mt-6">
        <DashPanel title="Historique récent">
          {!recent.length ? (
            <p className="px-5 py-10 text-sm text-mute">
              Aucun compte-rendu enregistré.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((log) => {
                const active = log.date === date;
                return (
                  <li key={log.id}>
                    <button
                      type="button"
                      onClick={() => setDate(log.date)}
                      className={`block w-full scroll-mt-24 px-4 py-3.5 text-left transition hover:bg-surface ${
                        active ? "bg-surface" : ""
                      }`}
                    >
                      <p className="font-medium text-mist">
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
      </div>
    </AppShell>
  );
}
