// In-memory implementation of the API surface, backed by the built-in sample data. Lets the whole
// app run on localhost with no backend. Mutations persist for the session (until reload).
import type {
  AssistantReplyDTO,
  AuthResponse,
  CreateEventInput,
  CreateModificationInput,
  CreateVehicleInput,
  DecodeDTO,
  DocumentDTO,
  ExpenseSummaryDTO,
  FleetSummaryDTO,
  ModificationDTO,
  ReminderDTO,
  SaleReportRefDTO,
  ScanDTO,
  ScoreDTO,
  UploadFile,
  VehicleDTO,
  VehicleEventDTO,
} from "../api/client";
import { demoVehicles, type DemoVehicle } from "./data";

// Deep clone so in-session mutations don't mutate the source module.
const store: DemoVehicle[] = JSON.parse(JSON.stringify(demoVehicles));

const delay = <T>(value: T, ms = 280): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const find = (id: string): DemoVehicle => {
  const v = store.find((x) => x.id === id);
  if (!v) throw new Error("Fahrzeug nicht gefunden");
  return v;
};

const publicVehicle = (v: DemoVehicle): VehicleDTO => ({
  id: v.id,
  vin: v.vin,
  make: v.make,
  model: v.model,
  year: v.year,
  engine: v.engine,
  plate: v.plate,
  photoUrl: v.photoUrl,
  mileageKm: v.mileageKm,
  createdAt: v.createdAt,
  updatedAt: v.updatedAt,
});

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const demoApi = {
  register: (email: string): Promise<AuthResponse> =>
    delay({ token: "demo-token", user: { id: "demo-user", email } }),
  login: (email: string): Promise<AuthResponse> =>
    delay({ token: "demo-token", user: { id: "demo-user", email } }),

  listVehicles: (): Promise<VehicleDTO[]> => delay(store.map(publicVehicle)),
  getVehicle: (id: string): Promise<VehicleDTO> => delay(publicVehicle(find(id))),

  decodeVin: (vin: string): Promise<DecodeDTO> =>
    delay({
      vin,
      year: 2020,
      make: "Audi",
      model: "A4",
      engine: "2.0 TFSI",
      country: "Deutschland",
      source: "demo",
    }),

  createVehicle: (input: CreateVehicleInput): Promise<VehicleDTO> => {
    const nowIso = new Date().toISOString();
    const v: DemoVehicle = {
      id: uid("veh"),
      vin: input.vin,
      make: input.make,
      model: input.model,
      year: input.year,
      engine: input.engine ?? null,
      plate: input.plate ?? null,
      photoUrl: input.photoUrl ?? null,
      mileageKm: input.mileageKm ?? null,
      createdAt: nowIso,
      updatedAt: nowIso,
      events: [],
      documents: [],
      reminders: [],
      scans: [],
      messages: [],
      modifications: [],
      score: {
        id: uid("score"),
        vehicleId: "",
        score: 70,
        computedAt: nowIso,
        factors: [
          { key: "maintenance", label: "Wartungshistorie", weight: 0.3, score: 60 },
          { key: "mileage", label: "Laufleistung & Alter", weight: 0.25, score: 78 },
          { key: "diagnostics", label: "Fehlercodes (OBD)", weight: 0.25, score: 80 },
          { key: "expenses", label: "Reparaturaufwand", weight: 0.2, score: 72 },
        ],
      },
    };
    v.score.vehicleId = v.id;
    store.unshift(v);
    return delay(publicVehicle(v));
  },

  updateVehicle: (id: string, input: { mileageKm?: number; plate?: string | null }): Promise<VehicleDTO> => {
    const v = find(id);
    if (input.mileageKm != null) v.mileageKm = input.mileageKm;
    if (input.plate !== undefined) v.plate = input.plate;
    v.updatedAt = new Date().toISOString();
    return delay(publicVehicle(v));
  },

  listEvents: (vehicleId: string, type?: "maintenance" | "repair" | "expense"): Promise<VehicleEventDTO[]> => {
    const list = find(vehicleId).events.filter((e) => (type ? e.type === type : true));
    return delay([...list].sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt)));
  },

  createEvent: (vehicleId: string, input: CreateEventInput): Promise<VehicleEventDTO> => {
    const v = find(vehicleId);
    const event: VehicleEventDTO = {
      id: uid("ev"),
      vehicleId,
      type: input.type,
      occurredAt: input.occurredAt,
      mileageKm: input.mileageKm ?? null,
      visibility: input.type === "expense" ? "private" : "carDNA",
      payload: input.payload as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    };
    v.events.unshift(event);
    return delay(event);
  },

  expenseSummary: (vehicleId: string): Promise<ExpenseSummaryDTO> => {
    const expenses = find(vehicleId).events.filter((e) => e.type === "expense");
    const byCurrency: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      const amount = Number(e.payload.amount) || 0;
      const currency = String(e.payload.currency ?? "EUR");
      const category = String(e.payload.category ?? "other");
      byCurrency[currency] = (byCurrency[currency] ?? 0) + amount;
      byCategory[category] = (byCategory[category] ?? 0) + amount;
    }
    return delay({ count: expenses.length, byCurrency, byCategory });
  },

  listDocuments: (vehicleId: string): Promise<DocumentDTO[]> => delay(find(vehicleId).documents),

  uploadDocument: (
    vehicleId: string,
    file: UploadFile,
    meta: { type: string; title?: string; expiresAt?: string },
  ): Promise<DocumentDTO> => {
    const v = find(vehicleId);
    const doc: DocumentDTO = {
      id: uid("doc"),
      vehicleId,
      type: meta.type,
      fileUrl: "#",
      title: meta.title ?? file.name,
      issuedAt: new Date().toISOString(),
      expiresAt: meta.expiresAt ?? null,
      createdAt: new Date().toISOString(),
    };
    v.documents.unshift(doc);
    return delay(doc);
  },

  listReminders: (vehicleId: string): Promise<ReminderDTO[]> => {
    const list = find(vehicleId).reminders.filter((r) => !r.completedAt);
    return delay(
      [...list].sort((a, b) => +new Date(a.dueDate ?? 0) - +new Date(b.dueDate ?? 0)),
    );
  },

  createReminder: (
    vehicleId: string,
    input: { kind?: string; title: string; dueDate?: string; dueMileageKm?: number },
  ): Promise<ReminderDTO> => {
    const v = find(vehicleId);
    const reminder: ReminderDTO = {
      id: uid("rem"),
      vehicleId,
      kind: input.kind ?? "user",
      title: input.title,
      dueDate: input.dueDate ?? null,
      dueMileageKm: input.dueMileageKm ?? null,
      completedAt: null,
      source: "user",
    };
    v.reminders.unshift(reminder);
    return delay(reminder);
  },

  completeReminder: (vehicleId: string, reminderId: string): Promise<{ ok: boolean }> => {
    const r = find(vehicleId).reminders.find((x) => x.id === reminderId);
    if (r) r.completedAt = new Date().toISOString();
    return delay({ ok: true });
  },

  assistantHistory: (vehicleId: string) => delay(find(vehicleId).messages),

  askAssistant: (vehicleId: string, message: string): Promise<AssistantReplyDTO> => {
    const v = find(vehicleId);
    const answer =
      `Danke für die Beschreibung deines ${v.make} ${v.model}. Auf Basis der Historie (` +
      `${v.mileageKm?.toLocaleString("de-DE") ?? "?"} km) klingt das nach einem üblichen ` +
      `Verschleißpunkt. Beobachte, ob es sich verstärkt, und lies bei Gelegenheit den ` +
      `Fehlerspeicher aus. Hinweis: Das ersetzt keine Werkstatt-Diagnose.`;
    v.messages.push(
      { id: uid("msg"), vehicleId, role: "user", content: message, sources: null, createdAt: new Date().toISOString() },
      {
        id: uid("msg"),
        vehicleId,
        role: "assistant",
        content: answer,
        sources: [{ title: "CarDNA Wissensbasis", source: "Demo" }],
        createdAt: new Date().toISOString(),
      },
    );
    return delay({ answer, sources: [{ title: "CarDNA Wissensbasis", source: "Demo" }] }, 700);
  },

  listScans: (vehicleId: string): Promise<ScanDTO[]> => delay(find(vehicleId).scans),

  createScan: (
    vehicleId: string,
    body: { dtcCodes: string[]; adapterInfo?: string; mileageKm?: number },
  ): Promise<ScanDTO> => {
    const v = find(vehicleId);
    const scan: ScanDTO = {
      id: uid("scan"),
      vehicleId,
      adapterInfo: body.adapterInfo ?? "ELM327 BLE (Demo)",
      dtcCodes: body.dtcCodes,
      mileageKm: body.mileageKm ?? v.mileageKm,
      scannedAt: new Date().toISOString(),
      decoded: body.dtcCodes.map((code) => ({
        code,
        description: "Demo-Beschreibung für " + code,
        system: "Antrieb",
        severity: 2,
      })),
    };
    v.scans.unshift(scan);
    return delay(scan, 900);
  },

  getScore: (vehicleId: string): Promise<ScoreDTO> => delay(find(vehicleId).score),

  computeScore: (vehicleId: string): Promise<ScoreDTO> => {
    const v = find(vehicleId);
    v.score.computedAt = new Date().toISOString();
    return delay(v.score, 1100);
  },

  generateSaleReport: (vehicleId: string): Promise<SaleReportRefDTO> => {
    const slug = `${find(vehicleId).make.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`;
    return delay(
      {
        id: uid("report"),
        slug,
        url: `/r/${slug}`,
        expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      },
      900,
    );
  },

  listModifications: (vehicleId: string): Promise<ModificationDTO[]> =>
    delay([...find(vehicleId).modifications].sort((a, b) => +new Date(b.installedAt) - +new Date(a.installedAt))),

  createModification: (vehicleId: string, input: CreateModificationInput): Promise<ModificationDTO> => {
    const v = find(vehicleId);
    const mod: ModificationDTO = {
      id: uid("mod"),
      vehicleId,
      title: input.title,
      category: input.category,
      installedAt: input.installedAt,
      gainHp: input.gainHp ?? null,
      cost: input.cost ?? null,
      notes: input.notes ?? null,
    };
    v.modifications.unshift(mod);
    return delay(mod);
  },

  fleetSummary: (): Promise<FleetSummaryDTO> => {
    const totalKm = store.reduce((s, v) => s + (v.mileageKm ?? 0), 0);
    const totalSpentEur = store.reduce(
      (s, v) =>
        s +
        v.events.reduce((a, e) => {
          if (e.type === "expense") return a + (Number(e.payload.amount) || 0);
          if (e.type === "maintenance" || e.type === "repair")
            return a + (Number(e.payload.partsCost) || 0) + (Number(e.payload.laborCost) || 0);
          return a;
        }, 0),
      0,
    );
    const avgScore = store.length
      ? Math.round(store.reduce((s, v) => s + v.score.score, 0) / store.length)
      : 0;
    const dueReminders = store.reduce((s, v) => s + v.reminders.filter((r) => !r.completedAt).length, 0);
    return delay({ vehicles: store.length, totalKm, totalSpentEur, avgScore, dueReminders });
  },
};
