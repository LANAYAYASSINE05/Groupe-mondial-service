import type {
  Control,
  ControlItem,
  DayLog,
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
    "b0000000-0000-4000-8000-000000000007",
    "b0000000-0000-4000-8000-000000000008",
    "b0000000-0000-4000-8000-000000000009",
    "b0000000-0000-4000-8000-00000000000a",
    "b0000000-0000-4000-8000-00000000000b",
    "b0000000-0000-4000-8000-00000000000c",
  ],
} as const;

const NO_COMMENTS: Record<string, string> = {
  tenue: "Tenue incomplète signalée au chef de poste.",
  registres: "Registre incomplet sur la nuit précédente.",
  gestion_badges: "Badge visiteur non restitué en fin de vacation.",
  gestion_cles: "Clé du local technique non inventoriée.",
  verification_cameras: "Caméra parking nord hors service.",
  etat_telephone: "Batterie téléphone de poste défaillante.",
  etat_talkie_walkie: "Talkie-walkie canal 2 inaudible.",
  guerites: "Guérite entrée : propreté insuffisante.",
  poste_garde: "Poste de garde : consignes non affichées.",
  application_consignes: "Ronde 02h non tracée.",
  qualite_prestation: "Accueil visiteur trop long (12 min).",
  passager_identite: "Badge non présenté à l'entrée.",
  passager_acces: "Tentative d'accès zone restreinte.",
  passager_comportement: "Comportement non conforme en zone sécurisée.",
  passager_consignes: "Consignes anti-COVID non respectées à l'accueil.",
  passager_circulation: "Stationnement véhicule hors emplacement prévu.",
};

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

function shiftMonday(weekStart: string, weeks: number) {
  const x = new Date(`${weekStart}T12:00:00`);
  x.setDate(x.getDate() + weeks * 7);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

function statesFor(
  formType: FormType,
  nos: string[] = [],
  nas: string[] = []
): ItemState[] {
  return CHECKLISTS[formType].items.map((item) => {
    if (nos.includes(item.key)) return "no";
    if (nas.includes(item.key)) return "na";
    return "ok";
  });
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
    comment:
      states[i] === "no"
        ? NO_COMMENTS[item.key] ?? "Écart constaté"
        : "",
    position: i + 1,
  }));
}

function makeControl(opts: {
  id: string;
  userId: string;
  establishmentId: string;
  formType: FormType;
  explanation: string;
  nos?: string[];
  nas?: string[];
  daysAgo: number;
  gps?: boolean;
}): Control {
  const states = statesFor(opts.formType, opts.nos, opts.nas);
  const items = buildItems(opts.formType, states, opts.id);
  const anomaly = items.some((i) => i.state === "no");
  const site = initialEstablishments.find((e) => e.id === opts.establishmentId)!;
  const user = initialUsers.find((u) => u.id === opts.userId)!;
  const jitter = Number.parseInt(opts.id.slice(-2), 16) || 1;
  return {
    id: opts.id,
    userId: opts.userId,
    establishmentId: opts.establishmentId,
    formType: opts.formType,
    explanation: opts.explanation,
    anomaly,
    latitude: opts.gps && site.latitude != null ? site.latitude + (jitter % 7) * 0.0003 : null,
    longitude: opts.gps && site.longitude != null ? site.longitude - (jitter % 5) * 0.0002 : null,
    geoAccuracy: opts.gps ? 10 + (jitter % 18) : null,
    geoVerified: !!opts.gps,
    createdAt: daysAgo(opts.daysAgo),
    establishment: site,
    user: { id: user.id, name: user.name, email: user.email },
    items,
  };
}

