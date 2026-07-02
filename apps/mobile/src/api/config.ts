// Base URL of the CarDNA API. Defaults to the deployed cloud backend; override with
// EXPO_PUBLIC_API_URL (e.g. http://localhost:3000 for a local backend, or a LAN IP on a device).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://cardna-api.onrender.com";

// Demo mode renders the whole app from built-in sample data — no backend, no real accounts.
// The app now talks to the real backend by default; demo is opt-in only (set EXPO_PUBLIC_DEMO=1)
// for offline UI previews.
const demoFlag = process.env.EXPO_PUBLIC_DEMO;
export const DEMO = demoFlag === "1" || demoFlag === "true";
