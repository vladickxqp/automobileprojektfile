import { getAccessToken } from "../auth/store";
import { demoApi } from "../demo/demoApi";
import { API_URL, DEMO } from "./config";

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
      };
    }
  | {
      type: "expense";
      occurredAt: string;
      mileageKm?: number;
      payload: { category: string; amount: number; currency?: string; note?: string };
    };

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

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}

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

  const token = getAccessToken();
  const res = await fetch(`${API_URL}/vehicles/${vehicleId}/documents`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as DocumentDTO;
}

const realApi = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: { email, password }, auth: false }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  listVehicles: () => request<VehicleDTO[]>("/vehicles"),
  getVehicle: (id: string) => request<VehicleDTO>(`/vehicles/${id}`),
  decodeVin: (vin: string) => request<DecodeDTO>(`/vehicles/decode/${vin}`),
  createVehicle: (input: CreateVehicleInput) =>
    request<VehicleDTO>("/vehicles", { method: "POST", body: input }),
  updateVehicle: (id: string, input: UpdateVehicleInput) =>
    request<VehicleDTO>(`/vehicles/${id}`, { method: "PATCH", body: input }),
  deleteVehicle: (id: string) => request<{ ok: boolean }>(`/vehicles/${id}`, { method: "DELETE" }),
  listEvents: (vehicleId: string, type?: "maintenance" | "repair" | "expense") =>
    request<VehicleEventDTO[]>(`/vehicles/${vehicleId}/events${type ? `?type=${type}` : ""}`),
  createEvent: (vehicleId: string, input: CreateEventInput) =>
    request<VehicleEventDTO>(`/vehicles/${vehicleId}/events`, { method: "POST", body: input }),
  expenseSummary: (vehicleId: string) =>
    request<ExpenseSummaryDTO>(`/vehicles/${vehicleId}/expenses/summary`),
  listDocuments: (vehicleId: string) => request<DocumentDTO[]>(`/vehicles/${vehicleId}/documents`),
  uploadDocument,
  listReminders: (vehicleId: string) => request<ReminderDTO[]>(`/vehicles/${vehicleId}/reminders`),
  createReminder: (
    vehicleId: string,
    input: { kind?: string; title: string; dueDate?: string; dueMileageKm?: number },
  ) => request<ReminderDTO>(`/vehicles/${vehicleId}/reminders`, { method: "POST", body: input }),
  completeReminder: (vehicleId: string, reminderId: string) =>
    request<{ ok: boolean }>(`/vehicles/${vehicleId}/reminders/${reminderId}/complete`, {
      method: "PATCH",
    }),
  assistantHistory: (vehicleId: string) =>
    request<AiMessageDTO[]>(`/vehicles/${vehicleId}/assistant/history`),
  askAssistant: (vehicleId: string, message: string) =>
    request<AssistantReplyDTO>(`/vehicles/${vehicleId}/assistant`, {
      method: "POST",
      body: { message },
    }),
  listScans: (vehicleId: string) => request<ScanDTO[]>(`/vehicles/${vehicleId}/scans`),
  createScan: (
    vehicleId: string,
    body: { dtcCodes: string[]; adapterInfo?: string; mileageKm?: number },
  ) => request<ScanDTO>(`/vehicles/${vehicleId}/scans`, { method: "POST", body }),
  getScore: (vehicleId: string) => request<ScoreDTO>(`/vehicles/${vehicleId}/score`),
  computeScore: (vehicleId: string) =>
    request<ScoreDTO>(`/vehicles/${vehicleId}/score`, { method: "POST", body: {} }),
  generateSaleReport: (vehicleId: string) =>
    request<SaleReportRefDTO>(`/vehicles/${vehicleId}/sale-report`, { method: "POST", body: {} }),
  listModifications: (vehicleId: string) =>
    request<ModificationDTO[]>(`/vehicles/${vehicleId}/modifications`),
  createModification: (vehicleId: string, input: CreateModificationInput) =>
    request<ModificationDTO>(`/vehicles/${vehicleId}/modifications`, { method: "POST", body: input }),
  fleetSummary: () => request<FleetSummaryDTO>(`/fleet/summary`),
  listNotifications: () => request<NotificationDTO[]>(`/notifications`),
};

// In demo mode every call is served from built-in sample data (no backend). See src/api/config.ts.
export const api = (DEMO ? demoApi : realApi) as typeof realApi;
