import { Platform } from "react-native";

// Tracks whether the user has seen onboarding. Persisted on web; in-memory on native (good enough
// for the demo — a native build would move this to expo-secure-store).
const KEY = "autolife.onboarded";

interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const webStorage = (globalThis as { localStorage?: WebStorage }).localStorage;

let inMemory = false;

export function isOnboarded(): boolean {
  if (Platform.OS === "web") return webStorage?.getItem(KEY) === "1";
  return inMemory;
}

export function setOnboarded(): void {
  inMemory = true;
  if (Platform.OS === "web") webStorage?.setItem(KEY, "1");
}
