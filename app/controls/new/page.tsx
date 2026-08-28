"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { IconPassager, IconShield } from "@/components/Icons";
import {
  api,
  formTypeLabel,
  formatDate,
  type FormType,
  type PlannedControl,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

const OPTIONS: {
  value: FormType;
  icon: typeof IconShield;
  points: number;
  description: string;
  selectedClass: string;
  iconSelectedClass: string;
  accentClass: string;
}[] = [
  {
    value: "audit",
    icon: IconShield,
    points: 22,
    description:
      "Contrôle complet du site — chaque point en Conforme ou Non conforme, avec explication.",
    selectedClass:
      "border-audit bg-audit/8 shadow-[inset_3px_0_0_0_#8D2A26]",
    iconSelectedClass: "border-audit bg-audit text-white",
    accentClass: "text-audit",
  },
  {
    value: "passager",
    icon: IconPassager,
    points: 7,
    description:
      "Contrôle allégé — 7 points obligatoires + explication en fin de visite.",
    selectedClass:
      "border-passager bg-passager/8 shadow-[inset_3px_0_0_0_#1A6F9A]",
    iconSelectedClass: "border-passager bg-passager text-white",
    accentClass: "text-passager",
  },
];

function NewControlChoiceInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { push } = useToast();
  const planId = search.get("planId") || "";
  const [formType, setFormType] = useState<FormType | "">("");
  const [plan, setPlan] = useState<PlannedControl | null>(null);

  useEffect(() => {
    if (!planId) {
      setPlan(null);
      return;
    }
    api<{ plan: PlannedControl }>(`/api/planning/${planId}`)
      .then((d) => setPlan(d.plan))
      .catch((err) => {
        push(
          err instanceof Error ? err.message : "Créneau introuvable.",
          "error"
        );
      });
  }, [planId, push]);

  function onContinue(e: FormEvent) {
    e.preventDefault();
    if (formType !== "audit" && formType !== "passager") {
      push("Choisissez Audit ou Passager pour continuer.", "error");
      return;
    }
    const q = planId ? `?planId=${encodeURIComponent(planId)}` : "";
    router.push(`/controls/new/${formType}${q}`);
  }

  return (
    <AppShell title="Nouveau contrôle">
      <div className="mx-auto max-w-2xl">
        <p className="gms-eyebrow">Étape 1 · Type</p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-mist sm:text-3xl">
          Quel contrôle effectuez-vous ?
        </h2>
        {plan ? (
          <div className="mt-4 border border-gold/30 bg-gold/5 px-4 py-3">
            <p className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-gold">
              Reportation du créneau planifié
            </p>
            <p className="mt-1 font-medium text-mist">
              {plan.establishment.name}
            </p>
            <p className="text-sm text-mute">
              {formatDate(plan.plannedAt)}
              {plan.clientName ? ` · ${plan.clientName}` : ""}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-mute">
            Sélectionnez le formulaire adapté à votre visite. Ce choix est
            obligatoire avant d&apos;ouvrir la checklist.
          </p>
        )}

        <form onSubmit={onContinue} className="mt-10">
          <fieldset>
            <legend className="sr-only">Type de contrôle</legend>
            <div
              role="radiogroup"
              aria-label="Type de contrôle"
              className="grid gap-4 sm:grid-cols-2"
            >
              {OPTIONS.map(
                ({
                  value,
                  icon: Icon,
                  points,
                  description,
                  selectedClass,
                  iconSelectedClass,
                  accentClass,
                }) => {
                const selected = formType === value;
                return (
                  <label
                    key={value}
                    className={`group relative flex cursor-pointer flex-col border p-5 transition duration-brand sm:p-6 ${
                      selected
                        ? selectedClass
                        : "border-line bg-white hover:border-brand/35 hover:bg-surface/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="formType"
                      value={value}
                      checked={selected}
                      onChange={() => setFormType(value)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`flex h-11 w-11 items-center justify-center border ${
                          selected
                            ? iconSelectedClass
                            : "border-line bg-surface text-mist"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span
                        className={`font-display text-[0.62rem] uppercase tracking-[0.14em] ${
                          selected ? accentClass : "text-mute"
                        }`}
                      >
                        {points} points
                      </span>
                    </div>
                    <p
                      className={`mt-5 font-display text-lg font-semibold ${
                        selected ? accentClass : "text-mist"
                      }`}
                    >
                      {formTypeLabel(value)}
                    </p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">
                      {description}
                    </p>
                    <span
                      className={`mt-5 inline-flex items-center gap-2 font-display text-[0.65rem] uppercase tracking-[0.12em] ${
                        selected ? accentClass : "text-na group-hover:text-mute"
                      }`}
                      aria-hidden
                    >
                      <span
                        className={`h-2 w-2 rounded-full border ${
                          selected
                            ? `${value === "audit" ? "border-audit bg-audit" : "border-passager bg-passager"}`
                            : "border-line bg-white"
                        }`}
                      />
                      {selected ? "Sélectionné" : "Choisir"}
                    </span>
                  </label>
                );
              }
              )}
            </div>
          </fieldset>

          <div className="mt-8 border-t border-line pt-8">
            <Button
              type="submit"
              className="min-h-14 w-full text-base"
              disabled={!formType}
            >
              Continuer vers la checklist
            </Button>
            {!formType && (
              <p className="mt-3 text-center text-xs text-mute">
                Sélectionnez Audit ou Passager pour continuer.
              </p>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default function NewControlChoicePage() {
  return (
    <Suspense
      fallback={
        <AppShell title="Nouveau contrôle">
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="gms-pillars" aria-label="Chargement">
              <span />
              <span />
              <span />
            </div>
          </div>
        </AppShell>
      }
    >
      <NewControlChoiceInner />
    </Suspense>
  );
}
