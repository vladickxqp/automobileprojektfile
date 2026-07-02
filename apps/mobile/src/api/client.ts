import { demoApi } from "../demo/demoApi";
import { apiClient } from "./apiClient";
import { DEMO } from "./config";

export interface VehicleDTO {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  engine: string | null;
  plate: string | null;
  photoUrl: string | null;
  mileageKm: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DecodeDTO {
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  engine: string | null;
  country: string | null;
  source: string;
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string };
}

export interface CreateVehicleInput {
  vin: string;
  make: string;
  model: string;
  year: number;
  engine?: string;
  plate?: string;
  mileageKm?: number;
  photoUrl?: string;
}

export interface UpdateVehicleInput {
  mileageKm?: number;
  plate?: string | null;
  make?: string;
  model?: string;
  year?: number;
  engine?: string | null;
  photoUrl?: string | null;
}

export interface VehicleEventDTO {
  id: string;
  vehicleId: string;
  type: "maintenance" | "repair" | "scan" | "expense" | "document" | "incident" | "score";
  occurredAt: string;
  mileageKm: number | null;
  visibility: "private" | "carDNA";
  payload: Record<string, unknown>;
  createdAt: string;
}

export type CreateEventInput =
  | {
      type: "maintenance" | "repair";
      occurredAt: string;
      mileageKm?: number;
      payload: {
        title: string;
        category?: string;
        shopName?: string;
        partsCost?: number;
        laborCost?: number;
        currency?: string;
        notes?: string;
        cost?: number;
        workshop?: string;
        diy?: boolean;
        photos?: string[];
      };
    }
  | {
      type: "expense";
      occurredAt: string;
      mileageKm?: number;
      payload: { category: string; amount: number; currency?: string; note?: string };
    };

export interface UpdateEventInput {
  occurredAt?: string;
  mileageKm?: number;
  payload?: Record<string, unknown>;
}

export interface ExpenseSummaryDTO {
  count: number;
  byCurrency: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface DocumentDTO {
  id: string;
  vehicleId: string;
  type: string;
  fileUrl: string;
  title: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ReminderDTO {
  id: string;
  vehicleId: string;
  kind: string;
  title: string;
  dueDate: string | null;
  dueMileageKm: number | null;
  completedAt: string | null;
  source: "user" | "document";
}

export interface AssistantSource {
  title: string;
  source: string;
}

export interface AiMessageDTO {
  id: string;
  vehicleId: string;
  role: "user" | "assistant";
  content: string;
  sources: AssistantSource[] | null;
  createdAt: string;
}

export interface AssistantReplyDTO {
  answer: string;
  sources: AssistantSource[];
}

export interface DecodedDtcDTO {
  code: string;
  description: string | null;
  system: string | null;
  severity: number | null;
}

export interface ScanDTO {
  id: string;
  vehicleId: string;
  adapterInfo: string | null;
  dtcCodes: string[];
  mileageKm: number | null;
  scannedAt: string;
  decoded: DecodedDtcDTO[];
}

export interface ScoreFactorDTO {
  key: string;
  label: string;
  weight: number;
  score: number;
}

export interface ScoreDTO {
  id: string;
  vehicleId: string;
  score: number;
  factors: ScoreFactorDTO[];
  computedAt: string;
}

export interface SaleReportRefDTO {
  id: string;
  slug: string;
  url: string;
  expiresAt: string;
}

export interface UploadFile {
  uri: string;
  name: string;
  mimeType?: string;
}

export interface ModificationDTO {
  id: string;
  vehicleId: string;
  title: string;
  category: string; // engine | exhaust | suspension | wheels | exterior | interior | other
  installedAt: string;
  gainHp: number | null;
  cost: number | null;
  notes: string | null;
}

export interface CreateModificationInput {
  title: string;
  category: string;
  installedAt: string;
  gainHp?: number;
  cost?: number;
  notes?: string;
}

export interface FleetSummaryDTO {
  vehicles: number;
  totalKm: number;
  totalSpentEur: number;
  avgScore: number;
  dueReminders: number;
}

export interface NotificationDTO {
  id: string;
  vehicleId: string;
  vehicleName: string;
  kind: "reminder" | "document";
  title: string;
  date: string | null;
  severity: "info" | "warning" | "danger";
}

// Re-exported for callers that still import it from here.
export { ApiError } from "./apiClient";

const get = <T>(path: string) => apiClient.get<T>(path).then((r) => r.data);
const post = <T>(path: string, body?: unknown) => apiClient.post<T>(path, body ?? {}).then((r) => r.data);
const patch = <T>(path: string, body?: unknown) => apiClient.patch<T>(path, body ?? {}).then((r) => r.data);
const del = <T>(path: string) => apiClient.delete<T>(path).then((r) => r.data);

async function uploadDocument(
  vehicleId: string,
  file: UploadFile,
  meta: { type: string; title?: string; expiresAt?: string },
): Promise<DocumentDTO> {
  const form = new FormData();
  // React Native FormData accepts this { uri, name, type } shape for file parts.
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? "application/octet-stream",
  } as unknown as Blob);
  form.append("type", meta.type);
  if (meta.title) form.append("title", meta.title);
  if (meta.expiresAt) form.append("expiresAt", meta.expiresAt);
  // Let axios set the multipart boundary (no manual Content-Type).
  const { data } = await apiClient.post<DocumentDTO>(`/vehicles/${vehicleId}/documents`, form);
  return data;
}