const NA_CHIENS = ["calendrier_vaccinations_chiens", "etat_niche"];
const NA_CHIENS_RONDE = [...NA_CHIENS, "horaire_ronde"];

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
    address: "Quartier Oasis, Casablanca",
    latitude: 33.5568,
    longitude: -7.6745,
    geoRadiusMeters: 800,
    active: true,
    createdAt: daysAgo(200),
  },
  {
    id: IDS.sites[6],
    name: "Aéroport Mohammed V",
    address: "Nouaceur, Casablanca",
    latitude: 33.3675,
    longitude: -7.5898,
    geoRadiusMeters: 1200,
    active: true,
    createdAt: daysAgo(180),
  },
  {
    id: IDS.sites[7],
    name: "Port de Casablanca",
    address: "Boulevard des Almohades, Casablanca",
    latitude: 33.6051,
    longitude: -7.6133,
    geoRadiusMeters: 1000,
    active: true,
    createdAt: daysAgo(180),
  },
  {
    id: IDS.sites[8],
    name: "Université Hassan II",
    address: "Route d'El Jadida, Casablanca",
    latitude: 33.5412,
    longitude: -7.6774,
    geoRadiusMeters: 900,
    active: true,
    createdAt: daysAgo(160),
  },
  {
    id: IDS.sites[9],
    name: "Hôtel Atlas Gueliz",
    address: "Avenue Mohammed V, Marrakech",
    latitude: 31.634,
    longitude: -8.0002,
    geoRadiusMeters: 600,
    active: true,
    createdAt: daysAgo(150),
  },
  {
    id: IDS.sites[10],
    name: "Zone franche Tanger Med",
    address: "Ksar Sghir, Tanger",
    latitude: 35.8902,
    longitude: -5.5046,
    geoRadiusMeters: 1500,
    active: true,
    createdAt: daysAgo(140),
  },
  {
    id: IDS.sites[11],
    name: "Usine Bouskoura",
    address: "Parc industriel Bouskoura",
    latitude: 33.4489,
    longitude: -7.6491,
    geoRadiusMeters: 800,
    active: true,
    createdAt: daysAgo(130),
  },
];

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
      { id: IDS.sites[6], name: "Aéroport Mohammed V" },
      { id: IDS.sites[7], name: "Port de Casablanca" },
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
      { id: IDS.sites[8], name: "Université Hassan II" },
      { id: IDS.sites[9], name: "Hôtel Atlas Gueliz" },
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
      { id: IDS.sites[10], name: "Zone franche Tanger Med" },
      { id: IDS.sites[11], name: "Usine Bouskoura" },
    ],
  },
];

function cid(n: number) {
  return `c0000000-0000-4000-8000-0000000000${n.toString(16).padStart(2, "0")}`;
}

