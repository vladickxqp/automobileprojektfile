import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api/client";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { colors, spacing, typography } from "../../../src/theme/tokens";

export default function VehicleDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const vehicle = useQuery({ queryKey: ["vehicle", id], queryFn: () => api.getVehicle(id), enabled: !!id });
  const summary = useQuery({ queryKey: ["expenses", id], queryFn: () => api.expenseSummary(id), enabled: !!id });
  const reminders = useQuery({ queryKey: ["reminders", id], queryFn: () => api.listReminders(id), enabled: !!id });

  if (vehicle.isLoading || !vehicle.data) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "" }} />
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const v = vehicle.data;
  const eur = summary.data?.byCurrency.EUR;
  const nextReminders = (reminders.data ?? []).slice(0, 2);

  return (
    <Screen>
      <Stack.Screen options={{ title: `${v.make} ${v.model}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>AutoScore</Text>
          <Text style={styles.scoreValue}>—</Text>
          <Text style={styles.muted}>{t("dashboard.scoreSoon")}</Text>
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

        <Card>
          <Text style={styles.cardTitle}>{t("dashboard.expenses")}</Text>
          <Text style={styles.bigValue}>{eur != null ? `${eur.toLocaleString()} EUR` : "—"}</Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>{t("dashboard.reminders")}</Text>
          {nextReminders.length === 0 ? (
            <Text style={styles.muted}>{t("dashboard.noReminders")}</Text>
          ) : (
            nextReminders.map((r) => (
              <Row
                key={r.id}
                label={r.title}
                value={r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}
              />
            ))
          )}
        </Card>

        <View style={styles.actions}>
          <Button
            title={t("dashboard.assistant")}
            onPress={() => router.push(`/vehicle/${id}/assistant`)}
          />
          <Button
            variant="secondary"
            title={t("dashboard.history")}
            onPress={() => router.push(`/vehicle/${id}/history`)}
          />
          <Button
            variant="secondary"
            title={t("dashboard.documents")}
            onPress={() => router.push(`/vehicle/${id}/documents`)}
          />
          <Button
            variant="secondary"
            title={t("dashboard.remindersScreen")}
            onPress={() => router.push(`/vehicle/${id}/reminders`)}
          />
        </View>
      </ScrollView>
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
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  scoreCard: { alignItems: "center", gap: spacing.xs },
  scoreLabel: { ...typography.caption, color: colors.textMuted, letterSpacing: 1 },
  scoreValue: { fontSize: 48, fontWeight: "700", color: colors.primary },
  cardTitle: { ...typography.caption, color: colors.textMuted, letterSpacing: 1 },
  bigValue: { ...typography.h1, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  rowLabel: { ...typography.body, color: colors.textMuted, flexShrink: 1, paddingRight: spacing.sm },
  rowValue: { ...typography.body, color: colors.text, fontWeight: "600" },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
