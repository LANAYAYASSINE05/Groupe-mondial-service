import type {
  Control,
  ControlItem,
  Establishment,
  FormType,
  ItemState,
  PlannedControl,
  PlanStatus,
  User,
} from "@/lib/api-client";
import { CHECKLISTS } from "./checklists";

export const DEMO_PASSWORD_HINT = "Password123! (tout mot de passe accepté en démo)";

const IDS = {
  admin: "a0000000-0000-4000-8000-000000000001",
  amine: "a0000000-0000-4000-8000-000000000002",
  sara: "a0000000-0000-4000-8000-000000000003",
  karim: "a0000000-0000-4000-8000-000000000004",
  sites: [
    "b0000000-0000-4000-8000-000000000001",
    "b0000000-0000-4000-8000-000000000002",
    "b0000000-0000-4000-8000-000000000003",
    "b0000000-0000-4000-8000-000000000004",
    "b0000000-0000-4000-8000-000000000005",
    "b0000000-0000-4000-8000-000000000006",
  ],
} as const;

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function mondayOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(12, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

function buildItems(
  formType: FormType,
  states: ItemState[],
  controlId: string
): ControlItem[] {
  const def = CHECKLISTS[formType];
  return def.items.map((item, i) => ({
    id: `${controlId}-item-${i + 1}`,
    itemKey: item.key,
    label: item.label,
    state: states[i] ?? "ok",
    comment: states[i] === "no" ? "Écart constaté" : "",
    position: i + 1,
  }));
}

function makeControl(opts: {
  id: string;
  userId: string;
  establishmentId: string;
  formType: FormType;
  explanation: string;
  states: ItemState[];
  daysAgo: number;
  gps?: { lat: number; lng: number };
}): Control {
  const items = buildItems(opts.formType, opts.states, opts.id);
  const anomaly = items.some((i) => i.state === "no");
  const site = initialEstablishments.find((e) => e.id === opts.establishmentId)!;
  const user = initialUsers.find((u) => u.id === opts.userId)!;
  return {
    id: opts.id,
    userId: opts.userId,
    establishmentId: opts.establishmentId,
    formType: opts.formType,
    explanation: opts.explanation,
    anomaly,
    latitude: opts.gps?.lat ?? null,
    longitude: opts.gps?.lng ?? null,
    geoAccuracy: opts.gps ? 15 : null,
    geoVerified: !!opts.gps,
    createdAt: daysAgo(opts.daysAgo),
    establishment: site,
    user: { id: user.id, name: user.name, email: user.email },
    items,
  };
}

export const initialUsers: User[] = [
  {
    id: IDS.admin,
    name: "Admin GMS",
    email: "admin@groupeservice.local",
    role: "admin",
    active: true,
    createdAt: daysAgo(120),
    establishments: [],
  },
  {
    id: IDS.amine,
    name: "Amine Benali",
    email: "amine@groupeservice.local",
    role: "controleur",
    active: true,
    createdAt: daysAgo(90),
    establishments: [
      { id: IDS.sites[0], name: "Tour Horizon" },
      { id: IDS.sites[1], name: "Entrepôt Nord" },
    ],
  },
  {
    id: IDS.sara,
    name: "Sara Dupont",
    email: "sara@groupeservice.local",
    role: "controleur",
    active: true,
    createdAt: daysAgo(60),
    establishments: [
      { id: IDS.sites[2], name: "Siège Groupe Service" },
      { id: IDS.sites[3], name: "Clinique Atlas" },
    ],
  },
  {
    id: IDS.karim,
    name: "Karim Traoré",
    email: "karim@groupeservice.local",
    role: "controleur",
    active: true,
    createdAt: daysAgo(45),
    establishments: [
      { id: IDS.sites[4], name: "Centre commercial Marina" },
      { id: IDS.sites[5], name: "Site non visité (démo)" },
    ],
  },
];

export const initialEstablishments: Establishment[] = [
  {
    id: IDS.sites[0],
    name: "Tour Horizon",
    address: "12 avenue des Lilas, Casablanca",
    latitude: 33.5892,
    longitude: -7.6034,
    geoRadiusMeters: 800,
    active: true,
    createdAt: daysAgo(200),
  },
  {
    id: IDS.sites[1],
    name: "Entrepôt Nord",
    address: "Zone industrielle Ain Sebaa",
    latitude: 33.6128,
    longitude: -7.5156,
    geoRadiusMeters: 800,
    active: true,
    createdAt: daysAgo(200),
  },
  {
    id: IDS.sites[2],
    name: "Siège Groupe Service",
    address: "Boulevard Anfa, Casablanca",
    latitude: 33.5921,
    longitude: -7.6324,
    geoRadiusMeters: 800,
    active: true,
    createdAt: daysAgo(200),
  },
  {
    id: IDS.sites[3],
    name: "Clinique Atlas",
    address: "Rue Ibn Sina, Rabat",
    latitude: 34.0131,
    longitude: -6.8326,
    geoRadiusMeters: 800,
    active: true,
    createdAt: daysAgo(200),
  },
  {
    id: IDS.sites[4],
    name: "Centre commercial Marina",
    address: "Corniche, Casablanca",
    latitude: 33.6042,
    longitude: -7.6201,
    geoRadiusMeters: 800,
    active: true,
    createdAt: daysAgo(200),
  },
  {
    id: IDS.sites[5],
    name: "Site non visité (démo)",
    address: "Quartier Oasis",
    latitude: 33.5568,
    longitude: -7.6745,
    geoRadiusMeters: 800,
    active: true,
    createdAt: daysAgo(200),
  },
];

const auditOk = Array<ItemState>(22).fill("ok");
const auditAnomaly: ItemState[] = [
  "ok", "no", "ok", "ok", "ok", "ok", "ok", "ok", "ok", "ok",
  "na", "na", "ok", "ok", "ok", "ok", "ok", "ok", "ok", "ok", "ok", "ok",
];

export const initialControls: Control[] = [
  makeControl({
    id: "c0000000-0000-4000-8000-000000000001",
    userId: IDS.amine,
    establishmentId: IDS.sites[0],
    formType: "audit",
    explanation: "Ronde conforme dans l'ensemble.",
    states: auditOk,
    daysAgo: 1,
    gps: { lat: 33.5895, lng: -7.603 },
  }),
  makeControl({
    id: "c0000000-0000-4000-8000-000000000002",
    userId: IDS.amine,
    establishmentId: IDS.sites[1],
    formType: "audit",
    explanation: "Tenue incomplète signalée au chef de poste.",
    states: auditAnomaly,
    daysAgo: 2,
    gps: { lat: 33.613, lng: -7.516 },
  }),
  makeControl({
    id: "c0000000-0000-4000-8000-000000000003",
    userId: IDS.sara,
    establishmentId: IDS.sites[2],
    formType: "passager",
    explanation: "Passage conforme.",
    states: ["ok", "ok", "ok", "ok", "ok", "ok", "ok"],
    daysAgo: 3,
    gps: { lat: 33.592, lng: -7.632 },
  }),
  makeControl({
    id: "c0000000-0000-4000-8000-000000000004",
    userId: IDS.karim,
    establishmentId: IDS.sites[4],
    formType: "passager",
    explanation: "Accès zone restreinte — badge vérifié.",
    states: ["ok", "ok", "no", "ok", "ok", "ok", "ok"],
    daysAgo: 5,
    gps: { lat: 33.604, lng: -7.62 },
  }),
  makeControl({
    id: "c0000000-0000-4000-8000-000000000005",
    userId: IDS.sara,
    establishmentId: IDS.sites[3],
    formType: "audit",
    explanation: "Contrôle mensuel clinique.",
    states: auditOk,
    daysAgo: 8,
  }),
];

function buildInitialPlans(): PlannedControl[] {
  const weekStart = mondayOfWeek();
  const ws = new Date(`${weekStart}T08:00:00`);
  const day = (offset: number, hour: number) => {
    const d = new Date(ws);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const mk = (
    id: string,
    siteIdx: number,
    dayOffset: number,
    status: PlanStatus,
    assigneeIds: string[]
  ): PlannedControl => {
    const from = day(dayOffset, 9);
    const until = day(dayOffset, 11);
    const site = initialEstablishments[siteIdx];
    const assignees = assigneeIds.map((uid) => {
      const u = initialUsers.find((x) => x.id === uid)!;
      return { id: u.id, name: u.name, email: u.email };
    });
    return {
      id,
      establishmentId: site.id,
      clientName: "Mondial Service",
      weekStart,
      plannedAt: from.toISOString(),
      plannedUntil: until.toISOString(),
      dayIndex: dayOffset,
      dayLabel: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][dayOffset],
      status,
      notes: "",
      controlId: status === "termine" ? initialControls[0]?.id ?? null : null,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
      establishment: { id: site.id, name: site.name, address: site.address },
      assignees,
      control:
        status === "termine" && initialControls[0]
          ? {
              id: initialControls[0].id,
              formType: initialControls[0].formType,
              anomaly: initialControls[0].anomaly,
              createdAt: initialControls[0].createdAt,
              userName: initialUsers.find((u) => u.id === IDS.amine)!.name,
            }
          : null,
    };
  };

  return [
    mk("p0000000-0000-4000-8000-000000000001", 0, 0, "termine", [IDS.amine]),
    mk("p0000000-0000-4000-8000-000000000002", 1, 1, "planifie", [IDS.amine]),
    mk("p0000000-0000-4000-8000-000000000003", 2, 2, "en_cours", [IDS.sara]),
    mk("p0000000-0000-4000-8000-000000000004", 4, 3, "planifie", [IDS.karim]),
  ];
}

export type MockStore = {
  users: User[];
  establishments: Establishment[];
  controls: Control[];
  plans: PlannedControl[];
  userEstablishments: { userId: string; establishmentId: string }[];
};

export function createStore(): MockStore {
  return {
    users: structuredClone(initialUsers),
    establishments: structuredClone(initialEstablishments),
    controls: structuredClone(initialControls),
    plans: structuredClone(buildInitialPlans()),
    userEstablishments: [
      { userId: IDS.amine, establishmentId: IDS.sites[0] },
      { userId: IDS.amine, establishmentId: IDS.sites[1] },
      { userId: IDS.sara, establishmentId: IDS.sites[2] },
      { userId: IDS.sara, establishmentId: IDS.sites[3] },
      { userId: IDS.karim, establishmentId: IDS.sites[4] },
      { userId: IDS.karim, establishmentId: IDS.sites[5] },
    ],
  };
}

let store: MockStore | null = null;

export function getStore() {
  if (!store) store = createStore();
  return store;
}

export function resetStore() {
  store = createStore();
}

export function parseMockToken(token: string | null): User | null {
  if (!token?.startsWith("mock:")) return null;
  const userId = token.slice(5);
  return getStore().users.find((u) => u.id === userId && u.active) ?? null;
}

export function makeMockToken(userId: string) {
  return `mock:${userId}`;
}

export { IDS, mondayOfWeek, daysAgo };
