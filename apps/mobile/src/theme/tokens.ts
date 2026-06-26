// "Instrument" theme — near-black, sharp angular geometry, a single tachometer-orange signature
// accent. No blue. Buttons use the accent or stay monochrome-outline; color carries meaning.

export const colors = {
  background: "#08090A",
  surface: "#111315",
  surfaceAlt: "#16191D",
  border: "#23262B",
  borderStrong: "#2A2E34",
  text: "#F2F3F5",
  textMuted: "#8A9099",
  textFaint: "#565C64",
  primary: "#F2552A", // tachometer orange — the signature accent
  primarySoft: "#2A140C",
  onPrimary: "#0A0604",
  success: "#2FB47C",
  warning: "#E8A13C",
  danger: "#E5484D",
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
  sm: 4,
  md: 6,
  lg: 8,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 24, fontWeight: "800" as const, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: "700" as const, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
} as const;
