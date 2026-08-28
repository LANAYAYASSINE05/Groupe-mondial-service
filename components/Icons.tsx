import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
};

export function IconDashboard({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

export function IconClipboard({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

export function IconHistory({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconChart({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 17V11M12 17V8M16 17v-4" />
    </svg>
  );
}

export function IconUser({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function IconUsers({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <path d="M15 19a5 5 0 0 1 6 0" />
    </svg>
  );
}

export function IconBuilding({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M4 20V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v14" />
      <path d="M15 10h4a1 1 0 0 1 1 1v9" />
      <path d="M4 20h16M8 9h2M8 13h2M8 17h2" />
    </svg>
  );
}

export function IconReport({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

export function IconMapPin({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

export function IconShield({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" />
      <path d="M9.5 12.5l1.8 1.8 3.7-3.8" />
    </svg>
  );
}

export function IconPassager({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <circle cx="12" cy="7" r="3" />
      <path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
    </svg>
  );
}

export function IconLogout({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M15 16l4-4-4-4M19 12H9" />
    </svg>
  );
}

export function IconMenu({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconClose({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconPlus({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconArrowRight({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconAlert({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

export function IconCheck({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconSearch({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function IconEye({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-2.2 3.2" />
      <path d="M6.1 6.1C3.7 7.8 2 12 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.2-.9" />
    </svg>
  );
}

export function IconCalendar({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export function IconJournal({ className = "h-4 w-4", ...props }: IconProps) {
  return (
    <svg className={`shrink-0 ${className}`} {...defaults} {...props}>
      <path d="M6 4h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M8 4v16" />
      <path d="M12 9h5M12 13h4" />
    </svg>
  );
}

export type NavIconName =
  | "dashboard"
  | "clipboard"
  | "history"
  | "chart"
  | "user"
  | "users"
  | "building"
  | "report"
  | "map"
  | "shield"
  | "passager"
  | "logout"
  | "calendar"
  | "journal";

const NAV_ICONS = {
  dashboard: IconDashboard,
  clipboard: IconClipboard,
  history: IconHistory,
  chart: IconChart,
  user: IconUser,
  users: IconUsers,
  building: IconBuilding,
  report: IconReport,
  map: IconMapPin,
  shield: IconShield,
  passager: IconPassager,
  logout: IconLogout,
  calendar: IconCalendar,
  journal: IconJournal,
} as const;

export function NavIcon({
  name,
  className = "h-4 w-4",
}: {
  name: NavIconName;
  className?: string;
}) {
  const Cmp = NAV_ICONS[name];
  return <Cmp className={className} />;
}
