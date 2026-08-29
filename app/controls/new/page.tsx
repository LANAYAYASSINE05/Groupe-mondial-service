"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { IconPassager, IconShield } from "@/components/Icons";
import { formTypeLabel, type FormType } from "@/lib/api-client";
import { useToast } from "@/lib/toast";

const OPTIONS: {
  value: FormType;
  icon: typeof IconShield;
  points: number;
  description: string;
}[] = [
  {
    value: "audit",
    icon: IconShield,
    points: 22,
    description:
      "Contrôle complet du site — chaque point en Conforme ou Non conforme, avec explication.",
  },
  {
    value: "passager",
    icon: IconPassager,
    points: 7,
    description:
      "Contrôle allégé — 7 points obligatoires + explication en fin de visite.",
  },
];

export default function NewControlChoicePage() {
  const router = useRouter();
  const { push } = useToast();
  const [formType, setFormType] = useState<FormType | "">("");

  function onContinue(e: FormEvent) {
    e.preventDefault();
    if (formType !== "audit" && formType !== "passager") {
      push("Choisissez Audit ou Passager pour continuer.", "error");
      return;
    }
    router.push(`/controls/new/${formType}`);
  }

  return (
    <AppShell title="Nouveau contrôle">
      <div className="mx-auto max-w-2xl">
        <p className="gms-eyebrow">Étape 1 · Type</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-mist sm:text-3xl">
          Quel contrôle effectuez-vous ?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          Sélectionnez le formulaire adapté à votre visite. Ce choix est
          obligatoire avant d&apos;ouvrir la checklist.
        </p>

        <form onSubmit={onContinue} className="mt-10">
          <fieldset>
            <legend className="sr-only">Type de contrôle</legend>
            <div
              role="radiogroup"
              aria-label="Type de contrôle"
              className="grid gap-4 sm:grid-cols-2"
            >
              {OPTIONS.map(({ value, icon: Icon, points, description }) => {
                const selected = formType === value;
                return (
                  <label
                    key={value}
                    className={`group relative flex cursor-pointer flex-col border p-6 transition duration-brand ${
                      selected
                        ? "border-brand bg-brand/8 shadow-[inset_3px_0_0_0_#D13A34]"
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
                            ? "border-brand bg-brand text-white"
                            : "border-line bg-surface text-brand"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span
                        className={`font-display text-[0.62rem] uppercase tracking-[0.14em] ${
                          selected ? "text-brand-dark" : "text-mute"
                        }`}
                      >
                        {points} points
                      </span>
                    </div>
                    <p
                      className={`mt-5 font-display text-lg font-semibold ${
                        selected ? "text-brand-dark" : "text-mist"
                      }`}
                    >
                      {formTypeLabel(value)}
                    </p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">
                      {description}
                    </p>
                    <span
                      className={`mt-5 inline-flex items-center gap-2 font-display text-[0.65rem] uppercase tracking-[0.12em] ${
                        selected ? "text-brand" : "text-na group-hover:text-mute"
                      }`}
                      aria-hidden
                    >
                      <span
                        className={`h-2 w-2 rounded-full border ${
                          selected
                            ? "border-brand bg-brand"
                            : "border-line bg-white"
                        }`}
                      />
                      {selected ? "Sélectionné" : "Choisir"}
                    </span>
                  </label>
                );
              })}
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
