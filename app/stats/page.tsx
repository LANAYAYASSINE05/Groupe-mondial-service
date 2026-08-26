"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DashPanel, DashTable, KpiTile } from "@/components/DashWidgets";
import { StatusBadge } from "@/components/StatusBadge";
import {
  api,
  ApiError,
  formatDate,
  formTypeLabel,
  type Control,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

type MineStats = {
  total: number;
  anomalies: number;
  audit: number;
  passager: number;
  recent: Control[];
};

export default function StatsPage() {
  const [stats, setStats] = useState<MineStats | null>(null);
  const { push } = useToast();

  useEffect(() => {
    api<{ stats: MineStats }>("/api/stats/mine")
      .then((d) => setStats(d.stats))
      .catch((err) =>
        push(
          err instanceof ApiError ? err.message : "Chargement impossible.",
          "error"
        )
      );
  }, [push]);

  const rate =
    stats && stats.total > 0
      ? Math.round((stats.anomalies / stats.total) * 100)
      : 0;

  return (
    <AppShell title="Statistiques">
      <div className="mb-6">
        <p className="gms-eyebrow">Analyse</p>
        <h2 className="mt-1 font-display text-2xl text-mist">
          Mes statistiques
        </h2>
        <p className="mt-1 text-sm text-mute">
          Indicateurs personnels sur la période disponible.
        </p>
      </div>

      {!stats ? (
        <p className="text-mute">Chargement…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiTile label="Total" value={stats.total} />
            <KpiTile label="Anomalies" value={stats.anomalies} tone="alert" />
            <KpiTile label="Taux anomalie" value={`${rate} %`} />
            <KpiTile label="Audits" value={stats.audit} />
            <KpiTile label="Passagers" value={stats.passager} />
          </div>

          <div className="mt-6">
            <DashPanel title="Activité récente">
              {stats.recent.length === 0 ? (
                <p className="px-5 py-10 text-sm text-mute">
                  Pas encore de contrôle.
                </p>
              ) : (
                <DashTable
                  columns={["Date", "Site", "Formulaire", "Statut", ""]}
                >
                  {stats.recent.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-line hover:bg-surface"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 text-mute">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-mist">
                        {c.establishment?.name}
                      </td>
                      <td className="px-4 py-3.5 text-mute">
                        {formTypeLabel(c.formType)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge tone={c.anomaly ? "alert" : "ok"}>
                          {c.anomaly ? "Anomalie" : "OK"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/controls/${c.id}`}
                          className="text-xs text-gold hover:underline"
                        >
                          Détail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </DashTable>
              )}
            </DashPanel>
          </div>
        </>
      )}
    </AppShell>
  );
}
