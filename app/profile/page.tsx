"use client";

import { AppShell } from "@/components/AppShell";
import { DashPanel, DashTable } from "@/components/DashWidgets";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <AppShell title="Profil">
      <div className="mb-6">
        <p className="gms-eyebrow">Compte</p>
        <h2 className="mt-1 font-display text-xl text-mist sm:text-2xl">Mon profil</h2>
      </div>

      {user && (
        <div className="space-y-4">
          <DashPanel title="Identité">
            <DashTable columns={["Champ", "Valeur"]} minWidth="0">
              <tr className="border-b border-line">
                <td className="px-4 py-3 text-mute">Nom</td>
                <td className="px-4 py-3 text-mist">{user.name}</td>
              </tr>
              <tr className="border-b border-line">
                <td className="px-4 py-3 text-mute">Email</td>
                <td className="px-4 py-3 text-mist">{user.email}</td>
              </tr>
              <tr className="border-b border-line">
                <td className="px-4 py-3 text-mute">Rôle</td>
                <td className="px-4 py-3 text-mist">
                  {user.role === "admin" ? "Administrateur" : "Contrôleur"}
                </td>
              </tr>
            </DashTable>
          </DashPanel>

          {user.role === "controleur" ? (
            <DashPanel title="Établissements liés">
              {user.establishments?.length ? (
                <ul className="divide-y divide-line">
                  {user.establishments.map((e) => (
                    <li key={e.id} className="px-4 py-3 text-sm text-mist">
                      {e.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-4 text-sm text-mute">
                  Aucun site assigné — contactez votre administrateur.
                </p>
              )}
            </DashPanel>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
