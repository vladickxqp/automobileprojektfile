// Built-in sample data for the offline / localhost demo. Entirely fictional vehicles — no real
// owners, no external systems. Used only when DEMO is on (see src/api/config.ts).
import type {
  AiMessageDTO,
  DocumentDTO,
  ReminderDTO,
  ScanDTO,
  ScoreDTO,
  VehicleDTO,
  VehicleEventDTO,
} from "../api/client";

const now = Date.now();
const days = (n: number) => new Date(now - n * 86_400_000).toISOString();
const inDays = (n: number) => new Date(now + n * 86_400_000).toISOString();

export interface DemoVehicle extends VehicleDTO {
  events: VehicleEventDTO[];
  documents: DocumentDTO[];
  reminders: ReminderDTO[];
  scans: ScanDTO[];
  messages: AiMessageDTO[];
  score: ScoreDTO;
}

function makeScore(vehicleId: string, score: number): ScoreDTO {
  return {
    id: `score-${vehicleId}`,
    vehicleId,
    score,
    computedAt: days(2),
    factors: [
      { key: "maintenance", label: "Wartungshistorie", weight: 0.3, score: Math.min(100, score + 6) },
      { key: "mileage", label: "Laufleistung & Alter", weight: 0.25, score: Math.max(0, score - 8) },
      { key: "diagnostics", label: "Fehlercodes (OBD)", weight: 0.25, score: Math.min(100, score + 2) },
      { key: "expenses", label: "Reparaturaufwand", weight: 0.2, score: Math.max(0, score - 3) },
    ],
  };
}

