"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import {
  IconClose,
  IconLogout,
  IconMenu,
  NavIcon,
  type NavIconName,
} from "@/components/Icons";
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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
      href: "/day",
      label: "Ma journée",
      section: "Opérations",
      icon: "journal",
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
      href: "/admin/map",
      label: "Carte des contrôles",
      section: "Vue",
      icon: "map",
    },
    {
      href: "/admin/planning",
      label: "Planning",
      section: "Opérations",
      icon: "calendar",
    },
    {
      href: "/admin/days",
      label: "Journées",
      section: "Analyse",
      icon: "journal",
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

  const navContent = (
    <>
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

      <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="truncate text-sm font-medium text-mist">{user.name}</p>
        <p className="mt-0.5 text-[0.62rem] uppercase tracking-label text-brand">
          {user.role === "admin" ? "Administrateur" : "Contrôleur"}
        </p>
        <Button
          variant="ghost"
          className="mt-3 w-full min-h-11 text-xs"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          <IconLogout className="h-3.5 w-3.5" />
          Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-ink lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-line bg-charcoal lg:flex lg:min-h-screen lg:flex-col">
        {navContent}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-mist/40"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-end border-b border-line px-2 py-2">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center text-mute"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      ) : null}

      <div className="relative flex min-w-0 flex-col">
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 hidden w-[2px] bg-brand/50 lg:block" />
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-line bg-white/95 px-3 py-3 backdrop-blur-sm sm:gap-3 sm:px-4 sm:py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-line bg-charcoal text-mute lg:hidden"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label="Ouvrir le menu"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="gms-eyebrow hidden sm:block">Gestion</p>
              <h1 className="truncate font-display text-base font-semibold tracking-tight text-mist sm:mt-1 sm:text-xl lg:text-2xl">
                {title || "GMS Contrôle"}
              </h1>
            </div>
          </div>
          <p className="hidden max-w-[38%] truncate text-right text-xs text-mute sm:block lg:hidden">
            {user.name}
          </p>
        </header>

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
