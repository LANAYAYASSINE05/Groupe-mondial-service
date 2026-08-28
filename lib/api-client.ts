export type Role = "admin" | "controleur";
export type FormType = "audit" | "passager";
export type ItemState = "ok" | "no" | "na";
export type PlanStatus =
  | "planifie"
  | "en_cours"
  | "termine"
  | "non_effectue";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  establishments?: { id: string; name: string }[];
};

export type Establishment = {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  geoRadiusMeters: number;
  active: boolean;
  createdAt: string;
};

export type ControlItem = {
  id: string;
  itemKey: string;
  label: string;
  state: ItemState;
  comment: string;
  position: number;
};

export type Control = {
  id: string;
  userId: string;
  establishmentId: string;
  formType: FormType;
  explanation: string;
  anomaly: boolean;
  latitude?: number | null;
  longitude?: number | null;
  geoAccuracy?: number | null;
  geoVerified?: boolean;
  createdAt: string;
  establishment?: Establishment;
  user?: Pick<User, "id" | "name" | "email">;
  items?: ControlItem[];
};

export type PlannedControl = {
  id: string;
  establishmentId: string;
  clientName: string;
  weekStart: string;
  plannedAt: string;
  plannedUntil: string;
  dayIndex: number;
  dayLabel: string;
  status: PlanStatus;
  notes: string;
  controlId: string | null;
  createdAt: string;
  updatedAt: string;
  establishment: { id: string; name: string; address: string };
  assignees: { id: string; name: string; email: string }[];
  control: {
    id: string;
    formType: FormType;
    anomaly: boolean;
    createdAt: string;
    userName: string;
  } | null;
};

export type DayLog = {
  id: string;
  userId: string;
  date: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "name" | "email">;
};

export function planStatusLabel(s: PlanStatus) {
  if (s === "planifie") return "Planifié";
  if (s === "en_cours") return "En cours";
  if (s === "termine") return "Terminé";
  return "Non effectué";
}

export type ChecklistDef = {
  formType: FormType;
  title: string;
  explanationLabel: string;
  items: { key: string; label: string; allowNa: boolean }[];
};

const CONFIGURED_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

const TOKEN_KEY = "gms_token";

/** En LAN/Tailscale, pointe l’API vers le même hôte que la page (pas localhost). */
export function getApiBaseUrl() {
  if (typeof window === "undefined") return CONFIGURED_API_URL;
  try {
    const api = new URL(CONFIGURED_API_URL);
    const pageHost = window.location.hostname;
    if (
      (api.hostname === "localhost" || api.hostname === "127.0.0.1") &&
      pageHost !== "localhost" &&
      pageHost !== "127.0.0.1"
    ) {
      api.hostname = pageHost;
      return api.origin;
    }
  } catch {
    /* ignore */
  }
  return CONFIGURED_API_URL;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Seul point d'accès HTTP vers le backend GMS (ou mock démo). */
export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const headerInit: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerInit[key] = value;
  });

  if (process.env.NEXT_PUBLIC_MOCK_API === "true") {
    const { mockApi } = await import("@/lib/mock-api");
    return mockApi<T>(path, { ...options, headers: headerInit });
  }

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers: headerInit,
    });
  } catch {
    throw new ApiError(
      "Impossible de joindre le serveur. Vérifiez que l'API backend est démarrée.",
      0
    );
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/csv")) {
    const blob = await res.blob();
    if (!res.ok) throw new ApiError("Export impossible.", res.status);
    return blob as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error || "Erreur réseau.",
      res.status
    );
  }
  return data as T;
}

export function formTypeLabel(t: FormType) {
  return t === "audit" ? "Audit" : "Passager";
}

/** Rouge marque = audit · bleu = passager */
export const FORM_TYPE_HEX: Record<FormType, string> = {
  audit: "#8D2A26",
  passager: "#1A6F9A",
};

export function stateLabel(s: ItemState) {
  if (s === "ok") return "Conforme";
  if (s === "no") return "Non conforme";
  return "Non applicable";
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function localDateISO(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftLocalDate(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDateISO(d);
}

export function formatDayHeading(isoDate: string) {
  const s = new Date(`${isoDate}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatLocalDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}