export const demoVehicles: DemoVehicle[] = [
  {
    id: "veh-1",
    vin: "WBS8M9C50J5K12345",
    make: "BMW",
    model: "M3 Competition",
    year: 2021,
    engine: "3.0 R6 BiTurbo · 510 PS",
    plate: "M·AL 2021",
    photoUrl: null,
    mileageKm: 38_400,
    createdAt: days(420),
    updatedAt: days(2),
    score: makeScore("veh-1", 86),
    events: [
      {
        id: "ev-1-1",
        vehicleId: "veh-1",
        type: "maintenance",
        occurredAt: days(40),
        mileageKm: 37_900,
        visibility: "carDNA",
        payload: { title: "Inspektion + Ölservice", category: "service", shopName: "BMW Service München", partsCost: 320, laborCost: 240, currency: "EUR" },
        createdAt: days(40),
      },
      {
        id: "ev-1-2",
        vehicleId: "veh-1",
        type: "repair",
        occurredAt: days(120),
        mileageKm: 33_100,
        visibility: "carDNA",
        payload: { title: "Bremsscheiben + Beläge VA", category: "brakes", shopName: "Freie Werkstatt", partsCost: 680, laborCost: 210, currency: "EUR" },
        createdAt: days(120),
      },
      {
        id: "ev-1-3",
        vehicleId: "veh-1",
        type: "expense",
        occurredAt: days(8),
        mileageKm: 38_300,
        visibility: "private",
        payload: { category: "fuel", amount: 96, currency: "EUR", note: "Super Plus" },
        createdAt: days(8),
      },
    ],
    documents: [
      { id: "doc-1-1", vehicleId: "veh-1", type: "insurance", fileUrl: "#", title: "Kfz-Versicherung 2025", issuedAt: days(180), expiresAt: inDays(185), createdAt: days(180) },
      { id: "doc-1-2", vehicleId: "veh-1", type: "TÜV", fileUrl: "#", title: "HU/AU Bericht", issuedAt: days(90), expiresAt: inDays(640), createdAt: days(90) },
    ],
    reminders: [
      { id: "rem-1-1", vehicleId: "veh-1", kind: "oil", title: "Ölwechsel fällig", dueDate: inDays(45), dueMileageKm: 45_000, completedAt: null, source: "user" },
      { id: "rem-1-2", vehicleId: "veh-1", kind: "insurance", title: "Versicherung verlängern", dueDate: inDays(185), dueMileageKm: null, completedAt: null, source: "document" },
    ],
    scans: [
      {
        id: "scan-1-1",
        vehicleId: "veh-1",
        adapterInfo: "ELM327 BLE",
        dtcCodes: ["P0420"],
        mileageKm: 38_200,
        scannedAt: days(15),
        decoded: [{ code: "P0420", description: "Katalysator-Wirkungsgrad unter Schwellwert (Bank 1)", system: "Abgas", severity: 2 }],
      },
    ],
    messages: [
      { id: "msg-1-1", vehicleId: "veh-1", role: "user", content: "Beim Kaltstart ein kurzes Rasseln vorne links — was kann das sein?", sources: null, createdAt: days(3) },
      {
        id: "msg-1-2",
        vehicleId: "veh-1",
        role: "assistant",
        content:
          "Ein kurzes Rasseln beim Kaltstart deutet bei diesem Motor häufig auf die Kettenspanner-Vorspannung oder hitzebedingtes Spiel an einem Hitzeschild hin. Da es nur kalt auftritt und schnell verschwindet, ist es meist unkritisch — beobachte, ob es länger wird. Hinweis: keine Ferndiagnose, im Zweifel in der Werkstatt prüfen lassen.",
        sources: [{ title: "Kaltstart-Geräusche R6", source: "Wissensbasis" }],
        createdAt: days(3),
      },
    ],
  },
  {
    id: "veh-2",
    vin: "WAUZZZF40KA098765",
    make: "Audi",
    model: "A4 Avant",
    year: 2019,
    engine: "2.0 TDI · 190 PS",
    plate: "M·AL 419",
    photoUrl: null,
    mileageKm: 92_100,
    createdAt: days(700),
    updatedAt: days(6),
    score: makeScore("veh-2", 72),
    events: [
      {
        id: "ev-2-1",
        vehicleId: "veh-2",
        type: "maintenance",
        occurredAt: days(60),
        mileageKm: 89_000,
        visibility: "carDNA",
        payload: { title: "Großer Service + Zahnriemen", category: "service", shopName: "Audi Zentrum", partsCost: 540, laborCost: 460, currency: "EUR" },
        createdAt: days(60),
      },
      {
        id: "ev-2-2",
        vehicleId: "veh-2",
        type: "expense",
        occurredAt: days(12),
        mileageKm: 91_800,
        visibility: "private",
        payload: { category: "fuel", amount: 78, currency: "EUR" },
        createdAt: days(12),
      },
    ],
    documents: [
      { id: "doc-2-1", vehicleId: "veh-2", type: "TÜV", fileUrl: "#", title: "HU/AU Bericht", issuedAt: days(300), expiresAt: inDays(30), createdAt: days(300) },
    ],
    reminders: [
      { id: "rem-2-1", vehicleId: "veh-2", kind: "tuv", title: "TÜV / HU fällig", dueDate: inDays(30), dueMileageKm: null, completedAt: null, source: "document" },
    ],
    scans: [],
    messages: [],
  },
  {
    id: "veh-3",
    vin: "WVWZZZCDZNW334411",
    make: "Volkswagen",
    model: "Golf GTI",
    year: 2022,
    engine: "2.0 TSI · 245 PS",
    plate: "M·AL 8GT",
    photoUrl: null,
    mileageKm: 21_750,
    createdAt: days(240),
    updatedAt: days(1),
    score: makeScore("veh-3", 91),
    events: [
      {
        id: "ev-3-1",
        vehicleId: "veh-3",
        type: "maintenance",
        occurredAt: days(20),
        mileageKm: 20_500,
        visibility: "carDNA",
        payload: { title: "Inspektion", category: "service", shopName: "VW Partner", partsCost: 180, laborCost: 160, currency: "EUR" },
        createdAt: days(20),
      },
    ],
    documents: [
      { id: "doc-3-1", vehicleId: "veh-3", type: "insurance", fileUrl: "#", title: "Kfz-Versicherung", issuedAt: days(120), expiresAt: inDays(245), createdAt: days(120) },
    ],
    reminders: [
      { id: "rem-3-1", vehicleId: "veh-3", kind: "service", title: "Inspektion fällig", dueDate: inDays(120), dueMileageKm: 30_000, completedAt: null, source: "user" },
    ],
    scans: [],
    messages: [],
  },
];
