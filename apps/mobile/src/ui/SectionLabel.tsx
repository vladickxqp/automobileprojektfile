import { StyleSheet, Text } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { typography } from "../theme/tokens";

export function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.label, { color: colors.textMuted }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: { ...typography.label, textTransform: "uppercase", marginTop: 4 },
});
