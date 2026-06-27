// "Aurora" design system — a premium deep-violet aesthetic: gradient backgrounds, glassy rounded
// cards, a glowing violet signature accent and pill buttons. Two palettes share the same keys so
// any component switches themes by swapping the palette object. Dark is the default.

export interface ThemeColors {
  // surfaces
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceAlt: string;
  surfaceHover: string;
  // lines
  border: string;
  borderStrong: string;
  // text
  text: string;
  textMuted: string;
  textFaint: string;
  // signature accent (glowing violet)
  primary: string;
  primarySoft: string;
  primaryGlow: string;
  onPrimary: string;
  // status
  success: string;
  warning: string;
  danger: string;
  // gradient backdrop / hero
  heroTop: string;
  heroBottom: string;
  carPaint: string;
  carGlass: string;
}

export const darkColors: ThemeColors = {
  background: "#080612",
  backgroundElevated: "rgba(255,255,255,0.05)",
  surface: "rgba(255,255,255,0.045)",
  surfaceAlt: "rgba(255,255,255,0.07)",
  surfaceHover: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#F3F1FF",
  textMuted: "#A29CC4",
  textFaint: "#6A6390",
  primary: "#7C5CFF",
  primarySoft: "rgba(124,92,255,0.16)",
  primaryGlow: "rgba(124,92,255,0.28)",
  onPrimary: "#FFFFFF",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  heroTop: "#140E2E",
  heroBottom: "#050310",
  carPaint: "#7C5CFF",
  carGlass: "rgba(255,255,255,0.05)",
};

export const lightColors: ThemeColors = {
  background: "#F4F2FC",
  backgroundElevated: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#EFEBFA",
  surfaceHover: "#E6E0F7",
  border: "#E6E0F7",
  borderStrong: "#CFC6EC",
  text: "#191428",
  textMuted: "#615B7A",
  textFaint: "#9A93B5",
  primary: "#6D4AE6",
  primarySoft: "#EBE5FB",
  primaryGlow: "rgba(109,74,230,0.30)",
  onPrimary: "#FFFFFF",
  success: "#10B981",
  warning: "#D97706",
  danger: "#DC2626",
  heroTop: "#FFFFFF",
  heroBottom: "#ECE7FA",
  carPaint: "#6D4AE6",
  carGlass: "#CFC6EC",
};

// Back-compat default export — the dark palette. Prefer `useTheme()` in components.
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 40, fontWeight: "800" as const, lineHeight: 44, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: "800" as const, lineHeight: 32, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: "700" as const, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: "700" as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "700" as const, lineHeight: 16, letterSpacing: 1.2 },
} as const;
