"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { FieldLabel, Input, PasswordInput, Select } from "@/components/Field";
import { DashPanel, DashTable, KpiTile } from "@/components/DashWidgets";
import {
  api,
  ApiError,
  type Establishment,
  type Role,
  type User,
} from "@/lib/api-client";
import { useToast } from "@/lib/toast";

function EstablishmentMultiSelect({
  id,
  sites,
  value,
  onChange,
  className = "",
}: {
  id?: string;
  sites: Establishment[];
  value: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggle(siteId: string) {
    onChange(
      value.includes(siteId)
        ? value.filter((x) => x !== siteId)
        : [...value, siteId]
    );
  }

  const selected = sites.filter((s) => value.includes(s.id));
  const label =
    selected.length === 0
      ? "— Aucun établissement —"
      : selected.length === 1
        ? selected[0].name
        : `${selected.length} établissements`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        className="gms-field gms-select flex w-full min-h-11 items-center justify-between gap-2 text-left"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected.length === 0 ? "text-mute" : "text-mist"}>
          {label}
        </span>
        <span className="text-mute" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-line bg-[var(--gms-field)] p-2 shadow-lg"
        >
          {sites.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-mute">Aucun site actif</p>
          ) : (
            sites.map((s) => {
              const checked = value.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(s.id)}
                  className={`mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-left transition duration-brand last:mb-0 ${
                    checked
                      ? "border-gold/40 bg-gold-dim text-mist"
                      : "border-transparent text-mist hover:border-line hover:bg-black/5"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[0.55rem] font-bold ${
                      checked
                        ? "border-gold bg-gold text-ink"
                        : "border-line bg-surface/60 text-transparent"
                    }`}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">
                      {s.name}
                    </span>
                    {s.address ? (
                      <span className="block truncate text-[0.65rem] text-mute">
                        {s.address}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Establishment[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("controleur");
  const [createEstablishmentIds, setCreateEstablishmentIds] = useState<
    string[]
  >([]);
  const [passwordEdits, setPasswordEdits] = useState<Record<string, string>>(
    {}
  );
  const [establishmentEdits, setEstablishmentEdits] = useState<
    Record<string, string[]>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const { push } = useToast();

  async function load() {
    const [usersData, sitesData] = await Promise.all([
      api<{ users: User[] }>("/api/admin/users"),
      api<{ establishments: Establishment[] }>("/api/admin/establishments"),
    ]);
    setUsers(usersData.users);
    setSites(sitesData.establishments.filter((e) => e.active));
    setEstablishmentEdits(
      Object.fromEntries(
        usersData.users.map((u) => [
          u.id,
          (u.establishments ?? []).map((e) => e.id),
        ])
      )
    );
  }

  useEffect(() => {
    load().catch((err) =>
      push(
        err instanceof ApiError ? err.message : "Chargement impossible.",
        "error"
      )
    );
  }, [push]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          establishmentIds: createEstablishmentIds,
        }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("controleur");
      setCreateEstablishmentIds([]);
      push("Compte créé.");
      await load();
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Création impossible.",
        "error"
      );
    }
  }

  async function toggleActive(user: User) {
    try {
      await api(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !user.active }),
      });
      push(user.active ? "Compte désactivé." : "Compte réactivé.");
      await load();
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : "Mise à jour impossible.",
        "error"
      );
    }
  }

  async function changePassword(user: User) {
    const next = (passwordEdits[user.id] || "").trim();
    if (next.length < 6) {
      push("Le mot de passe doit contenir au moins 6 caractères.", "error");
      return;
    }
    setSavingId(user.id);
    try {
      await api(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: next }),
      });
      setPasswordEdits((prev) => {
        const copy = { ...prev };
        delete copy[user.id];
        return copy;
      });
      push(`Mot de passe mis à jour pour ${user.name}.`);
    } catch (err) {
      push(
        err instanceof ApiError
          ? err.message
          : "Changement de mot de passe impossible.",
        "error"
      );
    } finally {
      setSavingId(null);
    }
  }

  async function saveEstablishments(user: User) {
    setSavingId(user.id);
    try {
      await api(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          establishmentIds: establishmentEdits[user.id] ?? [],
        }),
      });
      push(`Établissements mis à jour pour ${user.name}.`);
      await load();
    } catch (err) {
      push(
        err instanceof ApiError
          ? err.message
          : "Mise à jour des établissements impossible.",
        "error"
      );
    } finally {
      setSavingId(null);
    }
  }

  const active = users.filter((u) => u.active).length;
  const admins = users.filter((u) => u.role === "admin").length;

  return (
    <AppShell requireAdmin title="Comptes">
      <div className="mb-6">
        <p className="gms-eyebrow">Administration</p>
          <h2 className="mt-1 font-display text-xl text-mist sm:text-2xl">
            Gestion des comptes
          </h2>
        <p className="mt-1 text-sm text-mute">
          Le type de formulaire se choisit à chaque contrôle, pas sur le compte.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiTile label="Total" value={users.length} />
        <KpiTile label="Actifs" value={active} tone="ok" />
        <KpiTile label="Admins" value={admins} />
      </div>

      <div className="mb-4">
        <DashPanel title="Nouveau compte">
          <form
            onSubmit={onCreate}
            className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5"
          >
            <div>
              <FieldLabel htmlFor="name">Nom</FieldLabel>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <PasswordInput
                id="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="role">Rôle</FieldLabel>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="controleur">Contrôleur</option>
                <option value="admin">Administrateur</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="establishment" hint="multichoix">
                Établissements liés
              </FieldLabel>
              <EstablishmentMultiSelect
                id="establishment"
                sites={sites}
                value={createEstablishmentIds}
                onChange={setCreateEstablishmentIds}
              />
              {sites.length === 0 ? (
                <p className="mt-2 text-sm text-mute">
                  Aucun établissement actif. Créez-en un dans Administration →
                  Établissements.
                </p>
              ) : (
                <p className="mt-2 text-xs text-mute">
                  Ouvrez la liste et cochez un ou plusieurs sites.
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="min-h-11">
                Ajouter le compte
              </Button>
            </div>
          </form>
        </DashPanel>
      </div>

      <DashPanel title="Liste des comptes">
        <ul className="divide-y divide-line md:hidden">
          {users.map((u) => (
            <li key={u.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-mist">{u.name}</p>
                  <p className="truncate text-xs text-mute">{u.email}</p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-label text-mute">
                    {u.role === "admin" ? "Admin" : "Contrôleur"} ·{" "}
                    <span className={u.active ? "text-ok" : "text-brand-light"}>
                      {u.active ? "Actif" : "Inactif"}
                    </span>
                  </p>
                </div>
                <Button
                  variant={u.active ? "danger" : "secondary"}
                  className="min-h-9 shrink-0 text-xs"
                  onClick={() => toggleActive(u)}
                >
                  {u.active ? "Désactiver" : "Réactiver"}
                </Button>
              </div>
              <div>
                <FieldLabel hint="multichoix">Établissements</FieldLabel>
                <EstablishmentMultiSelect
                  sites={sites}
                  value={establishmentEdits[u.id] ?? []}
                  onChange={(ids) =>
                    setEstablishmentEdits((prev) => ({
                      ...prev,
                      [u.id]: ids,
                    }))
                  }
                />
                <Button
                  variant="secondary"
                  className="mt-2 min-h-9 w-full text-xs"
                  disabled={savingId === u.id}
                  onClick={() => saveEstablishments(u)}
                >
                  {savingId === u.id ? "…" : "Enregistrer les sites"}
                </Button>
              </div>
              <div>
                <FieldLabel>Mot de passe</FieldLabel>
                <PasswordInput
                  autoComplete="new-password"
                  minLength={6}
                  placeholder="Nouveau mot de passe"
                  className="min-h-9 text-sm"
                  value={passwordEdits[u.id] ?? ""}
                  onChange={(e) =>
                    setPasswordEdits((prev) => ({
                      ...prev,
                      [u.id]: e.target.value,
                    }))
                  }
                />
                <Button
                  variant="secondary"
                  className="mt-2 min-h-9 w-full text-xs"
                  disabled={savingId === u.id}
                  onClick={() => changePassword(u)}
                >
                  {savingId === u.id ? "…" : "Changer le mot de passe"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
        <DashTable
          columns={[
            "Nom",
            "Email",
            "Rôle",
            "Statut",
            "Établissements",
            "Mot de passe",
            "",
          ]}
          minWidth="72rem"
        >
          {users.map((u) => (
            <tr key={u.id} className="border-b border-line">
              <td className="px-4 py-3 text-mist">{u.name}</td>
              <td className="px-4 py-3 text-mute">{u.email}</td>
              <td className="px-4 py-3 text-mute">
                {u.role === "admin" ? "Admin" : "Contrôleur"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={u.active ? "text-ok" : "text-brand-light"}
                >
                  {u.active ? "Actif" : "Inactif"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex min-w-[16rem] flex-col gap-2 sm:flex-row sm:items-start">
                  <EstablishmentMultiSelect
                    className="min-w-[12rem] flex-1"
                    sites={sites}
                    value={establishmentEdits[u.id] ?? []}
                    onChange={(ids) =>
                      setEstablishmentEdits((prev) => ({
                        ...prev,
                        [u.id]: ids,
                      }))
                    }
                  />
                  <Button
                    variant="secondary"
                    className="min-h-9 shrink-0 text-xs"
                    disabled={savingId === u.id}
                    onClick={() => saveEstablishments(u)}
                  >
                    {savingId === u.id ? "…" : "Enregistrer"}
                  </Button>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex min-w-[12rem] flex-col gap-2 sm:flex-row sm:items-center">
                  <PasswordInput
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="Nouveau mot de passe"
                    className="min-h-9 text-sm"
                    value={passwordEdits[u.id] ?? ""}
                    onChange={(e) =>
                      setPasswordEdits((prev) => ({
                        ...prev,
                        [u.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void changePassword(u);
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    className="min-h-9 shrink-0 text-xs"
                    disabled={savingId === u.id}
                    onClick={() => changePassword(u)}
                  >
                    {savingId === u.id ? "…" : "Changer"}
                  </Button>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant={u.active ? "danger" : "secondary"}
                  className="min-h-9 text-xs"
                  onClick={() => toggleActive(u)}
                >
                  {u.active ? "Désactiver" : "Réactiver"}
                </Button>
              </td>
            </tr>
          ))}
        </DashTable>
        </div>
      </DashPanel>
    </AppShell>
  );
}
