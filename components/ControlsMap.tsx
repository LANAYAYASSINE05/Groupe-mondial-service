"use client";

import { useEffect, useMemo, useRef } from "react";
import type { LayerGroup, Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FormType } from "@/lib/api-client";
import { FORM_TYPE_HEX, formTypeLabel } from "@/lib/api-client";

export type MapSite = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  geoRadiusMeters: number;
};

export type MapControlPoint = {
  id: string;
  latitude: number;
  longitude: number;
  hasGps: boolean;
  geoVerified: boolean;
  formType: FormType;
  anomaly: boolean;
  createdAt: string;
  siteId: string;
  siteName: string;
  controllerName: string;
};

type ControlsMapProps = {
  sites: MapSite[];
  controls: MapControlPoint[];
  geoOnly: boolean;
  className?: string;
  mapClassName?: string;
};

export function ControlsMap({
  sites,
  controls,
  geoOnly,
  className = "",
  mapClassName = "h-[min(420px,55vh)]",
}: ControlsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  const visibleControls = useMemo(
    () => (geoOnly ? controls.filter((c) => c.hasGps) : controls),
    [controls, geoOnly]
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          scrollWheelZoom: true,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      const group = layerRef.current!;
      group.clearLayers();

      for (const site of sites) {
        L.circle([site.latitude, site.longitude], {
          radius: site.geoRadiusMeters,
          color: "#8D2A26",
          fillColor: "#D13A34",
          fillOpacity: 0.08,
          weight: 1,
        })
          .bindPopup(`<strong>${site.name}</strong><br/>${site.address || ""}`)
          .addTo(group);

        L.circleMarker([site.latitude, site.longitude], {
          radius: 6,
          color: "#D13A34",
          fillColor: "#D13A34",
          fillOpacity: 1,
          weight: 2,
        })
          .bindPopup(`<strong>Site · ${site.name}</strong>`)
          .addTo(group);
      }

      for (const c of visibleControls) {
        const fill = FORM_TYPE_HEX[c.formType];
        const color = c.anomaly ? "#D13A34" : fill;
        L.circleMarker([c.latitude, c.longitude], {
          radius: c.hasGps ? 8 : 5,
          color,
          fillColor: fill,
          fillOpacity: c.hasGps ? 0.95 : 0.45,
          weight: c.anomaly ? 3 : 2,
        })
          .bindPopup(
            `<strong>${formTypeLabel(c.formType)}</strong> · ${c.siteName}<br/>` +
              `${c.controllerName}<br/>` +
              `${c.hasGps ? "GPS contrôle" : "Position site"}<br/>` +
              `<a href="/controls/${c.id}">Voir le détail</a>`
          )
          .addTo(group);
      }

      const points: [number, number][] = [
        ...sites.map((s) => [s.latitude, s.longitude] as [number, number]),
        ...visibleControls.map(
          (c) => [c.latitude, c.longitude] as [number, number]
        ),
      ];

      if (points.length > 0 && mapRef.current) {
        mapRef.current.fitBounds(L.latLngBounds(points).pad(0.12));
      } else if (mapRef.current) {
        mapRef.current.setView([33.5731, -7.5898], 11);
      }
    }

    init().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [sites, visibleControls]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className={`${mapClassName} w-full rounded-sm border border-line bg-surface`}
        aria-label="Carte des contrôles"
      />
      <div className="mt-3 flex flex-wrap gap-4 text-[0.65rem] uppercase tracking-[0.12em] text-mute">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-brand bg-white" />
          Site
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-audit" />
          Contrôle audit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-passager" />
          Contrôle passager
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-light" />
          Anomalie
        </span>
        {!geoOnly ? (
          <span className="text-mute/80">Points semi-transparents = site sans GPS contrôle</span>
        ) : null}
      </div>
    </div>
  );
}

export function GeoCheckbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line/80 bg-surface/40 px-3 py-2.5 transition hover:border-brand/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
      />
      <span>
        <span className="block text-sm font-medium text-mist">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-mute">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}
