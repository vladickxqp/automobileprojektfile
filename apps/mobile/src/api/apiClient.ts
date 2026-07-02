import axios, { AxiosError, type AxiosInstance } from "axios";
import { clearToken, getAccessToken } from "../auth/store";
import { API_URL } from "./config";

// Raised for any non-2xx response so screens can show a message.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// The app registers a handler so a 401 (expired / invalid token) can drop the session and route
// back to the sign-in screen from outside the React tree (see AuthContext).
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

function messageFrom(error: AxiosError): string {
  const data = error.response?.data as { error?: string; message?: string } | undefined;
  return data?.error ?? data?.message ?? error.message ?? "Request failed";
}

// Single shared client. No default Content-Type so axios can pick JSON for objects and the correct
// multipart boundary for FormData uploads.
export const apiClient: AxiosInstance = axios.create({ baseURL: API_URL, timeout: 30_000 });

// Attach the bearer token (read synchronously from the in-memory store) to every request.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401, and normalise every error to ApiError.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    if (status === 401) {
      await clearToken();
      onUnauthorized?.();
    }
    return Promise.reject(new ApiError(status, messageFrom(error)));
  },
);