/** Seed backend + historique étendu (stats, carte, rapports). */
export const initialControls: Control[] = [
  // — Seed Prisma (mêmes écarts / explications)
  makeControl({
    id: cid(1),
    userId: IDS.amine,
    establishmentId: IDS.sites[0],
    formType: "audit",
    explanation: "Ronde conforme dans l'ensemble.",
    nas: ["calendrier_vaccinations_chiens"],
    daysAgo: 1,
    gps: true,
  }),
  makeControl({
    id: cid(2),
    userId: IDS.amine,
    establishmentId: IDS.sites[1],
    formType: "audit",
    explanation: "Tenue incomplète signalée au chef de poste.",
    nos: ["tenue"],
    nas: NA_CHIENS_RONDE,
    daysAgo: 2,
    gps: true,
  }),
  makeControl({
    id: cid(3),
    userId: IDS.sara,
    establishmentId: IDS.sites[2],
    formType: "passager",
    explanation: "Contrôle d'accès OK.",
    daysAgo: 3,
    gps: true,
  }),
  makeControl({
    id: cid(4),
    userId: IDS.sara,
    establishmentId: IDS.sites[3],
    formType: "passager",
    explanation: "Badge non présenté à l'entrée.",
    nos: ["passager_identite"],
    nas: ["passager_epi"],
    daysAgo: 4,
  }),
  makeControl({
    id: cid(5),
    userId: IDS.karim,
    establishmentId: IDS.sites[4],
    formType: "audit",
    explanation: "Registre incomplet sur la nuit précédente.",
    nos: ["registres"],
    nas: NA_CHIENS,
    daysAgo: 5,
    gps: true,
  }),
  // — Semaine en cours / récente
  makeControl({
    id: cid(6),
    userId: IDS.amine,
    establishmentId: IDS.sites[6],
    formType: "audit",
    explanation: "Aéroport : ronde T1 conforme, caméra parking à surveiller.",
    nos: ["verification_cameras"],
    nas: NA_CHIENS,
    daysAgo: 0,
    gps: true,
  }),
  makeControl({
    id: cid(7),
    userId: IDS.amine,
    establishmentId: IDS.sites[7],
    formType: "passager",
    explanation: "Port : accès quai 3 conforme.",
    daysAgo: 1,
    gps: true,
  }),
  makeControl({
    id: cid(8),
    userId: IDS.sara,
    establishmentId: IDS.sites[8],
    formType: "audit",
    explanation: "Campus : consigne ronde 02h non tracée.",
    nos: ["application_consignes"],
    nas: NA_CHIENS,
    daysAgo: 6,
    gps: true,
  }),
  makeControl({
    id: cid(9),
    userId: IDS.sara,
    establishmentId: IDS.sites[9],
    formType: "passager",
    explanation: "Hôtel : passage lobby conforme.",
    daysAgo: 7,
    gps: true,
  }),
  makeControl({
    id: cid(10),
    userId: IDS.karim,
    establishmentId: IDS.sites[10],
    formType: "audit",
    explanation: "Tanger Med : prestation accueil à améliorer.",
    nos: ["qualite_prestation"],
    nas: NA_CHIENS,
    daysAgo: 8,
    gps: true,
  }),
  makeControl({
    id: cid(11),
    userId: IDS.karim,
    establishmentId: IDS.sites[11],
    formType: "passager",
    explanation: "Usine : zone circulation non respectée.",
    nos: ["passager_circulation"],
    daysAgo: 9,
    gps: true,
  }),
  makeControl({
    id: cid(12),
    userId: IDS.amine,
    establishmentId: IDS.sites[0],
    formType: "passager",
    explanation: "Tour Horizon : visiteur hors zone autorisée.",
    nos: ["passager_acces"],
    daysAgo: 10,
    gps: true,
  }),
  // — Mois précédent
  makeControl({
    id: cid(13),
    userId: IDS.amine,
    establishmentId: IDS.sites[1],
    formType: "audit",
    explanation: "Entrepôt : gestion des clés à revoir.",
    nos: ["gestion_cles"],
    nas: NA_CHIENS,
    daysAgo: 14,
    gps: true,
  }),
  makeControl({
    id: cid(14),
    userId: IDS.sara,
    establishmentId: IDS.sites[2],
    formType: "audit",
    explanation: "Siège : contrôle mensuel conforme.",
    nas: NA_CHIENS,
    daysAgo: 16,
    gps: true,
  }),
  makeControl({
    id: cid(15),
    userId: IDS.sara,
    establishmentId: IDS.sites[3],
    formType: "audit",
    explanation: "Clinique : poste de garde — consignes non affichées.",
    nos: ["poste_garde"],
    nas: NA_CHIENS,
    daysAgo: 18,
    gps: true,
  }),
  makeControl({
    id: cid(16),
    userId: IDS.karim,
    establishmentId: IDS.sites[4],
    formType: "passager",
    explanation: "Marina : passage conforme.",
    daysAgo: 19,
    gps: true,
  }),
  makeControl({
    id: cid(17),
    userId: IDS.amine,
    establishmentId: IDS.sites[6],
    formType: "passager",
    explanation: "Aéroport : identité / badge OK.",
    daysAgo: 21,
    gps: true,
  }),
  makeControl({
    id: cid(18),
    userId: IDS.karim,
    establishmentId: IDS.sites[11],
    formType: "audit",
    explanation: "Usine : téléphone de poste HS.",
    nos: ["etat_telephone"],
    nas: NA_CHIENS,
    daysAgo: 23,
    gps: true,
  }),
  makeControl({
    id: cid(19),
    userId: IDS.sara,
    establishmentId: IDS.sites[8],
    formType: "passager",
    explanation: "Université : comportement non conforme.",
    nos: ["passager_comportement"],
    daysAgo: 25,
    gps: true,
  }),
  makeControl({
    id: cid(20),
    userId: IDS.amine,
    establishmentId: IDS.sites[7],
    formType: "audit",
    explanation: "Port : badges visiteurs non restitués.",
    nos: ["gestion_badges"],
    nas: NA_CHIENS_RONDE,
    daysAgo: 28,
    gps: true,
  }),
  // — Mois -2
  makeControl({
    id: cid(21),
    userId: IDS.sara,
    establishmentId: IDS.sites[9],
    formType: "audit",
    explanation: "Marrakech : guérite entrée à nettoyer.",
    nos: ["guerites"],
    nas: NA_CHIENS,
    daysAgo: 35,
    gps: true,
  }),
  makeControl({
    id: cid(22),
    userId: IDS.karim,
    establishmentId: IDS.sites[10],
    formType: "passager",
    explanation: "Tanger Med : consignes non respectées à l'accueil.",
    nos: ["passager_consignes"],
    nas: ["passager_epi"],
    daysAgo: 38,
    gps: true,
  }),
  makeControl({
    id: cid(23),
    userId: IDS.amine,
    establishmentId: IDS.sites[0],
    formType: "audit",
    explanation: "Tour Horizon : contrôle mensuel conforme.",
    nas: NA_CHIENS,
    daysAgo: 42,
    gps: true,
  }),
  makeControl({
    id: cid(24),
    userId: IDS.sara,
    establishmentId: IDS.sites[2],
    formType: "passager",
    explanation: "Siège : passage conforme.",
    daysAgo: 45,
    gps: true,
  }),
  makeControl({
    id: cid(25),
    userId: IDS.karim,
    establishmentId: IDS.sites[4],
    formType: "audit",
    explanation: "Marina : talkie-walkie défaillant.",
    nos: ["etat_talkie_walkie"],
    nas: NA_CHIENS,
    daysAgo: 48,
    gps: true,
  }),
  makeControl({
    id: cid(26),
    userId: IDS.amine,
    establishmentId: IDS.sites[1],
    formType: "passager",
    explanation: "Entrepôt Nord : accès conforme.",
    daysAgo: 52,
    gps: true,
  }),
  makeControl({
    id: cid(27),
    userId: IDS.sara,
    establishmentId: IDS.sites[3],
    formType: "audit",
    explanation: "Clinique : contrôle mensuel conforme.",
    nas: NA_CHIENS,
    daysAgo: 56,
    gps: true,
  }),
  makeControl({
    id: cid(28),
    userId: IDS.karim,
    establishmentId: IDS.sites[11],
    formType: "passager",
    explanation: "Usine Bouskoura : passage conforme.",
    daysAgo: 60,
    gps: true,
  }),
];

