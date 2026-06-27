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
      height: 52,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
      borderWidth: 1,
      borderColor: "transparent",
      ...Platform.select({ web: { cursor: "pointer" } as object, default: {} }),
    },
    lg: { height: 58 },
    content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    icon: { marginLeft: -2 },
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      ...Platform.select({
        web: { boxShadow: "0 12px 30px -14px rgba(124,92,255,0.32)" } as object,
        default: {
          shadowColor: colors.primary,
          shadowOpacity: 0.28,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        },
      }),
    },
    secondary: { backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong },
    ghost: { backgroundColor: "transparent", borderColor: "transparent" },
    inactive: { opacity: 0.4 },
    pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
    label: { ...typography.body, fontWeight: "700", letterSpacing: 0.3 },
  });
