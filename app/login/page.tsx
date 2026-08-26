"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { FieldLabel, Input, PasswordInput } from "@/components/Field";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { useToast } from "@/lib/toast";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      push("Connexion réussie.");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Connexion impossible.";
      setError(msg);
      push(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-mist">
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au formulaire
      </a>

      {/* Atmosphere — soft brand wash, not flat white */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(209,58,52,0.10), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(141,42,38,0.06), transparent 50%), linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10 sm:px-8 sm:py-14">
        <div className="gms-enter">
          <div className="mx-auto w-[min(100%,13.5rem)] sm:w-[min(100%,18rem)]">
            <BrandMark animate size="lg" surface="bare" />
          </div>
          <p className="mt-5 text-center font-display text-[0.7rem] uppercase tracking-[0.28em] text-brand">
            GMS Contrôle
          </p>
          <p className="mt-3 text-center text-sm leading-relaxed text-mute">
            Contrôles terrain — accès collaborateurs
          </p>
          {process.env.NEXT_PUBLIC_MOCK_API === "true" && (
            <div className="mt-6 rounded border border-brand/25 bg-brand/5 px-4 py-3 text-left text-xs leading-relaxed text-mute">
              <p className="font-display uppercase tracking-[0.12em] text-brand">
                Comptes démo
              </p>
              <ul className="mt-2 space-y-1">
                <li>
                  <strong className="text-mist">Admin</strong> —{" "}
                  admin@groupeservice.local
                </li>
                <li>
                  <strong className="text-mist">Contrôleur</strong> —{" "}
                  amine@groupeservice.local
                </li>
              </ul>
              <p className="mt-2">Mot de passe : n&apos;importe lequel</p>
            </div>
          )}
        </div>

        <form
          id="login-form"
          data-login-form
          onSubmit={onSubmit}
          className="mt-10 gms-enter gms-enter-delay-1"
          noValidate
        >
          {error && (
            <div
              role="alert"
              className="mb-6 border-l-[3px] border-brand bg-brand/10 px-4 py-3 text-sm text-brand-dark"
            >
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <FieldLabel htmlFor="email">Email professionnel</FieldLabel>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@mondialservice.local"
                aria-invalid={!!error}
              />
            </div>
            <div>
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                aria-invalid={!!error}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="mt-8 w-full min-h-14 text-base"
            disabled={busy || !email || !password}
          >
            {busy ? "Vérification…" : "Se connecter"}
          </Button>
        </form>

        <p
          data-login-foot
          className="mt-12 text-center font-display text-[0.6rem] uppercase tracking-[0.28em] text-mute gms-enter-fade gms-enter-delay-2"
        >
          Partner of your success since 2000
        </p>
      </div>
    </div>
  );
}
