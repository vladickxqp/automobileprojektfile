import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { darkColors, lightColors, type ThemeColors } from "./tokens";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "autolife.themeMode";

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const webStorage = (globalThis as { localStorage?: WebStorage }).localStorage;

// Default is dark ("black"). On web we persist the choice so a reload keeps the theme.
function readInitialMode(): ThemeMode {
  if (Platform.OS === "web") {
    const stored = webStorage?.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    if (Platform.OS === "web") webStorage?.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<ThemeState>(
    () => ({
      mode,
      colors: mode === "dark" ? darkColors : lightColors,
      isDark: mode === "dark",
      toggle: () => setMode(mode === "dark" ? "light" : "dark"),
      setMode,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
