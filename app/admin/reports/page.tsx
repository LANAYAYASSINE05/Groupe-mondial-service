"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { FieldLabel, Input, Select } from "@/components/Field";
import {
  FormTypeBadge,
  TableViewToggle,
} from "@/components/FormTypeBadge";
import { DashPanel, DashTable, KpiTile } from "@/components/DashWidgets";
import { IconSearch } from "@/components/Icons";
import {
  api,
  ApiError,
  formatDate,
  getApiBaseUrl,
  getToken,
  stateLabel,
  type Control,
  type Establishment,
  type FormType,
  type User,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

type ReportData = {
  kpis: {
    total: number;
    anomalies: number;
    audit: number;
    passager: number;
    unvisitedSites: { id: string; name: string }[];
  };
  controls: Control[];
  summaries: {
    bySite: {
      establishmentId: string;
      name: string;
      total: number;
      anomalies: number;
      audit: number;
      passager: number;
    }[];
    byController: {
      userId: string;
      name: string;
      total: number;
      anomalies: number;
      audit: number;
      passager: number;
    }[];
    byItem: {
      formType: FormType;
      itemKey: string;
      label: string;
      ok: number;
      no: number;
      na: number;
    }[];
  };
};

type ItemDetailRow = {
  key: string;
  controlId: string;
  date: string;
  site: string;
  controller: string;
  formType: FormType;
  label: string;
  state: string;
  comment: string;
};

type FilterState = {
  from: string;
  to: string;
  establishmentId: string;
  userId: string;
  formType: string;
  anomaly: string;
};

const emptyFilters: FilterState = {
  from: "",
  to: "",
  establishmentId: "",
  userId: "",
  formType: "",
  anomaly: "",
};

function filtersToQuery(filters: FilterState): string {
  const q = new URLSearchParams();
  if (filters.from) q.set("from", filters.from);
  if (filters.to) q.set("to", filters.to);
  if (filters.establishmentId) q.set("establishmentId", filters.establishmentId);
  if (filters.userId) q.set("userId", filters.userId);
  if (filters.formType) q.set("formType", filters.formType);
  if (filters.anomaly) q.set("anomaly", filters.anomaly);
  const s = q.toString();
  return s ? `?${s}` : "";
}

function filtersEqual(a: FilterState, b: FilterState) {
  return (
    a.from === b.from &&
    a.to === b.to &&
    a.establishmentId === b.establishmentId &&
    a.userId === b.userId &&
    a.formType === b.formType &&
    a.anomaly === b.anomaly
  );
}

export default function AdminReportsPage() {
  const [draft, setDraft] = useState<FilterState>(emptyFilters);
  const [applied, setApplied] = useState<FilterState>(emptyFilters);
  const [tableView, setTableView] = useState<"global" | "detail">("global");
  const [sites, setSites] = useState<Establishment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [searching, setSearching] = useState(false);
  const { push } = useToast();

  const filtersPending = !filtersEqual(draft, applied);

  const exportQueryString = useCallback(() => {
    const base = filtersToQuery(applied);
    const join = base ? "&" : "?";
    return `${base}${join}view=${tableView}`;
  }, [applied, tableView]);

  const runSearch = useCallback(
    async (filters: FilterState) => {
      setSearching(true);
      try {
        const data = await api<ReportData>(
          `/api/reports${filtersToQuery(filters)}`
        );
        setReport(data);
        setApplied(filters);
      } catch (err) {
        push(
          err instanceof ApiError ? err.message : "Recherche impossible.",
          "error"
        );
      } finally {
        setSearching(false);
      }
    },
    [push]
  );

  function onSearch(e?: FormEvent) {
    e?.preventDefault();
    void runSearch(draft);
  }

  function patchDraft(partial: Partial<FilterState>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  const itemDetails = useMemo<ItemDetailRow[]>(() => {
    if (!report) return [];
    return report.controls.flatMap((c) =>
      (c.items ?? []).map((item) => ({
        key: `${c.id}-${item.itemKey}`,
        controlId: c.id,
        date: c.createdAt,
        site: c.establishment?.name ?? "—",
        controller: c.user?.name ?? "—",
        formType: c.formType,
        label: item.label,
        state: item.state,
        comment: item.comment,
      }))
    );
  }, [report]);

  useEffect(() => {
    Promise.all([
      api<{ establishments: Establishment[] }>("/api/admin/establishments"),
      api<{ users: User[] }>("/api/admin/users"),
    ])
      .then(([e, u]) => {
        setSites(e.establishments);
        setUsers(u.users);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    void runSearch(emptyFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function downloadExport(format: "csv" | "xlsx") {
    if (filtersPending) {
      push("Cliquez sur Rechercher pour appliquer les filtres avant l'export.", "error");
      return;
    }
    if (!report) {
      push("Aucune donnée à exporter.", "error");
      return;
    }
    try {
      let blob: Blob;
      if (process.env.NEXT_PUBLIC_MOCK_API === "true") {
        blob = await api<Blob>(
          `/api/reports/export.${format}${exportQueryString()}`
        );
      } else {
        const token = getToken();
        const res = await fetch(
          `${getApiBaseUrl()}/api/reports/export.${format}${exportQueryString()}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!res.ok) throw new Error("Export impossible.");
        blob = await res.blob();
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gms-rapports-${tableView}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      push(
        format === "xlsx"
          ? `Export Excel (${tableView === "global" ? "globale" : "détail"}) téléchargé.`
          : `Export CSV (${tableView === "global" ? "globale" : "détail"}) téléchargé.`
      );
    } catch {
      push("Export impossible.", "error");
    }
  }

  return (
    <AppShell requireAdmin title="Rapports">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="gms-eyebrow">Administration</p>
          <h2 className="mt-1 font-display text-2xl text-mist">
            Synthèse des contrôles
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="min-h-11"
            disabled={filtersPending || !report}
            onClick={() => downloadExport("csv")}
            title={
              filtersPending
                ? "Appliquez les filtres avec Rechercher"
                : undefined
            }
          >
            Export CSV ({tableView === "global" ? "globale" : "détail"})
          </Button>
          <Button
            variant="secondary"
            className="min-h-11"
            disabled={filtersPending || !report}
            onClick={() => downloadExport("xlsx")}
            title={
              filtersPending
                ? "Appliquez les filtres avec Rechercher"
                : undefined
            }
          >
            Export Excel ({tableView === "global" ? "globale" : "détail"})
          </Button>
        </div>
      </div>

      <DashPanel title="Filtres">
        <form onSubmit={onSearch} className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel htmlFor="from">Du</FieldLabel>
              <Input
                id="from"
                type="date"
                value={draft.from}
                onChange={(e) => patchDraft({ from: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="to">Au</FieldLabel>
              <Input
                id="to"
                type="date"
                value={draft.to}
                onChange={(e) => patchDraft({ to: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="site">Site</FieldLabel>
              <Select
                id="site"
                value={draft.establishmentId}
                onChange={(e) =>
                  patchDraft({ establishmentId: e.target.value })
                }
              >
                <option value="">Tous</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="user">Contrôleur</FieldLabel>
              <Select
                id="user"
                value={draft.userId}
                onChange={(e) => patchDraft({ userId: e.target.value })}
              >
                <option value="">Tous</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="ft">Formulaire</FieldLabel>
              <Select
                id="ft"
                value={draft.formType}
                onChange={(e) => patchDraft({ formType: e.target.value })}
              >
                <option value="">Tous</option>
                <option value="audit">Audit</option>
                <option value="passager">Passager</option>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="an">Anomalie</FieldLabel>
              <Select
                id="an"
                value={draft.anomaly}
                onChange={(e) => patchDraft({ anomaly: e.target.value })}
              >
                <option value="">Toutes</option>
                <option value="true">Avec anomalie</option>
                <option value="false">Sans anomalie</option>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              className="h-10 min-h-0 gap-1.5 px-3 text-sm"
              disabled={searching}
              aria-label="Rechercher avec les filtres"
            >
              <IconSearch className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">
                {searching ? "…" : "Rechercher"}
              </span>
            </Button>
            {filtersPending ? (
              <p className="text-xs text-brand-light">
                Filtres modifiés — cliquez sur Rechercher pour mettre à jour
                les tableaux et les exports.
              </p>
            ) : (
              <p className="text-xs text-mute">
                Les exports CSV et Excel utilisent ces filtres appliqués.
              </p>
            )}
          </div>
        </form>
      </DashPanel>

      {report && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mute">
              Affichage des tableaux par item et par contrôle.
            </p>
            <TableViewToggle value={tableView} onChange={setTableView} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile label="Total" value={report.kpis.total} />
            <KpiTile
              label="Anomalies"
              value={report.kpis.anomalies}
              tone="alert"
            />
            <KpiTile label="Audits" value={report.kpis.audit} />
            <KpiTile label="Passagers" value={report.kpis.passager} />
          </div>

          {report.kpis.unvisitedSites.length > 0 && (
            <DashPanel title="Sites non visités">
              <p className="px-4 py-4 text-sm text-mute sm:px-5">
                {report.kpis.unvisitedSites.map((s) => s.name).join(" · ")}
              </p>
            </DashPanel>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <DashPanel title="Par site">
              {tableView === "global" ? (
                <DashTable
                  columns={[
                    "Site",
                    "Audit",
                    "Passager",
                    "Total",
                    "Anomalies",
                  ]}
                >
                  {report.summaries.bySite.map((s) => (
                    <tr
                      key={s.establishmentId}
                      className="border-b border-line"
                    >
                      <td className="px-4 py-3 text-mist">{s.name}</td>
                      <td className="px-4 py-3 tabular-nums text-mute">
                        {s.audit}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-mute">
                        {s.passager}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-mute">
                        {s.total}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-mute">
                        {s.anomalies}
                      </td>
                    </tr>
                  ))}
                </DashTable>
              ) : (
                <DashTable
                  columns={["Date", "Site", "Type", "Contrôleur", "Statut"]}
                >
                  {report.controls.map((c) => (
                    <tr key={c.id} className="border-b border-line">
                      <td className="px-4 py-3 text-mute">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-mist">{c.establishment?.name}</td>
                      <td className="px-4 py-3">
                        <FormTypeBadge formType={c.formType} />
                      </td>
                      <td className="px-4 py-3 text-mute">{c.user?.name}</td>
                      <td className="px-4 py-3">
                        {c.anomaly ? (
                          <span className="text-brand-light">Anomalie</span>
                        ) : (
                          <span className="text-ok">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </DashTable>
              )}
            </DashPanel>

            <DashPanel title="Par contrôleur">
              {tableView === "global" ? (
                <DashTable
                  columns={[
                    "Contrôleur",
                    "Audit",
                    "Passager",
                    "Total",
                    "Anomalies",
                  ]}
                >
                  {report.summaries.byController.map((c) => (
                    <tr key={c.userId} className="border-b border-line">
                      <td className="px-4 py-3 text-mist">{c.name}</td>
                      <td className="px-4 py-3 tabular-nums text-mute">
                        {c.audit}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-mute">
                        {c.passager}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-mute">
                        {c.total}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-mute">
                        {c.anomalies}
                      </td>
                    </tr>
                  ))}
                </DashTable>
              ) : (
                <DashTable
                  columns={["Contrôleur", "Type", "Site", "Date", "Statut"]}
                >
                  {report.controls.map((c) => (
                    <tr key={c.id} className="border-b border-line">
                      <td className="px-4 py-3 text-mist">{c.user?.name}</td>
                      <td className="px-4 py-3">
                        <FormTypeBadge formType={c.formType} />
                      </td>
                      <td className="px-4 py-3 text-mute">
                        {c.establishment?.name}
                      </td>
                      <td className="px-4 py-3 text-mute">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {c.anomaly ? (
                          <span className="text-brand-light">Anomalie</span>
                        ) : (
                          <span className="text-ok">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </DashTable>
              )}
            </DashPanel>
          </div>

          <DashPanel
            title="Par item"
            action={
              <span className="font-display text-[0.62rem] uppercase tracking-label text-mute">
                {tableView === "global" ? "Vue agrégée" : "Ligne par réponse"}
              </span>
            }
          >
            {tableView === "global" ? (
              <DashTable
                columns={[
                  "Type",
                  "Point",
                  "OK",
                  "Non conforme",
                  "N/A",
                ]}
              >
                {report.summaries.byItem.map((i) => (
                  <tr
                    key={`${i.formType}-${i.itemKey}`}
                    className="border-b border-line"
                  >
                    <td className="px-4 py-3">
                      <FormTypeBadge formType={i.formType} />
                    </td>
                    <td className="px-4 py-3 text-mist">{i.label}</td>
                    <td className="px-4 py-3 tabular-nums text-ok">{i.ok}</td>
                    <td className="px-4 py-3 tabular-nums text-brand-light">
                      {i.no}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-mute">{i.na}</td>
                  </tr>
                ))}
              </DashTable>
            ) : (
              <DashTable
                columns={[
                  "Date",
                  "Site",
                  "Contrôleur",
                  "Type",
                  "Point",
                  "État",
                  "Commentaire",
                ]}
              >
                {itemDetails.map((row) => (
                  <tr key={row.key} className="border-b border-line">
                    <td className="whitespace-nowrap px-4 py-3 text-mute">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/controls/${row.controlId}`}
                        className="text-mist hover:text-brand-light"
                      >
                        {row.site}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-mute">{row.controller}</td>
                    <td className="px-4 py-3">
                      <FormTypeBadge formType={row.formType} />
                    </td>
                    <td className="px-4 py-3 text-mist">{row.label}</td>
                    <td
                      className={`px-4 py-3 text-xs uppercase tracking-[0.1em] ${
                        row.state === "ok"
                          ? "text-ok"
                          : row.state === "no"
                            ? "text-brand-light"
                            : "text-mute"
                      }`}
                    >
                      {stateLabel(row.state as "ok" | "no" | "na")}
                    </td>
                    <td className="px-4 py-3 text-sm text-mute">
                      {row.comment || "—"}
                    </td>
                  </tr>
                ))}
              </DashTable>
            )}
          </DashPanel>

          <DashPanel title="Liste des contrôles">
            {tableView === "global" ? (
              <DashTable
                columns={["Site", "Type", "Contrôleur", "Date", "Statut"]}
              >
                {report.controls.map((c) => (
                  <tr key={c.id} className="border-b border-line">
                    <td className="px-4 py-3">
                      <Link
                        href={`/controls/${c.id}`}
                        className="text-mist hover:text-brand-light"
                      >
                        {c.establishment?.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <FormTypeBadge formType={c.formType} />
                    </td>
                    <td className="px-4 py-3 text-mute">{c.user?.name}</td>
                    <td className="px-4 py-3 text-mute">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {c.anomaly ? (
                        <span className="text-brand-light">Anomalie</span>
                      ) : (
                        <span className="text-ok">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </DashTable>
            ) : (
              <DashTable
                columns={[
                  "Date",
                  "Site",
                  "Type",
                  "Point",
                  "État",
                  "Contrôleur",
                ]}
              >
                {itemDetails.map((row) => (
                  <tr key={`ctrl-${row.key}`} className="border-b border-line">
                    <td className="whitespace-nowrap px-4 py-3 text-mute">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/controls/${row.controlId}`}
                        className="text-mist hover:text-brand-light"
                      >
                        {row.site}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <FormTypeBadge formType={row.formType} />
                    </td>
                    <td className="px-4 py-3 text-mist">{row.label}</td>
                    <td
                      className={`px-4 py-3 text-xs uppercase tracking-[0.1em] ${
                        row.state === "ok"
                          ? "text-ok"
                          : row.state === "no"
                            ? "text-brand-light"
                            : "text-mute"
                      }`}
                    >
                      {stateLabel(row.state as "ok" | "no" | "na")}
                    </td>
                    <td className="px-4 py-3 text-mute">{row.controller}</td>
                  </tr>
                ))}
              </DashTable>
            )}
          </DashPanel>
        </div>
      )}
    </AppShell>
  );
}
