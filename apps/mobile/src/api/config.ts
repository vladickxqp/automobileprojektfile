import { Platform } from "react-native";

// Base URL of the CarDNA API. Defaults to the deployed cloud backend; override with
// EXPO_PUBLIC_API_URL (e.g. http://localhost:3000 for a local backend, or a LAN IP on a device).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://cardna-api.onrender.com";

// Demo mode renders the whole app from built-in sample data — no backend, no real accounts.
// It powers the localhost web preview. Defaults on for web; force it anywhere with
// EXPO_PUBLIC_DEMO=1, or turn it off with EXPO_PUBLIC_DEMO=0.
const demoFlag = process.env.EXPO_PUBLIC_DEMO;
export const DEMO =
  demoFlag === "1" || demoFlag === "true" || (demoFlag !== "0" && Platform.OS === "web");
