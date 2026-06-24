import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { api } from "../../src/api/client";
import { Card } from "../../src/ui/Card";
import { Screen } from "../../src/ui/Screen";
import { colors, spacing, typography } from "../../src/theme/tokens";

export default function VehicleDashboard() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const vehicle = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => api.getVehicle(id),
    enabled: !!id,
  });

  if (vehicle.isLoading || !vehicle.data) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "" }} />
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const v = vehicle.data;

  return (
    <Screen>
      <Stack.Screen options={{ title: `${v.make} ${v.model}` }} />

      <Card style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>AutoScore</Text>
        <Text style={styles.scoreValue}>—</Text>
        <Text style={styles.scoreHint}>{t("dashboard.scoreSoon")}</Text>
      </Card>

      <Card>
        <Row label={t("dashboard.vin")} value={v.vin} />
        <Row label={t("dashboard.year")} value={String(v.year)} />
        {v.engine ? <Row label={t("dashboard.engine")} value={v.engine} /> : null}
        <Row
          label={t("dashboard.mileage")}
          value={v.mileageKm != null ? `${v.mileageKm.toLocaleString()} km` : "—"}
        />
      </Card>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreCard: { alignItems: "center", gap: spacing.xs },
  scoreLabel: { ...typography.caption, color: colors.textMuted, letterSpacing: 1 },
  scoreValue: { fontSize: 48, fontWeight: "700", color: colors.primary },
  scoreHint: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  rowLabel: { ...typography.body, color: colors.textMuted },
  rowValue: { ...typography.body, color: colors.text, fontWeight: "600" },
});