function buildInitialPlans(): PlannedControl[] {
  const thisWeek = mondayOfWeek();
  const lastWeek = shiftMonday(thisWeek, -1);
  const twoWeeksAgo = shiftMonday(thisWeek, -2);
  const threeWeeksAgo = shiftMonday(thisWeek, -3);
  const nextWeek = shiftMonday(thisWeek, 1);
  const day = (weekStart: string, offset: number, hour: number) => {
    const d = new Date(`${weekStart}T00:00:00`);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const mk = (
    n: number,
    siteIdx: number,
    weekStart: string,
    dayOffset: number,
    status: PlanStatus,
    assigneeIds: string[],
    notes: string,
    controlId?: string | null
  ): PlannedControl => {
    const from = day(weekStart, dayOffset, 9);
    const until = day(weekStart, dayOffset, 12);
    const site = initialEstablishments[siteIdx];
    const assignees = assigneeIds.map((uid) => {
      const u = initialUsers.find((x) => x.id === uid)!;
      return { id: u.id, name: u.name, email: u.email };
    });
    const linked = controlId
      ? initialControls.find((c) => c.id === controlId)
      : undefined;
    return {
      id: `p0000000-0000-4000-8000-0000000000${n.toString(16).padStart(2, "0")}`,
      establishmentId: site.id,
      clientName: "Mondial Service",
      weekStart,
      plannedAt: from.toISOString(),
      plannedUntil: until.toISOString(),
      dayIndex: dayOffset,
      dayLabel: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][dayOffset],
      status,
      notes,
      controlId: linked?.id ?? null,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
      establishment: { id: site.id, name: site.name, address: site.address },
      assignees,
      control: linked
        ? {
            id: linked.id,
            formType: linked.formType,
            anomaly: linked.anomaly,
            createdAt: linked.createdAt,
            userName:
              initialUsers.find((u) => u.id === linked.userId)?.name ?? "—",
          }
        : null,
    };
  };

  return [
    // Semaine en cours — tous les sites actifs sauf le site jamais visité
    mk(1, 0, thisWeek, 0, "termine", [IDS.amine], "Ronde matin T1", cid(1)),
    mk(2, 1, thisWeek, 1, "planifie", [IDS.amine], "Audit entrepôt"),
    mk(3, 2, thisWeek, 2, "en_cours", [IDS.sara], "Siège — en cours"),
    mk(4, 3, thisWeek, 3, "planifie", [IDS.sara], "Clinique Atlas"),
    mk(5, 4, thisWeek, 4, "planifie", [IDS.karim], "Marina — après-midi"),
    mk(6, 6, thisWeek, 5, "planifie", [IDS.amine], "Aéroport T1/T2"),
    mk(7, 7, thisWeek, 0, "termine", [IDS.amine], "Port — quai 3", cid(7)),
    mk(8, 8, thisWeek, 1, "non_effectue", [IDS.sara], "Campus reporté"),
    mk(9, 9, thisWeek, 4, "planifie", [IDS.sara], "Hôtel Gueliz"),
    mk(10, 10, thisWeek, 3, "planifie", [IDS.karim], "Tanger Med"),
    mk(11, 11, thisWeek, 2, "en_cours", [IDS.karim], "Usine Bouskoura"),
    // Semaine précédente — réalisés
    mk(12, 0, lastWeek, 0, "termine", [IDS.amine], "Hebdo Tour Horizon", cid(23)),
    mk(13, 2, lastWeek, 2, "termine", [IDS.sara], "Hebdo siège", cid(14)),
    mk(14, 4, lastWeek, 4, "termine", [IDS.karim], "Hebdo Marina", cid(16)),
    mk(15, 1, lastWeek, 1, "termine", [IDS.amine], "Entrepôt Nord", cid(13)),
    mk(16, 3, lastWeek, 3, "termine", [IDS.sara], "Clinique", cid(15)),
    mk(17, 11, lastWeek, 5, "non_effectue", [IDS.karim], "Usine — agent absent"),
    mk(18, 0, twoWeeksAgo, 1, "termine", [IDS.amine], "Tour Horizon — ronde"),
    mk(19, 6, twoWeeksAgo, 3, "termine", [IDS.amine], "Aéroport — passager"),
    mk(20, 8, twoWeeksAgo, 4, "planifie", [IDS.sara], "Campus Hassan II"),
    mk(21, 3, threeWeeksAgo, 2, "termine", [IDS.sara], "Clinique Atlas — audit"),
    mk(22, 10, threeWeeksAgo, 5, "non_effectue", [IDS.karim], "Tanger Med reporté"),
    mk(23, 4, nextWeek, 0, "planifie", [IDS.karim], "Marina — ouverture mois"),
    mk(24, 2, nextWeek, 1, "planifie", [IDS.sara], "Siège — suivi"),
    mk(25, 1, nextWeek, 2, "planifie", [IDS.amine], "Entrepôt Nord"),
    mk(
      26,
      1,
      thisWeek,
      (new Date().getDay() + 6) % 7,
      "planifie",
      [IDS.amine],
      "Créneau du jour — à reporter"
    ),
  ];
}

