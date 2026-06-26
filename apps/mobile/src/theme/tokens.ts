// "Instrument" design system — a near-black cockpit aesthetic with a single tachometer-orange
// signature accent. Two palettes share the same keys so any component can switch themes by
// swapping the palette object. Dark is the default; light is a clean daylight counterpart.

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
  // signature accent (tachometer orange)
  primary: string;
  primarySoft: string;
  primaryGlow: string;
  onPrimary: string;
  // status
  success: string;
  warning: string;
  danger: string;
  // 3d / hero scene
  heroTop: string;
  heroBottom: string;
  carPaint: string;
  carGlass: string;
}

export const darkColors: ThemeColors = {
  background: "#0A0B0D",
  backgroundElevated: "#101317",
  surface: "#14171B",
  surfaceAlt: "#1A1E24",
  surfaceHover: "#21262D",
  border: "#262B32",
  borderStrong: "#333A43",
  text: "#F4F5F7",
  textMuted: "#9AA1AB",
  textFaint: "#5B626B",
  primary: "#F2552A",
  primarySoft: "#2A140C",
  primaryGlow: "rgba(242,85,42,0.35)",
  onPrimary: "#0A0604",
  success: "#2FB47C",
  warning: "#E8A13C",
  danger: "#E5484D",
  heroTop: "#161A1F",
  heroBottom: "#0A0B0D",
  carPaint: "#F2552A",
  carGlass: "#0C0E11",
};

export const lightColors: ThemeColors = {
  background: "#F5F6F8",
  backgroundElevated: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF1F4",
  surfaceHover: "#E6EAEF",
  border: "#E2E6EB",
  borderStrong: "#CCD2DA",
  text: "#14181C",
  textMuted: "#5B636D",
  textFaint: "#99A1AB",
  primary: "#E0491D",
  primarySoft: "#FCE7DF",
  primaryGlow: "rgba(224,73,29,0.22)",
  onPrimary: "#FFFFFF",
  success: "#1E9C66",
  warning: "#C07C18",
  danger: "#D23B40",
  heroTop: "#FFFFFF",
  heroBottom: "#E9ECF1",
  carPaint: "#E0491D",
  carGlass: "#C9D2DC",
};

// Back-compat default export — the dark palette. Prefer `useTheme()` in components so the
// active palette follows the theme toggle.
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
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
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
