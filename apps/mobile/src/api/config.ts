import { Platform } from "react-native";

// Base URL of the AutoLife API.
// On a simulator/emulator localhost works; on a physical device set your machine's LAN IP
// (e.g. http://192.168.1.50:3000) via EXPO_PUBLIC_API_URL.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// Demo mode renders the whole app from built-in sample data — no backend, no real accounts.
// It powers the localhost web preview. Defaults on for web; force it anywhere with
// EXPO_PUBLIC_DEMO=1, or turn it off with EXPO_PUBLIC_DEMO=0.
const demoFlag = process.env.EXPO_PUBLIC_DEMO;
export const DEMO =
  demoFlag === "1" || demoFlag === "true" || (demoFlag !== "0" && Platform.OS === "web");
