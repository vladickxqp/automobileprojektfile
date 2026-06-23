// Design tokens — the single source for colors, spacing and type.
// A fuller design system (NativeWind) lands in Phase 1; tokens keep the UI consistent until then.

export const colors = {
  background: "#0B0F14",
  surface: "#151B23",
  text: "#F5F7FA",
  textMuted: "#9AA7B4",
  primary: "#2E7DF6",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  border: "#222B36",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: "600" as const, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
} as const;
