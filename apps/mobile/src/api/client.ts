import { getAccessToken } from "../auth/store";
import { API_URL } from "./config";

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

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: { email, password }, auth: false }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  listVehicles: () => request<VehicleDTO[]>("/vehicles"),
  getVehicle: (id: string) => request<VehicleDTO>(`/vehicles/${id}`),
  decodeVin: (vin: string) => request<DecodeDTO>(`/vehicles/decode/${vin}`),
  createVehicle: (input: CreateVehicleInput) =>
    request<VehicleDTO>("/vehicles", { method: "POST", body: input }),
  updateVehicle: (id: string, input: { mileageKm?: number; plate?: string | null }) =>
    request<VehicleDTO>(`/vehicles/${id}`, { method: "PATCH", body: input }),
};
