"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DashPanel, DashTable, KpiTile } from "@/components/DashWidgets";
import { HistogramChart, type HistogramBar } from "@/components/HistogramChart";
import { DonutChart } from "@/components/DonutChart";
import { QuickActionList } from "@/components/QuickActionList";
import {
  IconBuilding,
  IconCalendar,
  IconReport,
  IconUsers,
  IconClipboard,
  IconMapPin,
} from "@/components/Icons";
import { FormTypeBadge } from "@/components/FormTypeBadge";
import { api, ApiError, formatDate, type Control } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";

type FormBreakdown = {
  total: number;
  anomalies: number;
  bySite: {
    establishmentId: string;
    name: string;
    total: number;
    anomalies: number;
  }[];
  byController: {
    userId: string;
    name: string;
    total: number;
    anomalies: number;
  }[];
  byMonth: {
    month: string;
    label: string;
    total: number;
    anomalies: number;
  }[];
};

type ReportKpis = {
  total: number;
  anomalies: number;
  audit: number;
  passager: number;
  unvisitedSites: { id: string; name: string }[];
};

type ReportSummaries = {
  byMonth: FormBreakdown["byMonth"];
  byFormType: {
    audit: FormBreakdown;
    passager: FormBreakdown;
  };
};

function formTypeBars(
  breakdown: FormBreakdown | undefined,
  tone: HistogramBar["tone"]
): HistogramBar[] {
  if (!breakdown || breakdown.total === 0) return [];

  const bars: HistogramBar[] = [
    {
      label: "Total",
      value: breakdown.total,
      secondary: breakdown.anomalies,
      tone,
    },
  ];

  for (const m of breakdown.byMonth) {
    bars.push({
      label: m.label,
      value: m.total,
      secondary: m.anomalies,
      tone,
    });
  }

  for (const s of [...breakdown.bySite]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)) {
    bars.push({
      label: s.name,
      value: s.total,
      secondary: s.anomalies,
      tone,
    });
  }

  return bars;
}

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<ReportKpis | null>(null);
  const [summaries, setSummaries] = useState<ReportSummaries | null>(null);
  const [recent, setRecent] = useState<Control[]>([]);
  const [gpsCount, setGpsCount] = useState<{ withGps: number; total: number } | null>(
    null
  );
  const { push } = useToast();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    api<{
      kpis: ReportKpis;
      controls: Control[];
      summaries: ReportSummaries;
    }>("/api/reports")
      .then((report) => {
        if (cancelled) return;
        setKpis(report.kpis);
        setSummaries(report.summaries);
        const list = report.controls || [];
        setRecent(list.slice(0, 8));
        setGpsCount({
          withGps: list.filter((c) => c.latitude != null && c.longitude != null)
            .length,
          total: list.length,
        });
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

  const conformiteBars = useMemo<HistogramBar[]>(() => {
    if (!kpis) return [];

    const conformes = Math.max(0, kpis.total - kpis.anomalies);
    const bars: HistogramBar[] = [
      { label: "Conformes", value: conformes, tone: "ok" },
      { label: "Anomalies", value: kpis.anomalies, tone: "alert" },
    ];

    for (const m of summaries?.byMonth ?? []) {
      bars.push({
        label: m.label,
        value: Math.max(0, m.total - m.anomalies),
        secondary: m.anomalies,
        tone: "default",
      });
    }

    return bars;
  }, [kpis, summaries]);

  const auditBars = useMemo(
    () => formTypeBars(summaries?.byFormType.audit, "audit"),
    [summaries]
  );

  const passagerBars = useMemo(
    () => formTypeBars(summaries?.byFormType.passager, "passager"),
    [summaries]
  );

  return (
    <AppShell requireAdmin title="Administration">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="gms-eyebrow">Pilotage</p>
          <h2 className="mt-1 font-display text-2xl text-mist">
            Tableau de bord admin
          </h2>
          <p className="mt-1 text-sm text-mute">
            Vue consolidée des contrôles, sites et anomalies.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/map">
            <Button className="min-h-11">
              <IconMapPin className="h-4 w-4" />
              Carte
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button variant="secondary" className="min-h-11">
              <IconReport className="h-4 w-4" />
              Rapports
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="min-h-11">
              <IconUsers className="h-4 w-4" />
              Comptes
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiTile label="Contrôles" value={kpis?.total ?? "—"} />
        <KpiTile
          label="Anomalies"
          value={kpis?.anomalies ?? "—"}
          tone="alert"
        />
        <KpiTile label="Audits" value={kpis?.audit ?? "—"} tone="audit" />
        <KpiTile label="Passagers" value={kpis?.passager ?? "—"} tone="passager" />
        <KpiTile
          label="Avec GPS"
          value={
            gpsCount ? `${gpsCount.withGps} / ${gpsCount.total}` : "—"
          }
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="gms-eyebrow">Statistiques</p>
            <h3 className="mt-1 font-display text-lg text-mist">
              Répartition circulaire
            </h3>
            <p className="mt-1 text-sm text-mute">
              Vue globale conformité, types de contrôle et anomalies.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <DashPanel title="Conformité">
            <DonutChart
              slices={[
                {
                  label: "Conformes",
                  value: Math.max(0, (kpis?.total ?? 0) - (kpis?.anomalies ?? 0)),
                  color: "#3d8f6e",
                },
                {
                  label: "Anomalies",
                  value: kpis?.anomalies ?? 0,
                  color: "#D13A34",
                },
              ]}
              centerValue={
                kpis && kpis.total > 0
                  ? `${Math.round(((kpis.total - kpis.anomalies) / kpis.total) * 100)} %`
                  : "—"
              }
              centerLabel="conformes"
              emptyLabel="Aucun contrôle enregistré."
            />
          </DashPanel>
          <DashPanel title="Type de contrôle">
            <DonutChart
              slices={[
                {
                  label: "Audit",
                  value: kpis?.audit ?? 0,
                  color: "#8D2A26",
                },
                {
                  label: "Passager",
                  value: kpis?.passager ?? 0,
                  color: "#1A6F9A",
                },
              ]}
              centerValue={String(kpis?.total ?? 0)}
              centerLabel="contrôles"
              emptyLabel="Aucun contrôle enregistré."
            />
          </DashPanel>
          <DashPanel title="Anomalies">
            <DonutChart
              slices={[
                {
                  label: "Audit",
                  value: summaries?.byFormType?.audit?.anomalies ?? 0,
                  color: "#8D2A26",
                },
                {
                  label: "Passager",
                  value: summaries?.byFormType?.passager?.anomalies ?? 0,
                  color: "#1A6F9A",
                },
              ]}
              centerValue={String(kpis?.anomalies ?? 0)}
              centerLabel="écarts"
              emptyLabel="Aucune anomalie."
            />
          </DashPanel>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="gms-eyebrow">Statistiques</p>
            <h3 className="mt-1 font-display text-lg text-mist">
              Histogrammes des rapports
            </h3>
            <p className="mt-1 text-sm text-mute">
              Données mises à jour automatiquement depuis la base.
            </p>
          </div>
          <Link
            href="/admin/reports"
            className="font-display text-[0.65rem] uppercase tracking-label text-gold hover:underline"
          >
            Voir les rapports
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <DashPanel title="Conformité">
            <HistogramChart
              bars={conformiteBars}
              valueLabel="Conformes"
              secondaryLabel="Anomalies"
              maxBars={12}
              emptyLabel="Aucun contrôle enregistré."
            />
          </DashPanel>
          <DashPanel title="Audit">
            <HistogramChart
              bars={auditBars}
              valueLabel="Contrôles audit"
              secondaryLabel="Anomalies"
              maxBars={12}
              emptyLabel="Aucun contrôle audit."
            />
          </DashPanel>
          <DashPanel title="Passager">
            <HistogramChart
              bars={passagerBars}
              valueLabel="Contrôles passager"
              secondaryLabel="Anomalies"
              maxBars={12}
              emptyLabel="Aucun contrôle passager."
            />
          </DashPanel>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_280px]">
        <DashPanel
          title="Contrôles récents"
          action={
            <Link
              href="/admin/reports"
              className="font-display text-[0.65rem] uppercase tracking-label text-gold"
            >
              Rapports
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-sm text-mute">Aucune donnée.</p>
          ) : (
            <DashTable
              columns={["Date", "Site", "Contrôleur", "Type", "GPS", "Anomalie"]}
            >
              {recent.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-line hover:bg-surface"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-mute">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-mist">
                    <Link
                      href={`/controls/${c.id}`}
                      className="hover:text-gold"
                    >
                      {c.establishment?.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-mute">{c.user?.name}</td>
                  <td className="px-4 py-3">
                    <FormTypeBadge formType={c.formType} />
                  </td>
                  <td className="px-4 py-3">
                    {c.latitude != null && c.longitude != null ? (
                      <span className="text-ok">Oui</span>
                    ) : (
                      <span className="text-mute">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.anomaly ? (
                      <span className="text-brand-light">Oui</span>
                    ) : (
                      <span className="text-ok">Non</span>
                    )}
                  </td>
                </tr>
              ))}
            </DashTable>
          )}
        </DashPanel>

        <div className="space-y-4">
          <DashPanel title="Actions rapides">
            <QuickActionList
              actions={[
                {
                  href: "/admin/map",
                  label: "Carte des contrôles",
                  icon: IconMapPin,
                },
                {
                  href: "/admin/planning",
                  label: "Planning hebdomadaire",
                  icon: IconCalendar,
                },
                {
                  href: "/admin/reports",
                  label: "Rapports et exports",
                  icon: IconReport,
                },
                {
                  href: "/admin/users",
                  label: "Gérer les comptes",
                  icon: IconUsers,
                },
                {
                  href: "/admin/establishments",
                  label: "Gérer les sites",
                  icon: IconBuilding,
                },
                {
                  href: "/controls/new",
                  label: "Nouveau contrôle terrain",
                  icon: IconClipboard,
                },
              ]}
            />
          </DashPanel>

          <DashPanel title="Sites non visités">
          {!kpis?.unvisitedSites?.length ? (
            <p className="px-5 py-10 text-sm text-mute">
              Tous les sites actifs ont été visités (filtre courant).
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {kpis.unvisitedSites.map((s) => (
                <li
                  key={s.id}
                  className="border-b border-line px-5 py-3 text-sm text-mist last:border-0"
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
          </DashPanel>
        </div>
      </div>
    </AppShell>
  );
}
