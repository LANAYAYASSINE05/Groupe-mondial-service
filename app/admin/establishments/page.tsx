"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { FieldLabel, Input } from "@/components/Field";
import { DashPanel, DashTable, KpiTile } from "@/components/DashWidgets";
import { api, ApiError, type Establishment } from "@/lib/api-client";
import { requestGeolocation } from "@/lib/geolocation";
import { useToast } from "@/lib/toast";

function formatCoords(est: Establishment) {
  if (est.latitude == null || est.longitude == null) return "—";
  return `${est.latitude.toFixed(5)}, ${est.longitude.toFixed(5)}`;
}

export default function AdminEstablishmentsPage() {
  const [list, setList] = useState<Establishment[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [geoRadiusMeters, setGeoRadiusMeters] = useState("500");
  const { push } = useToast();

  async function load() {
    const data = await api<{ establishments: Establishment[] }>(
      "/api/admin/establishments"
    );
    setList(data.establishments);
  }

  useEffect(() => {
    load().catch((err) =>
      push(
        err instanceof ApiError ? err.message : "Chargement impossible.",
        "error"
      )
    );
  }, [push]);

  async function useMyLocation() {
    try {
      const geo = await requestGeolocation();
      setLatitude(String(geo.latitude));
      setLongitude(String(geo.longitude));
      push("Coordonnées GPS remplies.");
    } catch {
      push("Impossible d'obtenir votre position.", "error");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/admin/establishments", {
        method: "POST",
        body: JSON.stringify({
          name,
          address,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          geoRadiusMeters: geoRadiusMeters ? Number(geoRadiusMeters) : 500,
        }),
      });
      setName("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      setGeoRadiusMeters("500");
      push("Site ajouté.");
      await load();
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Création impossible.",
        "error"
      );
    }
  }

  async function setSiteGps(est: Establishment) {
    try {
      const geo = await requestGeolocation();
      await api(`/api/admin/establishments/${est.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          latitude: geo.latitude,
          longitude: geo.longitude,
        }),
      });
      push(`GPS mis à jour pour « ${est.name} ».`);
      await load();
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Mise à jour GPS impossible.",
        "error"
      );
    }
  }

  async function toggleActive(est: Establishment) {
    try {
      await api(`/api/admin/establishments/${est.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !est.active }),
      });
      push(est.active ? "Site désactivé." : "Site réactivé.");
      await load();
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Mise à jour impossible.",
        "error"
      );
    }
  }

  async function onDelete(est: Establishment) {
    const ok = window.confirm(
      `Supprimer définitivement « ${est.name} » ?\nLes contrôles liés à ce site seront aussi supprimés.`
    );
    if (!ok) return;
    try {
      await api(`/api/admin/establishments/${est.id}`, { method: "DELETE" });
      push("Site supprimé.");
      await load();
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Suppression impossible.",
        "error"
      );
    }
  }

  const active = list.filter((e) => e.active).length;
  const withGps = list.filter(
    (e) => e.latitude != null && e.longitude != null
  ).length;

  return (
    <AppShell requireAdmin title="Établissements">
      <div className="mb-6">
        <p className="gms-eyebrow">Administration</p>
        <h2 className="mt-1 font-display text-2xl text-mist">
          Gestion des sites
        </h2>
        <p className="mt-1 text-sm text-mute">
          Coordonnées GPS requises pour la carte du tableau de bord.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <KpiTile label="Total sites" value={list.length} />
        <KpiTile label="Actifs" value={active} tone="ok" />
        <KpiTile label="Avec GPS" value={withGps} />
      </div>

      <div className="mb-4">
        <DashPanel title="Nouveau site">
          <form
            onSubmit={onCreate}
            className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5"
          >
            <div>
              <FieldLabel htmlFor="name">Nom</FieldLabel>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="address">Adresse</FieldLabel>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="latitude">Latitude GPS</FieldLabel>
              <Input
                id="latitude"
                inputMode="decimal"
                placeholder="33.5731"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="longitude">Longitude GPS</FieldLabel>
              <Input
                id="longitude"
                inputMode="decimal"
                placeholder="-7.5898"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="radius">Rayon (mètres)</FieldLabel>
              <Input
                id="radius"
                type="number"
                min={50}
                max={50000}
                value={geoRadiusMeters}
                onChange={(e) => setGeoRadiusMeters(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full"
                onClick={useMyLocation}
              >
                Utiliser ma position
              </Button>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="min-h-11">
                Ajouter le site
              </Button>
            </div>
          </form>
        </DashPanel>
      </div>

      <DashPanel title="Liste des établissements">
        <DashTable columns={["Nom", "Adresse", "GPS", "Statut", "Actions"]}>
          {list.map((e) => (
            <tr key={e.id} className="border-b border-line">
              <td className="px-4 py-3 text-mist">{e.name}</td>
              <td className="px-4 py-3 text-mute">{e.address || "—"}</td>
              <td className="px-4 py-3 font-mono text-xs text-mute">
                {formatCoords(e)}
              </td>
              <td className="px-4 py-3">
                <span className={e.active ? "text-ok" : "text-brand-light"}>
                  {e.active ? "Actif" : "Inactif"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="secondary"
                    className="min-h-9 text-xs"
                    onClick={() => setSiteGps(e)}
                  >
                    GPS ici
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-9 text-xs"
                    onClick={() => toggleActive(e)}
                  >
                    {e.active ? "Désactiver" : "Réactiver"}
                  </Button>
                  <Button
                    variant="danger"
                    className="min-h-9 text-xs"
                    onClick={() => onDelete(e)}
                  >
                    Supprimer
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DashTable>
      </DashPanel>
    </AppShell>
  );
}