const realApi = {
  register: (email: string, password: string) => post<AuthResponse>("/auth/register", { email, password }),
  login: (email: string, password: string) => post<AuthResponse>("/auth/login", { email, password }),
  listVehicles: () => get<VehicleDTO[]>("/vehicles"),
  getVehicle: (id: string) => get<VehicleDTO>(`/vehicles/${id}`),
  decodeVin: (vin: string) => get<DecodeDTO>(`/vehicles/decode/${vin}`),
  createVehicle: (input: CreateVehicleInput) => post<VehicleDTO>("/vehicles", input),
  updateVehicle: (id: string, input: UpdateVehicleInput) => patch<VehicleDTO>(`/vehicles/${id}`, input),
  deleteVehicle: (id: string) => del<{ ok: boolean }>(`/vehicles/${id}`),
  listEvents: (vehicleId: string, type?: "maintenance" | "repair" | "expense") =>
    get<VehicleEventDTO[]>(`/vehicles/${vehicleId}/events${type ? `?type=${type}` : ""}`),
  createEvent: (vehicleId: string, input: CreateEventInput) =>
    post<VehicleEventDTO>(`/vehicles/${vehicleId}/events`, input),
  updateEvent: (vehicleId: string, eventId: string, input: UpdateEventInput) =>
    patch<VehicleEventDTO>(`/vehicles/${vehicleId}/events/${eventId}`, input),
  deleteEvent: (vehicleId: string, eventId: string) =>
    del<{ ok: boolean }>(`/vehicles/${vehicleId}/events/${eventId}`),
  expenseSummary: (vehicleId: string) => get<ExpenseSummaryDTO>(`/vehicles/${vehicleId}/expenses/summary`),
  listDocuments: (vehicleId: string) => get<DocumentDTO[]>(`/vehicles/${vehicleId}/documents`),
  uploadDocument,
  listReminders: (vehicleId: string) => get<ReminderDTO[]>(`/vehicles/${vehicleId}/reminders`),
  createReminder: (
    vehicleId: string,
    input: { kind?: string; title: string; dueDate?: string; dueMileageKm?: number },
  ) => post<ReminderDTO>(`/vehicles/${vehicleId}/reminders`, input),
  completeReminder: (vehicleId: string, reminderId: string) =>
    patch<{ ok: boolean }>(`/vehicles/${vehicleId}/reminders/${reminderId}/complete`),
  assistantHistory: (vehicleId: string) => get<AiMessageDTO[]>(`/vehicles/${vehicleId}/assistant/history`),
  askAssistant: (vehicleId: string, message: string) =>
    post<AssistantReplyDTO>(`/vehicles/${vehicleId}/assistant`, { message }),
  listScans: (vehicleId: string) => get<ScanDTO[]>(`/vehicles/${vehicleId}/scans`),
  createScan: (vehicleId: string, body: { dtcCodes: string[]; adapterInfo?: string; mileageKm?: number }) =>
    post<ScanDTO>(`/vehicles/${vehicleId}/scans`, body),
  getScore: (vehicleId: string) => get<ScoreDTO>(`/vehicles/${vehicleId}/score`),
  computeScore: (vehicleId: string) => post<ScoreDTO>(`/vehicles/${vehicleId}/score`),
  generateSaleReport: (vehicleId: string) => post<SaleReportRefDTO>(`/vehicles/${vehicleId}/sale-report`),
  // Modifications have no backend model yet — degrade gracefully so the screen just shows empty.
  listModifications: (vehicleId: string) =>
    get<ModificationDTO[]>(`/vehicles/${vehicleId}/modifications`).catch(() => [] as ModificationDTO[]),
  createModification: (vehicleId: string, input: CreateModificationInput) =>
    post<ModificationDTO>(`/vehicles/${vehicleId}/modifications`, input),
  fleetSummary: () => get<FleetSummaryDTO>(`/fleet/summary`),
  listNotifications: () => get<NotificationDTO[]>(`/notifications`),
};

// In demo mode every call is served from built-in sample data (no backend). See src/api/config.ts.
export const api = (DEMO ? demoApi : realApi) as typeof realApi;
