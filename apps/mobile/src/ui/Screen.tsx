import { StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/tokens";

export function Screen({ style, ...props }: ViewProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={[styles.body, style]} {...props} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.lg, gap: spacing.md },
});
