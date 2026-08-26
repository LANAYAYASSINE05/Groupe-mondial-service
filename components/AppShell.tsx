"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { IconLogout, IconMenu, NavIcon, type NavIconName } from "@/components/Icons";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/lib/auth-context";

type NavItem = {
  href: string;
  label: string;
  section?: string;
  icon: NavIconName;
};

export function AppShell({
  children,
  requireAdmin = false,
  title,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
  title?: string;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, loading, requireAdmin, router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="gms-pillars" aria-label="Chargement">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  const controleurLinks: NavItem[] = [
    {
      href: "/dashboard",
      label: "Tableau de bord",
      section: "Vue",
      icon: "dashboard",
    },
    {
      href: "/controls/new",
      label: "Nouveau contrôle",
      section: "Opérations",
      icon: "clipboard",
    },
    {
      href: "/planning",
      label: "Planning",
      section: "Opérations",
      icon: "calendar",
    },
    {
      href: "/controls",
      label: "Historique",
      section: "Opérations",
      icon: "history",
    },
    {
      href: "/stats",
      label: "Statistiques",
      section: "Analyse",
      icon: "chart",
    },
    { href: "/profile", label: "Mon profil", section: "Compte", icon: "user" },
  ];

  const adminLinks: NavItem[] = [
    { href: "/admin", label: "Tableau de bord", section: "Vue", icon: "dashboard" },
    {
      href: "/admin/planning",
      label: "Planning hebdo",
      section: "Opérations",
      icon: "calendar",
    },
    {
      href: "/admin/reports",
      label: "Rapports",
      section: "Analyse",
      icon: "report",
    },
    {
      href: "/admin/users",
      label: "Comptes",
      section: "Administration",
      icon: "users",
    },
    {
      href: "/admin/establishments",
      label: "Établissements",
      section: "Administration",
      icon: "building",
    },
  ];

  const links = user.role === "admin" ? adminLinks : controleurLinks;

  const sections = links.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.section || "Menu";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  function isActive(href: string) {
    if (pathname === href) return true;
    if (href === "/dashboard" || href === "/admin") return false;
    if (href === "/controls" && pathname.startsWith("/controls/")) {
      return !pathname.startsWith("/controls/new");
    }
    return pathname.startsWith(`${href}/`) || pathname.startsWith(href);
  }

  const home = user.role === "admin" ? "/admin" : "/dashboard";

  function renderNav(items: NavItem[]) {
    return items.map((l) => {
      const active = isActive(l.href);
      return (
        <li key={l.href}>
          <Link
            href={l.href}
            data-active={active ? "true" : "false"}
            className="gms-nav-item"
          >
            <NavIcon name={l.icon} className="h-[1.05rem] w-[1.05rem]" />
            <span>{l.label}</span>
          </Link>
        </li>
      );
    });
  }

  return (
    <div className="min-h-screen bg-ink lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-line bg-charcoal lg:flex lg:min-h-screen lg:flex-col">
        <div className="border-b border-line px-4 py-5">
          <Link href={home} className="flex flex-col items-center">
            <BrandMark size="sm" surface="bare" />
          </Link>
          <p className="mt-3 text-center font-display text-[0.62rem] uppercase tracking-[0.22em] text-brand">
            GMS Contrôle
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section} className="mb-6">
              <p className="mb-2 px-3 font-display text-[0.6rem] uppercase tracking-[0.18em] text-na">
                {section}
              </p>
              <ul className="space-y-0.5">{renderNav(items)}</ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-4">
          <p className="truncate text-sm font-medium text-mist">{user.name}</p>
          <p className="mt-0.5 text-[0.62rem] uppercase tracking-label text-brand">
            {user.role === "admin" ? "Administrateur" : "Contrôleur"}
          </p>
          <Button
            variant="ghost"
            className="mt-3 w-full min-h-10 text-xs"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <IconLogout className="h-3.5 w-3.5" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-col">
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-[2px] bg-brand/50" />
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-4 backdrop-blur-sm lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 border border-line bg-charcoal px-3 py-2 text-xs uppercase tracking-label text-mute lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              <IconMenu className="h-4 w-4" />
              Menu
            </button>
            <div>
              <p className="gms-eyebrow">Gestion</p>
              <h1 className="mt-1 font-display text-xl font-semibold tracking-tight text-mist sm:text-2xl">
                {title || "GMS Contrôle"}
              </h1>
            </div>
          </div>
          <div className="hidden text-right sm:block lg:hidden">
            <p className="text-sm text-mist">{user.name}</p>
          </div>
        </header>

        {open && (
          <div className="border-b border-line bg-charcoal px-3 py-3 lg:hidden">
            {Object.entries(sections).map(([section, items]) => (
              <div key={section} className="mb-3">
                <p className="mb-1 px-2 text-[0.6rem] uppercase tracking-label text-na">
                  {section}
                </p>
                <ul className="space-y-0.5">{renderNav(items)}</ul>
              </div>
            ))}
            <Button
              variant="ghost"
              className="mt-2 w-full min-h-9 text-xs"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              <IconLogout className="h-3.5 w-3.5" />
              Déconnexion
            </Button>
          </div>
        )}

        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
