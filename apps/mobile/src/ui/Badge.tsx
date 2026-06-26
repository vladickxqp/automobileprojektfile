import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";
import type { ThemeColors } from "../theme/tokens";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const palette: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textMuted },
    accent: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: "rgba(47,180,124,0.14)", fg: colors.success },
    warning: { bg: "rgba(232,161,60,0.16)", fg: colors.warning },
    danger: { bg: "rgba(229,72,77,0.16)", fg: colors.danger },
  };
  const c = palette[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
    },
    text: { ...typography.label, fontSize: 11 },
  });
