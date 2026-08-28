import { ApiError, getToken, localDateISO, type ChecklistDef, type Control, type DayLog, type FormType, type PlannedControl, type PlanStatus, type User } from "@/lib/api-client";
import { CHECKLISTS } from "./mock/checklists";
import {
  daysAgo,
  getStore,
  makeMockToken,
  mondayOfWeek,
  parseMockToken,
  type MockStore,
} from "./mock/store";

function delay(ms = 180) {
  return new Promise((r) => setTimeout(r, ms));
}

function requestHeaders(options: RequestInit): Headers {
  const headers = new Headers();
  const raw = options.headers;
  if (raw instanceof Headers) {
    raw.forEach((value, key) => headers.set(key, value));
  } else if (Array.isArray(raw)) {
    for (const [key, value] of raw) headers.set(key, value);
  } else if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) {
      if (value != null) headers.set(key, String(value));
    }
  }
  const stored = getToken();
  if (stored && !headers.get("Authorization")) {
    headers.set("Authorization", `Bearer ${stored}`);
  }
  return headers;
}

function authUser(headers: Headers): User {
  const auth = headers.get("Authorization") || "";
  const fromHeader = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  const token = fromHeader || getToken();
  const user = parseMockToken(token);
  if (!user) throw new ApiError("Non authentifié.", 401);
  return user;
}

function uuid() {
  return crypto.randomUUID();
}

function userEstablishments(user: User, s: MockStore) {
  if (user.role === "admin") return s.establishments.filter((e) => e.active);
  const ids = new Set(
    s.userEstablishments
      .filter((ue) => ue.userId === user.id)
      .map((ue) => ue.establishmentId)
  );
  return s.establishments.filter((e) => e.active && ids.has(e.id));
}

function enrichUser(u: User, s: MockStore): User {
  const ests = userEstablishments(u, s).map((e) => ({ id: e.id, name: e.name }));
  return { ...u, establishments: ests };
}

