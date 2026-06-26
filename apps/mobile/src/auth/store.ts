import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "autolife.accessToken";
const isWeb = Platform.OS === "web";

interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// localStorage on web (expo-secure-store has no web backend); Keychain/Keystore on native.
const webStorage = (globalThis as { localStorage?: WebStorage }).localStorage;

// Kept in memory for synchronous access by the API client, and persisted across launches.
let inMemoryToken: string | null = null;

export function getAccessToken(): string | null {
  return inMemoryToken;
}

export async function loadToken(): Promise<string | null> {
  inMemoryToken = isWeb
    ? (webStorage?.getItem(TOKEN_KEY) ?? null)
    : await SecureStore.getItemAsync(TOKEN_KEY);
  return inMemoryToken;
}

export async function saveToken(token: string): Promise<void> {
  inMemoryToken = token;
  if (isWeb) webStorage?.setItem(TOKEN_KEY, token);
  else await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  inMemoryToken = null;
  if (isWeb) webStorage?.removeItem(TOKEN_KEY);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}
