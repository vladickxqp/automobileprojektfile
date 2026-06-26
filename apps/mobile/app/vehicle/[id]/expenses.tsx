import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";

const BAR_COLORS = ["#F2552A", "#2FB47C", "#E8A13C", "#5B8DEF", "#A77BCA", "#E5484D"];

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const catLabel = (c: string) => t(`expenses.categories.${c}`, { defaultValue: c });

  const summary = useQuery({ queryKey: ["expenses", id], queryFn: () => api.expenseSummary(id), enabled: !!id });
  const events = useQuery({ queryKey: ["events", id, "expense"], queryFn: () => api.listEvents(id, "expense"), enabled: !!id });

  if (summary.isLoading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t("expenses.title") }} />
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const byCategory = summary.data?.byCategory ?? {};
  const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...categories.map(([, v]) => v));
  const totalEur = summary.data?.byCurrency.EUR ?? 0;

  return (
    <Screen flush>
      <Stack.Screen options={{ title: "Ausgaben" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card elevated style={styles.totalCard}>
          <Text style={styles.totalLabel}>{t("expenses.total")}</Text>
          <Text style={styles.totalValue}>{totalEur.toLocaleString("de-DE")} €</Text>
          <Text style={styles.totalSub}>{t("expenses.bookings", { count: summary.data?.count ?? 0 })}</Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>{t("expenses.byCategory")}</Text>
          {categories.length === 0 ? (
            <Text style={styles.muted}>{t("expenses.noExpenses")}</Text>
          ) : (
            <View style={styles.bars}>
              {categories.map(([cat, value], i) => (
                <View key={cat} style={styles.barRow}>
                  <View style={styles.barHead}>
                    <Text style={styles.barLabel}>{catLabel(cat)}</Text>
                    <Text style={styles.barValue}>{value.toLocaleString("de-DE")} €</Text>
                  </View>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        { width: `${(value / max) * 100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>{t("expenses.timeline")}</Text>
          {(events.data?.length ?? 0) === 0 ? (
            <Text style={styles.muted}>{t("expenses.noEntries")}</Text>
          ) : (
            events.data!.map((e) => (
              <View key={e.id} style={styles.eventRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{catLabel(String(e.payload.category ?? "other"))}</Text>
                  <Text style={styles.muted}>{new Date(e.occurredAt).toLocaleDateString("de-DE")}</Text>
                </View>
                <Text style={styles.eventAmount}>
                  {Number(e.payload.amount).toLocaleString("de-DE")} {String(e.payload.currency ?? "EUR")}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    totalCard: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.xl },
    totalLabel: { ...typography.label, color: colors.textMuted },
    totalValue: { fontSize: 44, fontWeight: "800", color: colors.text },
    totalSub: { ...typography.caption, color: colors.textMuted },
    cardTitle: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
    muted: { ...typography.caption, color: colors.textMuted },
    bars: { gap: spacing.md },
    barRow: { gap: spacing.xs },
    barHead: { flexDirection: "row", justifyContent: "space-between" },
    barLabel: { ...typography.body, color: colors.text },
    barValue: { ...typography.body, color: colors.text, fontWeight: "700" },
    track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
    fill: { height: "100%", borderRadius: radius.pill },
    eventRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    eventTitle: { ...typography.body, color: colors.text, fontWeight: "600" },
    eventAmount: { ...typography.body, color: colors.text, fontWeight: "700" },
  });
