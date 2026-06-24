import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "autolife.accessToken";

// Kept in memory for synchronous access by the API client, and persisted in the Keychain/Keystore.
let inMemoryToken: string | null = null;

export function getAccessToken(): string | null {
  return inMemoryToken;
}

export async function loadToken(): Promise<string | null> {
  inMemoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return inMemoryToken;
}

export async function saveToken(token: string): Promise<void> {
  inMemoryToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  inMemoryToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
