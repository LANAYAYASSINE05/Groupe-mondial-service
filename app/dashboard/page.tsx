"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DashPanel, DashTable, KpiTile } from "@/components/DashWidgets";
import { QuickActionList } from "@/components/QuickActionList";
import {
  IconChart,
  IconClipboard,
  IconHistory,
  IconPlus,
  IconUser,
} from "@/components/Icons";
import { StatusBadge } from "@/components/StatusBadge";
import {
  api,
  formatDate,
  formTypeLabel,
  type Control,
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type MineStats = {
  total: number;
  anomalies: number;
  audit: number;
  passager: number;
  recent: Control[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MineStats | null>(null);

  useEffect(() => {
    if (!user) return;
    api<{ stats: MineStats }>("/api/stats/mine")
      .then((d) => setStats(d.stats))
      .catch(() => {});
  }, [user]);

  const conformes = stats
    ? Math.max(0, stats.total - stats.anomalies)
    : 0;

  return (
    <AppShell title="Tableau de bord">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="gms-eyebrow">Espace contrôleur</p>
          <h2 className="mt-1 font-display text-2xl text-mist">
            {user?.name ?? "Tableau de bord"}
          </h2>
          <p className="mt-1 text-sm text-mute">
            Synthèse de vos contrôles terrain.
          </p>
        </div>
        <Link href="/controls/new">
          <Button className="min-h-11">
            <IconPlus className="h-4 w-4" />
            Nouveau contrôle
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Contrôles" value={stats?.total ?? "—"} />
        <KpiTile
          label="Anomalies"
          value={stats?.anomalies ?? "—"}
          tone="alert"
        />
        <KpiTile label="Conformes" value={stats ? conformes : "—"} tone="ok" />
        <KpiTile
          label="Audit / Passager"
          value={
            stats ? `${stats.audit} / ${stats.passager}` : "—"
          }
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_280px]">
        <DashPanel
          title="Derniers contrôles"
          action={
            <Link
              href="/controls"
              className="font-display text-[0.65rem] uppercase tracking-label text-gold hover:underline"
            >
              Tout voir
            </Link>
          }
        >
          {!stats?.recent?.length ? (
            <p className="px-5 py-10 text-sm text-mute">
              Aucun contrôle enregistré.
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
                    {c.establishment?.name ?? "—"}
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

        <DashPanel title="Actions rapides">
          <QuickActionList
            actions={[
              {
                href: "/controls/new",
                label: "Lancer un contrôle",
                icon: IconClipboard,
              },
              {
                href: "/controls",
                label: "Consulter l'historique",
                icon: IconHistory,
              },
              {
                href: "/stats",
                label: "Voir les statistiques",
                icon: IconChart,
              },
              { href: "/profile", label: "Mon profil", icon: IconUser },
            ]}
          />
        </DashPanel>
      </div>
    </AppShell>
  );
}