function filterControls(s: MockStore, params: URLSearchParams, scopeUserId?: string) {
  let list = [...s.controls];
  if (scopeUserId) list = list.filter((c) => c.userId === scopeUserId);

  const from = params.get("from");
  const to = params.get("to");
  const establishmentId = params.get("establishmentId");
  const userId = params.get("userId");
  const formType = params.get("formType");
  const anomaly = params.get("anomaly");

  if (from) list = list.filter((c) => c.createdAt >= new Date(from).toISOString());
  if (to) {
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    list = list.filter((c) => c.createdAt <= t.toISOString());
  }
  if (establishmentId) list = list.filter((c) => c.establishmentId === establishmentId);
  if (userId) list = list.filter((c) => c.userId === userId);
  if (formType === "audit" || formType === "passager") {
    list = list.filter((c) => c.formType === formType);
  }
  if (anomaly === "true") list = list.filter((c) => c.anomaly);
  if (anomaly === "false") list = list.filter((c) => !c.anomaly);

  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function buildReports(s: MockStore, controls: Control[]) {
  const visited = new Set(controls.map((c) => c.establishmentId));
  const unvisitedSites = s.establishments
    .filter((e) => e.active && !visited.has(e.id))
    .map((e) => ({ id: e.id, name: e.name }));

  const kpis = {
    total: controls.length,
    anomalies: controls.filter((c) => c.anomaly).length,
    audit: controls.filter((c) => c.formType === "audit").length,
    passager: controls.filter((c) => c.formType === "passager").length,
    unvisitedSites,
  };

  const bySiteMap = new Map<string, { establishmentId: string; name: string; total: number; anomalies: number; audit: number; passager: number }>();
  const byControllerMap = new Map<string, { userId: string; name: string; total: number; anomalies: number; audit: number; passager: number }>();

  for (const c of controls) {
    const siteName = c.establishment?.name ?? "—";
    const sRow = bySiteMap.get(c.establishmentId) ?? {
      establishmentId: c.establishmentId,
      name: siteName,
      total: 0,
      anomalies: 0,
      audit: 0,
      passager: 0,
    };
    sRow.total++;
    if (c.anomaly) sRow.anomalies++;
    if (c.formType === "audit") sRow.audit++;
    else sRow.passager++;
    bySiteMap.set(c.establishmentId, sRow);

    const uRow = byControllerMap.get(c.userId) ?? {
      userId: c.userId,
      name: c.user?.name ?? "—",
      total: 0,
      anomalies: 0,
      audit: 0,
      passager: 0,
    };
    uRow.total++;
    if (c.anomaly) uRow.anomalies++;
    if (c.formType === "audit") uRow.audit++;
    else uRow.passager++;
    byControllerMap.set(c.userId, uRow);
  }

  const byMonthMap = new Map<string, { month: string; label: string; total: number; anomalies: number }>();
  for (const c of controls) {
    const d = new Date(c.createdAt);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const m = byMonthMap.get(month) ?? { month, label, total: 0, anomalies: 0 };
    m.total++;
    if (c.anomaly) m.anomalies++;
    byMonthMap.set(month, m);
  }

  const formBreakdown = (formType: FormType) => {
    const subset = controls.filter((c) => c.formType === formType);
    return {
      total: subset.length,
      anomalies: subset.filter((c) => c.anomaly).length,
      bySite: [...bySiteMap.values()]
        .map((r) => ({
          establishmentId: r.establishmentId,
          name: r.name,
          total: controls.filter((c) => c.establishmentId === r.establishmentId && c.formType === formType).length,
          anomalies: controls.filter((c) => c.establishmentId === r.establishmentId && c.formType === formType && c.anomaly).length,
        }))
        .filter((r) => r.total > 0),
      byController: [...byControllerMap.values()]
        .map((r) => ({
          userId: r.userId,
          name: r.name,
          total: controls.filter((c) => c.userId === r.userId && c.formType === formType).length,
          anomalies: controls.filter((c) => c.userId === r.userId && c.formType === formType && c.anomaly).length,
        }))
        .filter((r) => r.total > 0),
      byMonth: [...byMonthMap.values()],
    };
  };

  const byItemMap = new Map<string, { formType: FormType; itemKey: string; label: string; ok: number; no: number; na: number }>();
  for (const c of controls) {
    for (const item of c.items ?? []) {
      const key = `${c.formType}:${item.itemKey}`;
      const row = byItemMap.get(key) ?? {
        formType: c.formType,
        itemKey: item.itemKey,
        label: item.label,
        ok: 0,
        no: 0,
        na: 0,
      };
      if (item.state === "ok") row.ok++;
      else if (item.state === "no") row.no++;
      else row.na++;
      byItemMap.set(key, row);
    }
  }

  return {
    kpis,
    controls,
    summaries: {
      bySite: [...bySiteMap.values()],
      byController: [...byControllerMap.values()],
      byItem: [...byItemMap.values()],
      byMonth: [...byMonthMap.values()],
      byFormType: {
        audit: formBreakdown("audit"),
        passager: formBreakdown("passager"),
      },
    },
  };
}

function buildWeekPayload(s: MockStore, weekStart: string) {
  const ws = new Date(`${weekStart}T12:00:00`);
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const plans = s.plans.filter((p) => p.weekStart === weekStart);

  const rowMap = new Map<string, {
    establishmentId: string;
    siteName: string;
    clientName: string;
    byDay: (PlannedControl | null)[];
    reportRefs: { id: string; label: string }[];
  }>();

  for (const p of plans) {
    let row = rowMap.get(p.establishmentId);
    if (!row) {
      row = {
        establishmentId: p.establishmentId,
        siteName: p.establishment.name,
        clientName: p.clientName,
        byDay: Array(7).fill(null),
        reportRefs: [],
      };
      rowMap.set(p.establishmentId, row);
    }
    row.byDay[p.dayIndex] = p;
    if (p.controlId) {
      row.reportRefs.push({ id: p.controlId, label: `Ctrl ${p.dayLabel}` });
    }
  }

  const kpis = {
    total: plans.length,
    planifie: plans.filter((p) => p.status === "planifie").length,
    enCours: plans.filter((p) => p.status === "en_cours").length,
    termine: plans.filter((p) => p.status === "termine").length,
    nonEffectue: plans.filter((p) => p.status === "non_effectue").length,
  };

  return {
    weekStart,
    weekEnd: we.toISOString().slice(0, 10),
    dayLabels,
    plans,
    rows: [...rowMap.values()],
    kpis,
  };
}

export async function mockApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  await delay();
  const s = getStore();
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(path, "http://mock.local");
  const pathname = url.pathname;
  const params = url.searchParams;
  const reqHeaders = requestHeaders(options);
  let body: Record<string, unknown> = {};
  if (options.body && typeof options.body === "string") {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  // Auth
  if (pathname === "/api/auth/login" && method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const user = s.users.find((u) => u.email.toLowerCase() === email && u.active);
    if (!user) throw new ApiError("Identifiants invalides.", 401);
    return {
      token: makeMockToken(user.id),
      user: enrichUser(user, s),
    } as T;
  }

  if (pathname === "/api/auth/me" && method === "GET") {
    const user = enrichUser(authUser(reqHeaders), s);
    return { user } as T;
  }

  const user = authUser(reqHeaders);

  // Checklists
  const checklistMatch = pathname.match(/^\/api\/checklists\/(audit|passager)$/);
  if (checklistMatch && method === "GET") {
    return CHECKLISTS[checklistMatch[1] as FormType] as T;
  }

  // Establishments (terrain)
  if (pathname === "/api/establishments" && method === "GET") {
    return { establishments: userEstablishments(user, s) } as T;
  }

  // Admin establishments
  if (pathname === "/api/admin/establishments" && method === "GET") {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    return { establishments: s.establishments } as T;
  }

  if (pathname === "/api/admin/establishments" && method === "POST") {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    const est = {
      id: uuid(),
      name: String(body.name || "Nouveau site"),
      address: String(body.address || ""),
      latitude: body.latitude != null ? Number(body.latitude) : null,
      longitude: body.longitude != null ? Number(body.longitude) : null,
      geoRadiusMeters: Number(body.geoRadiusMeters) || 500,
      active: true,
      createdAt: new Date().toISOString(),
    };
    s.establishments.push(est);
    return { establishment: est } as T;
  }

  const estMatch = pathname.match(/^\/api\/admin\/establishments\/([^/]+)$/);
  if (estMatch) {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    const id = estMatch[1];
    const idx = s.establishments.findIndex((e) => e.id === id);
    if (idx < 0) throw new ApiError("Site introuvable.", 404);
    if (method === "PUT" || method === "PATCH") {
      s.establishments[idx] = {
        ...s.establishments[idx],
        ...(body.name != null ? { name: String(body.name) } : {}),
        ...(body.address != null ? { address: String(body.address) } : {}),
        ...(body.latitude !== undefined ? { latitude: body.latitude as number | null } : {}),
        ...(body.longitude !== undefined ? { longitude: body.longitude as number | null } : {}),
        ...(body.geoRadiusMeters != null ? { geoRadiusMeters: Number(body.geoRadiusMeters) } : {}),
        ...(body.active != null ? { active: Boolean(body.active) } : {}),
      };
      return { establishment: s.establishments[idx] } as T;
    }
    if (method === "DELETE") {
      s.establishments.splice(idx, 1);
      return undefined as T;
    }
  }

  // Users
  if (pathname === "/api/admin/users" && method === "GET") {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    return {
      users: s.users.map((u) => enrichUser(u, s)),
    } as T;
  }

  if (pathname === "/api/admin/users" && method === "POST") {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    const nu: User = {
      id: uuid(),
      name: String(body.name || ""),
      email: String(body.email || ""),
      role: body.role === "admin" ? "admin" : "controleur",
      active: true,
      createdAt: new Date().toISOString(),
      establishments: [],
    };
    s.users.push(nu);
    const estIds = (body.establishmentIds as string[]) || [];
    for (const eid of estIds) {
      s.userEstablishments.push({ userId: nu.id, establishmentId: eid });
    }
    return { user: enrichUser(nu, s) } as T;
  }

  const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (userMatch) {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    const id = userMatch[1];
    const idx = s.users.findIndex((u) => u.id === id);
    if (idx < 0) throw new ApiError("Utilisateur introuvable.", 404);
    if (method === "PUT" || method === "PATCH") {
      const u = s.users[idx];
      s.users[idx] = {
        ...u,
        ...(body.name != null ? { name: String(body.name) } : {}),
        ...(body.email != null ? { email: String(body.email) } : {}),
        ...(body.role != null ? { role: body.role === "admin" ? "admin" : "controleur" } : {}),
        ...(body.active != null ? { active: Boolean(body.active) } : {}),
      };
      if (Array.isArray(body.establishmentIds)) {
        s.userEstablishments = s.userEstablishments.filter((ue) => ue.userId !== id);
        for (const eid of body.establishmentIds as string[]) {
          s.userEstablishments.push({ userId: id, establishmentId: eid });
        }
      }
      return { user: enrichUser(s.users[idx], s) } as T;
    }
    if (method === "DELETE") {
      s.users.splice(idx, 1);
      s.userEstablishments = s.userEstablishments.filter((ue) => ue.userId !== id);
      return undefined as T;
    }
  }

  // Controls
  if (pathname === "/api/controls/mine" && method === "GET") {
    const controls = filterControls(s, params, user.id);
    return { controls } as T;
  }

  const controlMatch = pathname.match(/^\/api\/controls\/([^/]+)$/);
  if (controlMatch && method === "GET") {
    const c = s.controls.find((x) => x.id === controlMatch[1]);
    if (!c) throw new ApiError("Contrôle introuvable.", 404);
    if (user.role !== "admin" && c.userId !== user.id) {
      throw new ApiError("Accès refusé.", 403);
    }
    return { control: c } as T;
  }

  if (pathname === "/api/controls" && method === "POST") {
    const formType = body.formType as FormType;
    const def = CHECKLISTS[formType];
    if (!def) throw new ApiError("Type invalide.", 400);
    const est = s.establishments.find((e) => e.id === body.establishmentId);
    if (!est) throw new ApiError("Site invalide.", 400);
    const id = uuid();
    const items = (body.items as { itemKey: string; state: string; comment?: string }[]).map(
      (it, i) => {
        const label = def.items.find((x) => x.key === it.itemKey)?.label ?? it.itemKey;
        return {
          id: `${id}-item-${i + 1}`,
          itemKey: it.itemKey,
          label,
          state: it.state as "ok" | "no" | "na",
          comment: it.comment || "",
          position: i + 1,
        };
      }
    );
    const control: Control = {
      id,
      userId: user.id,
      establishmentId: est.id,
      formType,
      explanation: String(body.explanation || ""),
      anomaly: items.some((i) => i.state === "no"),
      latitude: body.latitude != null ? Number(body.latitude) : null,
      longitude: body.longitude != null ? Number(body.longitude) : null,
      geoAccuracy: body.geoAccuracy != null ? Number(body.geoAccuracy) : null,
      geoVerified: Boolean(body.geoVerified),
      createdAt: new Date().toISOString(),
      establishment: est,
      user: { id: user.id, name: user.name, email: user.email },
      items,
    };
    s.controls.unshift(control);
    return { control: { id: control.id } } as T;
  }

  // Stats
  if (pathname === "/api/stats/mine" && method === "GET") {
    const mine = filterControls(s, params, user.id);
    return {
      stats: {
        total: mine.length,
        anomalies: mine.filter((c) => c.anomaly).length,
        audit: mine.filter((c) => c.formType === "audit").length,
        passager: mine.filter((c) => c.formType === "passager").length,
        recent: mine.slice(0, 5),
      },
    } as T;
  }

  // Reports
  if (pathname === "/api/reports/map" && method === "GET") {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    const controls = filterControls(s, params);
    const establishments = s.establishments.filter(
      (e) => e.active && e.latitude != null && e.longitude != null
    );
    const mapControls = controls
      .filter((c) => c.latitude != null && c.longitude != null)
      .slice(0, 300)
      .map((c) => ({
        id: c.id,
        latitude: c.latitude!,
        longitude: c.longitude!,
        hasGps: true,
        geoVerified: c.geoVerified ?? false,
        formType: c.formType,
        anomaly: c.anomaly,
        createdAt: c.createdAt,
        siteId: c.establishmentId,
        siteName: c.establishment?.name ?? "—",
        controllerName: c.user?.name ?? "—",
      }));
    return {
      establishments,
      controls: mapControls,
      stats: {
        withGps: mapControls.length,
        totalControls: controls.length,
        sitesOnMap: establishments.length,
      },
    } as T;
  }

  if (pathname === "/api/reports" && method === "GET") {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    const controls = filterControls(s, params);
    return buildReports(s, controls) as T;
  }

  // Planning
  if (pathname === "/api/planning/week" && method === "GET") {
    const weekStart = params.get("weekStart") || mondayOfWeek();
    return buildWeekPayload(s, weekStart) as T;
  }

  if (pathname === "/api/planning/history" && method === "GET") {
    const establishmentId = params.get("establishmentId");
    if (!establishmentId) throw new ApiError("Site requis.", 400);
    const est = s.establishments.find((e) => e.id === establishmentId);
    if (!est) throw new ApiError("Site introuvable.", 404);
    const planned = s.plans.filter((p) => p.establishmentId === establishmentId);
    const controls = s.controls
      .filter((c) => c.establishmentId === establishmentId)
      .map((c, i) => ({
        id: c.id,
        formType: c.formType,
        anomaly: c.anomaly,
        createdAt: c.createdAt,
        user: c.user ?? { id: c.userId, name: "—", email: "" },
        ref: `CTRL-${i + 1}`,
      }));
    return {
      establishment: { id: est.id, name: est.name, address: est.address },
      planned,
      controls,
    } as T;
  }

  if (pathname === "/api/planning" && method === "POST") {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    const est = s.establishments.find((e) => e.id === body.establishmentId);
    if (!est) throw new ApiError("Site invalide.", 400);
    const plannedAt = new Date(String(body.plannedAt));
    const weekStart = mondayOfWeek(plannedAt);
    const dayIndex = Math.min(
      6,
      Math.max(0, Math.floor((plannedAt.getTime() - new Date(`${weekStart}T12:00:00`).getTime()) / 86400000))
    );
    const assigneeIds = (body.assigneeIds as string[]) || [];
    const assignees = assigneeIds.map((uid) => {
      const u = s.users.find((x) => x.id === uid)!;
      return { id: u.id, name: u.name, email: u.email };
    });
    const plan: PlannedControl = {
      id: uuid(),
      establishmentId: est.id,
      clientName: String(body.clientName || ""),
      weekStart,
      plannedAt: String(body.plannedAt),
      plannedUntil: String(body.plannedUntil),
      dayIndex,
      dayLabel: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][dayIndex],
      status: (body.status as PlanStatus) || "planifie",
      notes: String(body.notes || ""),
      controlId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      establishment: { id: est.id, name: est.name, address: est.address },
      assignees,
      control: null,
    };
    s.plans.push(plan);
    return { plan } as T;
  }

  const planMatch = pathname.match(/^\/api\/planning\/([^/]+)$/);
  if (planMatch) {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    const id = planMatch[1];
    const idx = s.plans.findIndex((p) => p.id === id);
    if (idx < 0) throw new ApiError("Plan introuvable.", 404);
    if (method === "PUT" || method === "PATCH") {
      const p = s.plans[idx];
      s.plans[idx] = {
        ...p,
        ...(body.status != null ? { status: body.status as PlanStatus } : {}),
        ...(body.notes != null ? { notes: String(body.notes) } : {}),
        ...(body.plannedAt != null ? { plannedAt: String(body.plannedAt) } : {}),
        ...(body.plannedUntil != null ? { plannedUntil: String(body.plannedUntil) } : {}),
        updatedAt: new Date().toISOString(),
      };
      return { plan: s.plans[idx] } as T;
    }
    if (method === "DELETE") {
      s.plans.splice(idx, 1);
      return undefined as T;
    }
  }

  function enrichDayLog(log: DayLog): DayLog {
    const u = s.users.find((x) => x.id === log.userId);
    return {
      ...log,
      user: u ? { id: u.id, name: u.name, email: u.email } : undefined,
    };
  }

  const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;

  if (pathname === "/api/day-logs" && method === "GET") {
    const date = params.get("date") || localDateISO();
    const mine = s.dayLogs.filter((l) => l.userId === user.id);
    const log = mine.find((l) => l.date === date) ?? null;
    const recent = [...mine]
      .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 20)
      .map(enrichDayLog);
    return { log: log ? enrichDayLog(log) : null, recent } as T;
  }

  if (pathname === "/api/day-logs" && method === "PUT") {
    const date = String(body.date || "").trim();
    const text = String(body.text || "").trim();
    if (!isoDateRe.test(date)) {
      throw new ApiError("Date invalide.", 400);
    }
    if (!text) {
      throw new ApiError("Le texte de la journée est obligatoire.", 400);
    }
    const now = new Date().toISOString();
    const idx = s.dayLogs.findIndex(
      (l) => l.userId === user.id && l.date === date
    );
    if (idx >= 0) {
      s.dayLogs[idx] = {
        ...s.dayLogs[idx],
        text,
        updatedAt: now,
      };
      return { log: enrichDayLog(s.dayLogs[idx]) } as T;
    }
    const created: DayLog = {
      id: uuid(),
      userId: user.id,
      date,
      text,
      createdAt: now,
      updatedAt: now,
    };
    s.dayLogs.push(created);
    return { log: enrichDayLog(created) } as T;
  }

  if (pathname === "/api/admin/day-logs" && method === "GET") {
    if (user.role !== "admin") throw new ApiError("Accès refusé.", 403);
    const date = params.get("date");
    const userId = params.get("userId");
    let logs = [...s.dayLogs];
    if (date) logs = logs.filter((l) => l.date === date);
    if (userId) logs = logs.filter((l) => l.userId === userId);
    logs.sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)
    );
    return { logs: logs.map(enrichDayLog) } as T;
  }

  // CSV export stub
  if (pathname.startsWith("/api/reports/export") && method === "GET") {
    const blob = new Blob(["\uFEFFDémo — export CSV indisponible en mode mock\r\n"], {
      type: "text/csv;charset=utf-8",
    });
    return blob as T;
  }

  throw new ApiError(`Route mock non implémentée: ${method} ${pathname}`, 404);
}

export function isMockMode() {
  return process.env.NEXT_PUBLIC_MOCK_API === "true";
}
