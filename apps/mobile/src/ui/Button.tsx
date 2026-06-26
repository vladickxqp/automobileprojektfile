import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing, typography } from "../theme/tokens";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const inactive = disabled || loading;
  const secondary = variant === "secondary";

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        secondary ? styles.secondary : styles.primary,
        inactive && styles.inactive,
        pressed && !inactive && (secondary ? styles.secondaryPressed : styles.primaryPressed),
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.text : colors.onPrimary} />
      ) : (
        <Text style={[styles.label, secondary ? styles.secondaryLabel : styles.primaryLabel]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  primaryPressed: { opacity: 0.85 },
  secondary: { backgroundColor: "transparent", borderColor: colors.borderStrong },
  secondaryPressed: { backgroundColor: colors.surfaceAlt },
  inactive: { opacity: 0.4 },
  label: { ...typography.body, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  primaryLabel: { color: colors.onPrimary },
  secondaryLabel: { color: colors.text },
});
