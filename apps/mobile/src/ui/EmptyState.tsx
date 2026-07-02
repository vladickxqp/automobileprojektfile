import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../theme/tokens";
import { Button } from "./Button";

interface Props {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Friendly placeholder for "nothing here yet" states (no vehicles, empty lists, …).
export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.xl },
    icon: {
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    title: { ...typography.h1, color: colors.text, textAlign: "center" },
    sub: { ...typography.body, color: colors.textMuted, textAlign: "center" },
    action: { marginTop: spacing.md, alignSelf: "stretch" },
  });
