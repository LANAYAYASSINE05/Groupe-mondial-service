"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { FieldLabel, Select, Textarea } from "@/components/Field";
import { DashPanel, KpiTile } from "@/components/DashWidgets";
import { ProgressBar } from "@/components/ProgressBar";
import { StateButton } from "@/components/StateButton";
import { FormTypeBadge } from "@/components/FormTypeBadge";
import {
  api,
  ApiError,
  type ChecklistDef,
  type Establishment,
  type FormType,
  type ItemState,
} from "@/lib/api-client";
import { GeoCheckbox } from "@/components/ControlsMap";
import {
  geolocationErrorMessage,
  requestGeolocation,
} from "@/lib/geolocation";
import { useToast } from "@/lib/toast";

type DraftItem = {
  itemKey: string;
  state: ItemState | "";
  comment: string;
};

export default function ControlFormPage() {
  const params = useParams();
  const formType = params.formType as FormType;
  const router = useRouter();
  const { push } = useToast();

  const [checklist, setChecklist] = useState<ChecklistDef | null>(null);
  const [sites, setSites] = useState<Establishment[]>([]);
  const [establishmentId, setEstablishmentId] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [explanation, setExplanation] = useState("");
  const [recordGeo, setRecordGeo] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (formType !== "audit" && formType !== "passager") {
      router.replace("/controls/new");
      return;
    }
    Promise.all([
      api<ChecklistDef>(`/api/checklists/${formType}`),
      api<{ establishments: Establishment[] }>("/api/establishments"),
    ])
      .then(([cl, est]) => {
        setChecklist(cl);
        setSites(est.establishments);
        setItems(
          cl.items.map((i) => ({
            itemKey: i.key,
            state: "",
            comment: "",
          }))
        );
      })
      .catch((err) => {
        push(
          err instanceof ApiError ? err.message : "Chargement impossible.",
          "error"
        );
      });
  }, [formType, router, push]);

  const progress = useMemo(() => {
    if (!items.length) return 0;
    const filled = items.filter((i) => i.state).length;
    return Math.round((filled / items.length) * 100);
  }, [items]);

  const remaining = useMemo(
    () => items.filter((i) => !i.state).length,
    [items]
  );

  function setItemState(key: string, state: ItemState) {
    setItems((prev) =>
      prev.map((i) => (i.itemKey === key ? { ...i, state } : i))
    );
  }

  function setItemComment(key: string, comment: string) {
    setItems((prev) =>
      prev.map((i) => (i.itemKey === key ? { ...i, comment } : i))
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (progress < 100) {
      push("Complétez tous les points avant de valider.", "error");
      return;
    }
    if (!establishmentId) {
      push("Choisissez un établissement.", "error");
      return;
    }
    if (!explanation.trim()) {
      push("L'explication est obligatoire.", "error");
      return;
    }
    setBusy(true);
    try {
      let geoPayload: {
        latitude?: number;
        longitude?: number;
        accuracy?: number;
      } = {};
      if (recordGeo) {
        try {
          const geo = await requestGeolocation();
          geoPayload = {
            latitude: geo.latitude,
            longitude: geo.longitude,
            accuracy: geo.accuracy ?? undefined,
          };
        } catch (geoErr) {
          push(geolocationErrorMessage(geoErr), "error");
          setBusy(false);
          return;
        }
      }

      const data = await api<{ control: { id: string } }>("/api/controls", {
        method: "POST",
        body: JSON.stringify({
          formType,
          establishmentId,
          explanation,
          ...geoPayload,
          items: items.map((i) => ({
            itemKey: i.itemKey,
            state: i.state,
            comment: i.comment || undefined,
          })),
        }),
      });
      push("Contrôle enregistré.");
      router.push(`/controls/new/success?id=${data.control.id}`);
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Enregistrement impossible.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  if (!checklist) {
    return (
      <AppShell title="Checklist">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="gms-pillars" aria-label="Chargement">
            <span />
            <span />
            <span />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={checklist.title || "Checklist"}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <FormTypeBadge formType={formType} />
          <h2 className="mt-2 font-display text-xl text-mist sm:text-2xl">
            {checklist.title}
          </h2>
          <p className="mt-1 text-sm text-mute">
            Validation débloquée uniquement à 100 %.
          </p>
        </div>
        <Link
          href="/controls/new"
          className="text-sm text-mute underline-offset-4 hover:text-mist hover:underline"
        >
          Changer de formulaire
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiTile label="Progression" value={`${progress} %`} />
        <KpiTile
          label="Restants"
          value={remaining}
          tone={remaining > 0 ? "alert" : "ok"}
        />
        <KpiTile label="Points" value={items.length} />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <DashPanel title="Site & progression">
          <div className="space-y-4 p-4 sm:p-5">
            <div className="max-w-xl">
              <FieldLabel htmlFor="site">Établissement contrôlé *</FieldLabel>
              <Select
                id="site"
                required
                value={establishmentId}
                onChange={(e) => setEstablishmentId(e.target.value)}
                className="min-h-11"
              >
                <option value="">Sélectionner le site…</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <ProgressBar value={progress} />
          </div>
        </DashPanel>

        <DashPanel title="Checklist">
          <div className="divide-y divide-line">
            {checklist.items.map((def, idx) => {
              const draft = items[idx];
              if (!draft) return null;
              const options: { value: ItemState; label: string }[] = [
                { value: "ok", label: "Conforme" },
                { value: "no", label: "Non conforme" },
                ...(def.allowNa
                  ? [{ value: "na" as const, label: "Non applicable" }]
                  : []),
              ];

              return (
                <article key={def.key} className="p-3 sm:p-4">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 font-display text-xs tabular-nums text-brand/70">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium leading-snug text-mist">
                        {def.label}
                        <span className="ml-1 text-brand-light" title="Obligatoire">
                          *
                        </span>
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {options.map((opt) => (
                          <StateButton
                            key={opt.value}
                            value={opt.value}
                            label={opt.label}
                            active={draft.state === opt.value}
                            onSelect={() => setItemState(def.key, opt.value)}
                          />
                        ))}
                        <span className="ml-1 text-[0.62rem] text-mute">
                          {def.allowNa ? "C · NC · NA" : "C · NC (obligatoire)"}
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <FieldLabel htmlFor={`c-${def.key}`} hint="opt.">
                          Commentaire
                        </FieldLabel>
                        <Textarea
                          id={`c-${def.key}`}
                          rows={2}
                          value={draft.comment}
                          onChange={(e) =>
                            setItemComment(def.key, e.target.value)
                          }
                          placeholder="Précision terrain…"
                          className="min-h-[2.5rem] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </DashPanel>

        <DashPanel title={`${checklist.explanationLabel} *`}>
          <div className="p-4 sm:p-5">
            <Textarea
              id="explanation"
              required
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Constat, actions, propositions… (obligatoire)"
              className="min-h-32"
            />
          </div>
        </DashPanel>

        <DashPanel title="Géolocalisation">
          <div className="p-4 sm:p-5">
            <GeoCheckbox
              checked={recordGeo}
              onChange={setRecordGeo}
              label="Enregistrer la position GPS du contrôle"
              hint="Recommandé pour afficher le point sur la carte du tableau de bord admin. La localisation doit être activée sur l'appareil."
            />
          </div>
        </DashPanel>

        <div className="sticky bottom-0 z-20 -mx-3 border-t border-line bg-white/95 px-3 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pb-0 sm:backdrop-blur-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="submit"
              disabled={
                busy || progress < 100 || !establishmentId || !explanation.trim()
              }
              className="min-h-12 w-full sm:w-auto sm:min-w-[14rem]"
            >
              {busy ? "Enregistrement…" : "Valider le contrôle"}
            </Button>
            {progress < 100 && (
              <p className="text-sm text-mute">
                Complétez tous les points ({progress} %).
              </p>
            )}
          </div>
        </div>
      </form>
    </AppShell>
  );
}
