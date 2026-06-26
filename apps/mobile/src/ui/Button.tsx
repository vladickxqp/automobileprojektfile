import { useMemo, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, typography } from "../theme/tokens";
import type { ThemeColors } from "../theme/tokens";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const inactive = disabled || loading;
  const labelColor =
    variant === "primary" ? colors.onPrimary : variant === "ghost" ? colors.primary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        size === "lg" && styles.lg,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      height: 50,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: "transparent",
      ...Platform.select({ web: { cursor: "pointer" } as object, default: {} }),
    },
    lg: { height: 56, borderRadius: radius.lg },
    content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    icon: { marginLeft: -2 },
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      ...Platform.select({
        web: { boxShadow: "0 10px 26px -12px rgba(242,85,42,0.7)" } as object,
        default: {},
      }),
    },
    secondary: { backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong },
    ghost: { backgroundColor: "transparent", borderColor: "transparent" },
    inactive: { opacity: 0.4 },
    pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    label: { ...typography.body, fontWeight: "700", letterSpacing: 0.3 },
  });
