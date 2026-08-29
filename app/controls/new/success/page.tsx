"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { DashPanel, KpiTile } from "@/components/DashWidgets";

function SuccessInner() {
  const params = useSearchParams();
  const id = params.get("id");

  return (
    <>
      <div className="mb-6">
        <p className="gms-eyebrow">Confirmation</p>
        <h2 className="mt-1 font-display text-2xl text-mist">
          Contrôle enregistré
        </h2>
        <p className="mt-1 text-sm text-mute">
          Le rapport est disponible dans l&apos;historique.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <KpiTile label="Statut" value="OK" tone="ok" />
        <KpiTile label="Référence" value={id ? id.slice(0, 8) : "—"} />
      </div>

      <DashPanel title="Actions">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:p-5">
          {id ? (
            <Link
              href={`/controls/${id}`}
              className="gms-btn-secondary inline-flex min-h-11 items-center justify-center px-5 text-center"
            >
              Voir le détail
            </Link>
          ) : null}
          <Link
            href="/controls/new"
            className="gms-btn-primary inline-flex min-h-11 items-center justify-center px-5 text-center"
          >
            Nouveau contrôle
          </Link>
          <Link
            href="/dashboard"
            className="gms-btn-ghost inline-flex min-h-11 items-center justify-center px-5 text-center"
          >
            Accueil
          </Link>
        </div>
      </DashPanel>
    </>
  );
}

export default function SuccessPage() {
  return (
    <AppShell title="Contrôle enregistré">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="gms-pillars">
              <span />
              <span />
              <span />
            </div>
          </div>
        }
      >
        <SuccessInner />
      </Suspense>
    </AppShell>
  );
}
