import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";
import type { ThemeColors } from "../theme/tokens";

interface StatTileProps {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: string;
}

export function StatTile({ label, value, icon, tone }: StatTileProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.tile}>
      <View style={styles.head}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.value, tone ? { color: tone } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      minWidth: 140,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    icon: { opacity: 0.9 },
    label: { ...typography.label, color: colors.textMuted, flexShrink: 1 },
    value: { ...typography.h2, color: colors.text },
  });
