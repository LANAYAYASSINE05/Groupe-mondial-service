"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { FieldLabel, Input } from "@/components/Field";
import { planReportTone } from "@/components/WeekBoard";
import {
  api,
  ApiError,
  effectivePlanDate,
  formatDate,
  formatDayHeading,
  isPlanRescheduled,
  localDateISO,
  type PlannedControl,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

function RescheduleInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { push } = useToast();
  const planId = search.get("planId") || "";
  const [plan, setPlan] = useState<PlannedControl | null>(null);
  const [newDate, setNewDate] = useState(localDateISO());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!planId) {
      router.replace("/planning");
      return;
    }
    api<{ plan: PlannedControl }>(`/api/planning/${planId}`)
      .then((d) => {
        if (d.plan.controlId) {
          push("Ce créneau est déjà terminé.", "error");
          router.replace("/planning");
          return;
        }
        setPlan(d.plan);
        setNewDate(effectivePlanDate(d.plan));
      })
      .catch((err) => {
        push(
          err instanceof ApiError ? err.message : "Créneau introuvable.",
          "error"
        );
        router.replace("/planning");
      });
  }, [planId, push, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!planId || !newDate) return;
    setBusy(true);
    try {
      await api(`/api/planning/${planId}`, {
        method: "PATCH",
        body: JSON.stringify({ reportedAt: newDate }),
      });
      push("Reportation enregistrée. L’admin la verra sur le planning.");
      router.push("/planning");
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Reportation impossible.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  if (!plan) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="gms-pillars" aria-label="Chargement">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  const rescheduled = isPlanRescheduled(plan);

  return (
    <div className="mx-auto max-w-lg">
      <p className="gms-eyebrow">Planning</p>
      <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-mist sm:text-2xl">
        Reporter le contrôle
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        Choisissez une nouvelle date. Aucune checklist ici — vous la remplirez
        le jour où vous effectuez réellement le contrôle.
      </p>

      <div className={`mt-6 border px-4 py-3 ${planReportTone()}`}>
        <p className="font-display text-[0.62rem] uppercase tracking-[0.14em]">
          Créneau planifié
        </p>
        <p className="mt-1 font-medium text-mist">{plan.establishment.name}</p>
        <p className="text-sm text-mute">
          Planifié le {formatDate(plan.plannedAt)}
          {plan.clientName ? ` · ${plan.clientName}` : ""}
        </p>
        {rescheduled && plan.reportedAt ? (
          <p className="mt-1 text-xs font-medium">
            Déjà reporté au {formatDayHeading(localDateISO(new Date(plan.reportedAt)))}
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div>
          <FieldLabel htmlFor="new-date">Nouvelle date *</FieldLabel>
          <Input
            id="new-date"
            type="date"
            required
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="min-h-11"
          />
          <p className="mt-1.5 text-xs text-mute">
            Le contrôle (Audit ou Passager + checklist) ne sera disponible que
            ce jour-là.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row">
          <Button
            type="submit"
            className="min-h-11 flex-1"
            disabled={busy}
          >
            {busy ? "Enregistrement…" : "Confirmer la reportation"}
          </Button>
          <Link
            href="/planning"
            className="gms-btn-ghost inline-flex min-h-11 flex-1 items-center justify-center px-5 text-center"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ReschedulePage() {
  return (
    <AppShell title="Reporter le contrôle">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="gms-pillars" aria-label="Chargement">
              <span />
              <span />
              <span />
            </div>
          </div>
        }
      >
        <RescheduleInner />
      </Suspense>
    </AppShell>
  );
}
