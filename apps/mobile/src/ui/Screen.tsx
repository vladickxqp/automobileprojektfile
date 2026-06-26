import { useMemo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { spacing } from "../theme/tokens";
import type { ThemeColors } from "../theme/tokens";

interface ScreenProps extends ViewProps {
  /** Remove the default page padding (e.g. for full-bleed scroll content). */
  flush?: boolean;
}

export function Screen({ style, flush = false, ...props }: ScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={[flush ? styles.bodyFlush : styles.body, style]} {...props} />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1, padding: spacing.lg, gap: spacing.md },
    bodyFlush: { flex: 1 },
  });
