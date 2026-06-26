import { useMemo, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius } from "../theme/tokens";
import type { ThemeColors } from "../theme/tokens";

interface IconButtonProps {
  onPress?: () => void;
  children: ReactNode;
  accessibilityLabel?: string;
  size?: number;
  variant?: "surface" | "ghost";
}

export function IconButton({
  onPress,
  children,
  accessibilityLabel,
  size = 42,
  variant = "surface",
}: IconButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        variant === "surface" && styles.surface,
        { width: size, height: size, borderRadius: radius.md },
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({ web: { cursor: "pointer" } as object, default: {} }),
    },
    surface: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.7 },
  });
