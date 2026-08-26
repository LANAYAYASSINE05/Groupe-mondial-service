"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DashPanel, DashTable, KpiTile, ControlCards, PageToolbar } from "@/components/DashWidgets";
import { QuickActionList } from "@/components/QuickActionList";
import {
  IconChart,
  IconClipboard,
  IconHistory,
  IconPlus,
  IconUser,
} from "@/components/Icons";
import { FormTypeBadge } from "@/components/FormTypeBadge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  api,
  formatDate,
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
      <PageToolbar
        eyebrow="Espace contrôleur"
        title={user?.name ?? "Tableau de bord"}
        description="Synthèse de vos contrôles terrain."
      >
        <Link href="/controls/new">
          <Button className="min-h-11 w-full sm:w-auto">
            <IconPlus className="h-4 w-4" />
            Nouveau contrôle
          </Button>
        </Link>
      </PageToolbar>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <KpiTile label="Contrôles" value={stats?.total ?? "—"} />
        <KpiTile
          label="Anomalies"
          value={stats?.anomalies ?? "—"}
          tone="alert"
        />
        <KpiTile label="Conformes" value={stats ? conformes : "—"} tone="ok" />
        <KpiTile label="Audits" value={stats?.audit ?? "—"} tone="audit" />
        <KpiTile
          label="Passagers"
          value={stats?.passager ?? "—"}
          tone="passager"
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
              stacked={
                <ControlCards
                  controls={stats.recent}
                  linkLabel="Détail"
                />
              }
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
