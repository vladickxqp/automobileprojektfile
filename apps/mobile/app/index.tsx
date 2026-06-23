import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../src/theme/tokens";

export default function GarageScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t("garage.title") }} />
      <Text style={styles.heading}>{t("garage.empty.title")}</Text>
      <Text style={styles.subtitle}>{t("garage.empty.subtitle")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  heading: {
    ...typography.h1,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
