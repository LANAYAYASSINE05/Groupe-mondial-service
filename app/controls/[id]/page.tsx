"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DashPanel, DashTable, KpiTile } from "@/components/DashWidgets";
import { StatusBadge } from "@/components/StatusBadge";
import { FormTypeBadge } from "@/components/FormTypeBadge";
import {
  api,
  ApiError,
  formatDate,
  stateLabel,
  type Control,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

export default function ControlDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [control, setControl] = useState<Control | null>(null);
  const { push } = useToast();

  useEffect(() => {
    api<{ control: Control }>(`/api/controls/${id}`)
      .then((d) => setControl(d.control))
      .catch((err) =>
        push(
          err instanceof ApiError ? err.message : "Chargement impossible.",
          "error"
        )
      );
  }, [id, push]);

  if (!control) {
    return (
      <AppShell title="Détail">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="gms-pillars" aria-label="Chargement">
            <span />
            <span />
            <span />
          </div>
        </div>
      </AppShell>
    );
  }

  const nonConforme =
    control.items?.filter((i) => i.state === "no").length ?? 0;

  return (
    <AppShell title={control.establishment?.name || "Détail"}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/controls"
            className="text-sm text-mute underline-offset-4 hover:text-mist hover:underline"
          >
            ← Historique
          </Link>
          <h2 className="mt-2 font-display text-xl text-mist sm:text-2xl">
            {control.establishment?.name ?? "Établissement"}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-mute">
            <FormTypeBadge formType={control.formType} />
            <span>· {formatDate(control.createdAt)}</span>
            {control.user ? <span>· {control.user.name}</span> : null}
          </p>
        </div>
        <StatusBadge tone={control.anomaly ? "alert" : "ok"}>
          {control.anomaly ? "Anomalie" : "Sans anomalie"}
        </StatusBadge>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiTile label="Points" value={control.items?.length ?? 0} />
        <KpiTile
          label="Non conformes"
          value={nonConforme}
          tone={nonConforme > 0 ? "alert" : "ok"}
        />
        <KpiTile
          label="Statut"
          value={control.anomaly ? "Anomalie" : "OK"}
          tone={control.anomaly ? "alert" : "ok"}
        />
      </div>

      <div className="space-y-4">
        <DashPanel title="Résultats">
          <DashTable
            columns={["#", "Type", "Point", "État", "Commentaire"]}
            stacked={
              <ul className="divide-y divide-line">
                {control.items?.map((item) => (
                  <li key={item.id} className="px-4 py-3.5">
                    <p className="text-sm font-medium text-mist">
                      <span className="mr-2 font-display tabular-nums text-mute">
                        {String(item.position).padStart(2, "0")}
                      </span>
                      {item.label}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <FormTypeBadge formType={control.formType} />
                      <span
                        className={`font-display text-xs uppercase tracking-[0.1em] ${
                          item.state === "ok"
                            ? "text-ok"
                            : item.state === "no"
                              ? "text-brand-light"
                              : "text-na"
                        }`}
                      >
                        {stateLabel(item.state)}
                      </span>
                    </div>
                    {item.comment ? (
                      <p className="mt-2 text-sm text-mute">{item.comment}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            }
          >
            {control.items?.map((item) => (
              <tr key={item.id} className="border-b border-line">
                <td className="px-4 py-3 font-display tabular-nums text-mute">
                  {String(item.position).padStart(2, "0")}
                </td>
                <td className="px-4 py-3">
                  <FormTypeBadge formType={control.formType} />
                </td>
                <td className="px-4 py-3 text-mist">{item.label}</td>
                <td
                  className={`px-4 py-3 font-display text-xs uppercase tracking-[0.1em] ${
                    item.state === "ok"
                      ? "text-ok"
                      : item.state === "no"
                        ? "text-brand-light"
                        : "text-na"
                  }`}
                >
                  {stateLabel(item.state)}
                </td>
                <td className="px-4 py-3 text-sm text-mute">
                  {item.comment || "—"}
                </td>
              </tr>
            ))}
          </DashTable>
        </DashPanel>

        {control.explanation && (
          <DashPanel title="Explication">
            <p className="whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed text-mist sm:px-5">
              {control.explanation}
            </p>
          </DashPanel>
        )}

        <Link href="/controls/new">
          <Button className="min-h-11 w-full sm:w-auto">Nouveau contrôle</Button>
        </Link>
      </div>
    </AppShell>
  );
}
