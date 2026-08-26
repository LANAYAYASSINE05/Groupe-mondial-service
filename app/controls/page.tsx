"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Select } from "@/components/Field";
import { DashPanel, DashTable, KpiTile, ControlCards, PageToolbar } from "@/components/DashWidgets";
import { FormTypeBadge } from "@/components/FormTypeBadge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  api,
  ApiError,
  formatDate,
  type Control,
  type FormType,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

export default function MyControlsPage() {
  const [controls, setControls] = useState<Control[]>([]);
  const [filter, setFilter] = useState<"all" | FormType | "anomaly">("all");
  const { push } = useToast();

  useEffect(() => {
    api<{ controls: Control[] }>("/api/controls/mine")
      .then((d) => setControls(d.controls))
      .catch((err) =>
        push(
          err instanceof ApiError ? err.message : "Chargement impossible.",
          "error"
        )
      );
  }, [push]);

  const filtered = useMemo(() => {
    if (filter === "all") return controls;
    if (filter === "anomaly") return controls.filter((c) => c.anomaly);
    return controls.filter((c) => c.formType === filter);
  }, [controls, filter]);

  const anomalies = controls.filter((c) => c.anomaly).length;

  return (
    <AppShell title="Historique">
      <PageToolbar
        eyebrow="Opérations"
        title="Historique des contrôles"
      >
        <Link href="/controls/new">
          <Button className="min-h-11 w-full sm:w-auto">Nouveau contrôle</Button>
        </Link>
      </PageToolbar>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiTile label="Total" value={controls.length} />
        <KpiTile label="Anomalies" value={anomalies} tone="alert" />
        <KpiTile
          label="Affichés"
          value={filtered.length}
          hint="Selon le filtre actif"
        />
      </div>

      <DashPanel
        title="Liste"
        action={
          <Select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | FormType | "anomaly")
            }
            className="min-h-9 w-full max-w-[12rem] border-0 bg-white py-1 text-xs text-ink sm:w-auto"
            aria-label="Filtrer"
          >
            <option value="all">Tous</option>
            <option value="audit">Audit</option>
            <option value="passager">Passager</option>
            <option value="anomaly">Anomalies</option>
          </Select>
        }
      >
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-mute">
            Aucun contrôle pour ce filtre.
          </p>
        ) : (
          <DashTable
            columns={["Date", "Établissement", "Formulaire", "Statut", ""]}
            stacked={<ControlCards controls={filtered} linkLabel="Ouvrir" />}
          >
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="border-b border-line hover:bg-surface"
              >
                <td className="whitespace-nowrap px-4 py-3.5 text-mute">
                  {formatDate(c.createdAt)}
                </td>
                <td className="px-4 py-3.5 text-mist">
                  {c.establishment?.name ?? "—"}
                </td>
                <td className="px-4 py-3.5">
                  <FormTypeBadge formType={c.formType} />
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge tone={c.anomaly ? "alert" : "ok"}>
                    {c.anomaly ? "Anomalie" : "Conforme"}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/controls/${c.id}`}
                    className="text-xs text-gold hover:underline"
                  >
                    Ouvrir
                  </Link>
                </td>
              </tr>
            ))}
          </DashTable>
        )}
      </DashPanel>
    </AppShell>
  );
}
