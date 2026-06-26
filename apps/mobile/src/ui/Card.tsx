import { useMemo } from "react";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing } from "../theme/tokens";
import type { ThemeColors } from "../theme/tokens";

interface CardProps extends ViewProps {
  /** Elevated cards get a stronger border + soft glow — used for hero/score cards. */
  elevated?: boolean;
  /** Tint the border/background with the accent (highlight the primary card). */
  accent?: boolean;
}

export function Card({ style, elevated = false, accent = false, ...props }: CardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View
      style={[styles.card, elevated && styles.elevated, accent && styles.accent, style]}
      {...props}
    />
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    elevated: {
      backgroundColor: colors.backgroundElevated,
      borderColor: colors.borderStrong,
      ...Platform.select({
        web: { boxShadow: "0 18px 40px -24px rgba(0,0,0,0.7)" } as object,
        default: {
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 6,
        },
      }),
    },
    accent: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
  });
