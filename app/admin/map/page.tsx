"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DashPanel, KpiTile } from "@/components/DashWidgets";
import {
  ControlsMap,
  GeoCheckbox,
  type MapControlPoint,
  type MapSite,
} from "@/components/ControlsMap";
import { FormTypeBadge } from "@/components/FormTypeBadge";
import {
  api,
  ApiError,
  type FormType,
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";

export default function AdminMapPage() {
  const [sites, setSites] = useState<MapSite[]>([]);
  const [controls, setControls] = useState<MapControlPoint[]>([]);
  const [stats, setStats] = useState<{
    withGps: number;
    totalControls: number;
    sitesOnMap: number;
  } | null>(null);
  const [geoOnly, setGeoOnly] = useState(false);
  const [formFilter, setFormFilter] = useState<"all" | FormType>("all");
  const { push } = useToast();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    api<{
      establishments: MapSite[];
      controls: MapControlPoint[];
      stats: { withGps: number; totalControls: number; sitesOnMap: number };
    }>("/api/reports/map")
      .then((map) => {
        if (cancelled) return;
        setSites(map.establishments);
        setControls(map.controls);
        setStats(map.stats);
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
  }, [loading, user, push]);

  const filteredControls = useMemo(() => {
    if (formFilter === "all") return controls;
    return controls.filter((c) => c.formType === formFilter);
  }, [controls, formFilter]);

  const visible = geoOnly
    ? filteredControls.filter((c) => c.hasGps)
    : filteredControls;
  const auditCount = filteredControls.filter((c) => c.formType === "audit").length;
  const passagerCount = filteredControls.filter((c) => c.formType === "passager").length;
  const anomalyCount = visible.filter((c) => c.anomaly).length;

  return (
    <AppShell requireAdmin title="Carte">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="gms-eyebrow">Analyse</p>
          <h2 className="mt-1 font-display text-xl text-mist sm:text-2xl">
            Carte des contrôles
          </h2>
          <p className="mt-1 text-sm text-mute">
            Sites, audits (rouge) et passagers (bleu) sur le terrain.
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <KpiTile label="Sites" value={stats?.sitesOnMap ?? sites.length} />
        <KpiTile
          label="Contrôles"
          value={filteredControls.length}
        />
        <KpiTile label="Audits" value={auditCount} tone="audit" />
        <KpiTile label="Passagers" value={passagerCount} tone="passager" />
        <KpiTile
          label="Avec GPS"
          value={
            stats
              ? `${visible.filter((c) => c.hasGps).length} / ${filteredControls.length}`
              : "—"
          }
        />
      </div>

      <DashPanel
        title="Cartographie"
        action={
          <span className="font-display text-[0.62rem] uppercase tracking-label text-mute">
            {anomalyCount} anomalie{anomalyCount > 1 ? "s" : ""} visible
            {anomalyCount > 1 ? "s" : ""}
          </span>
        }
      >
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            <div className="flex-1">
              <GeoCheckbox
                checked={geoOnly}
                onChange={setGeoOnly}
                label="Afficher uniquement les contrôles géolocalisés"
                hint="Décochez pour inclure aussi les points positionnés sur le site (sans GPS propre au contrôle)."
              />
            </div>
            <fieldset className="flex flex-wrap items-center gap-2 rounded-md border border-line/80 bg-surface/40 px-3 py-2.5">
              <legend className="sr-only">Type de contrôle</legend>
              {(
                [
                  ["all", "Tous"],
                  ["audit", "Audit"],
                  ["passager", "Passager"],
                ] as const
              ).map(([value, label]) => {
                const active = formFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormFilter(value)}
                    className={`rounded border px-3 py-1.5 font-display text-[0.62rem] uppercase tracking-[0.12em] transition ${
                      active
                        ? value === "audit"
                          ? "border-audit bg-audit text-white"
                          : value === "passager"
                            ? "border-passager bg-passager text-white"
                            : "border-brand bg-brand text-white"
                        : "border-line bg-white text-mute hover:text-mist"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </fieldset>
          </div>

          <div className="flex flex-wrap gap-2">
            <FormTypeBadge formType="audit" />
            <FormTypeBadge formType="passager" />
          </div>

          <ControlsMap
            sites={sites}
            controls={filteredControls}
            geoOnly={geoOnly}
            mapClassName="h-[min(52vh,380px)] sm:h-[min(64vh,560px)] lg:h-[min(72vh,760px)]"
          />
        </div>
      </DashPanel>
    </AppShell>
  );
}
