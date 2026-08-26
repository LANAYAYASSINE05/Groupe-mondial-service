"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DashPanel, DashTable, KpiTile } from "@/components/DashWidgets";
import { FormTypeBadge } from "@/components/FormTypeBadge";
import { DonutChart } from "@/components/DonutChart";
import { StatusBadge } from "@/components/StatusBadge";
import {
  api,
  ApiError,
  formatDate,
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
            <KpiTile label="Audits" value={stats.audit} tone="audit" />
            <KpiTile label="Passagers" value={stats.passager} tone="passager" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <DashPanel title="Conformité">
              <DonutChart
                slices={[
                  {
                    label: "Conformes",
                    value: Math.max(0, stats.total - stats.anomalies),
                    color: "#3d8f6e",
                  },
                  {
                    label: "Anomalies",
                    value: stats.anomalies,
                    color: "#D13A34",
                  },
                ]}
                centerValue={
                  stats.total > 0
                    ? `${Math.round(((stats.total - stats.anomalies) / stats.total) * 100)} %`
                    : "—"
                }
                centerLabel="conformes"
              />
            </DashPanel>
            <DashPanel title="Type de contrôle">
              <DonutChart
                slices={[
                  {
                    label: "Audit",
                    value: stats.audit,
                    color: "#8D2A26",
                  },
                  {
                    label: "Passager",
                    value: stats.passager,
                    color: "#1A6F9A",
                  },
                ]}
                centerValue={String(stats.total)}
                centerLabel="contrôles"
              />
            </DashPanel>
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
                      <td className="px-4 py-3.5">
                        <FormTypeBadge formType={c.formType} />
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