export type MockStore = {
  users: User[];
  establishments: Establishment[];
  controls: Control[];
  plans: PlannedControl[];
  dayLogs: DayLog[];
  userEstablishments: { userId: string; establishmentId: string }[];
};

function dateOnlyDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildInitialDayLogs(): DayLog[] {
  return [
    {
      id: "d0000000-0000-4000-8000-000000000001",
      userId: IDS.amine,
      date: dateOnlyDaysAgo(0),
      text: "Matin — audit Tour Horizon, checklist complète, une caméra parking nord hors service. Après-midi — passager Port de Casablanca, RAS. Point à suivre : relance maintenance caméra.",
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      id: "d0000000-0000-4000-8000-000000000002",
      userId: IDS.amine,
      date: dateOnlyDaysAgo(1),
      text: "Contrôles Entrepôt Nord (audit) et Aéroport (passager). Anomalie registre nuit précédente signalée au chef de poste.",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: "d0000000-0000-4000-8000-000000000003",
      userId: IDS.sara,
      date: dateOnlyDaysAgo(0),
      text: "Clinique Atlas — contrôle passager. Tenue incomplète à l’accueil, rappel des consignes. Siège : suivi du contrôle en cours.",
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      id: "d0000000-0000-4000-8000-000000000004",
      userId: IDS.karim,
      date: dateOnlyDaysAgo(0),
      text: "Matin — passager Marina. Après-midi — Tanger Med planifié. RAS sur les accès, un véhicule hors emplacement.",
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      id: "d0000000-0000-4000-8000-000000000005",
      userId: IDS.karim,
      date: dateOnlyDaysAgo(2),
      text: "Usine Bouskoura : contrôle en cours, consignes ronde 02h non tracées. Relance prévue demain.",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ];
}

export function createStore(): MockStore {
  return {
    users: structuredClone(initialUsers),
    establishments: structuredClone(initialEstablishments),
    controls: structuredClone(initialControls),
    plans: structuredClone(buildInitialPlans()),
    dayLogs: structuredClone(buildInitialDayLogs()),
    userEstablishments: [
      { userId: IDS.amine, establishmentId: IDS.sites[0] },
      { userId: IDS.amine, establishmentId: IDS.sites[1] },
      { userId: IDS.amine, establishmentId: IDS.sites[6] },
      { userId: IDS.amine, establishmentId: IDS.sites[7] },
      { userId: IDS.sara, establishmentId: IDS.sites[2] },
      { userId: IDS.sara, establishmentId: IDS.sites[3] },
      { userId: IDS.sara, establishmentId: IDS.sites[8] },
      { userId: IDS.sara, establishmentId: IDS.sites[9] },
      { userId: IDS.karim, establishmentId: IDS.sites[4] },
      { userId: IDS.karim, establishmentId: IDS.sites[5] },
      { userId: IDS.karim, establishmentId: IDS.sites[10] },
      { userId: IDS.karim, establishmentId: IDS.sites[11] },
    ],
  };
}

let store: MockStore | null = null;

export function getStore() {
  if (!store) store = createStore();
  if (!Array.isArray(store.dayLogs)) {
    store.dayLogs = structuredClone(buildInitialDayLogs());
  }
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
