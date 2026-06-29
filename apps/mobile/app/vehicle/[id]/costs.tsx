import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api/client";
import { listCostEntries, type CostCategory, type CostEntry, type DashboardPeriod } from "../../../src/api/dashboard";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { ActivityIcon, ChevronRightIcon, FuelIcon, GaugeIcon, LayersIcon, WrenchIcon } from "../../../src/ui/icons";

const CATEGORIES: CostCategory[] = ["fuel", "repair", "other", "total"];
const PERIODS: DashboardPeriod[] = ["month", "sixMonths", "year"];

const eur = (n: number) => `${n.toLocaleString("de-DE", { maximumFractionDigits: 0 })} €`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("de-DE");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function CostsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; category?: string; period?: string }>();
  const id = params.id;
  const category: CostCategory = CATEGORIES.includes(params.category as CostCategory)
    ? (params.category as CostCategory)
    : "total";
  const period: DashboardPeriod = PERIODS.includes(params.period as DashboardPeriod)
    ? (params.period as DashboardPeriod)
    : "month";

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const events = useQuery({ queryKey: ["events", id], queryFn: () => api.listEvents(id), enabled: !!id });

  const entries = useMemo(
    () => listCostEntries(events.data ?? [], period, category),
    [events.data, period, category],
  );
  const total = useMemo(() => entries.reduce((sum, e) => sum + e.amount, 0), [entries]);

  const groupIcon = (group: CostEntry["group"], size = 18) => {
    if (group === "fuel") return <FuelIcon size={size} color={colors.primary} />;
    if (group === "repair") return <WrenchIcon size={size} color={colors.primary} />;
    return <LayersIcon size={size} color={colors.primary} />;
  };

  const catLabel = t(`dash.${category}`);

  const primaryText = (e: CostEntry) => {
    if (e.group === "repair")
      return e.title ?? (e.category ? t(`addEvent.categories.${e.category}`, { defaultValue: cap(e.category) }) : t("dash.repair"));
    if (e.group === "fuel") return t("dash.fuel");
    return e.category ? cap(e.category) : t("dash.other");
  };
  const detailText = (e: CostEntry) => {
    if (e.group === "repair") return e.diy ? t("addEvent.diy") : (e.workshop ?? "");
    return e.note ?? "";
  };

  return (
    <Screen flush>
      <Stack.Screen options={{ title: catLabel }} />
      <View style={styles.body}>
        {/* Summary */}
        <Card elevated style={styles.summary}>
          <View style={styles.summaryIcon}>
            {category === "total" ? <ActivityIcon size={22} color={colors.primary} /> : groupIcon(category as CostEntry["group"], 22)}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>{t(`dash.periods.${period}`)}</Text>
            <Text style={styles.summaryValue}>{eur(total)}</Text>
            <Text style={styles.summaryHint}>{t("dash.entries", { count: entries.length })}</Text>
          </View>
        </Card>

        {events.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : entries.length === 0 ? (
          <Text style={styles.empty}>{t("dash.noEntries")}</Text>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(e) => e.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const detail = detailText(item);
              return (
                <Pressable onPress={() => router.push(`/vehicle/${id}/add-event?eventId=${item.id}`)}>
                  {({ pressed }) => (
                    <Card style={pressed ? { borderColor: colors.borderStrong } : undefined}>
                      <View style={styles.row}>
                        <View style={styles.rowIcon}>{groupIcon(item.group)}</View>
                        <View style={styles.rowInfo}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {primaryText(item)}
                          </Text>
                          <View style={styles.metaRow}>
                            <Text style={styles.meta}>{fmtDate(item.date)}</Text>
                            {item.mileageKm != null ? (
                              <>
                                <GaugeIcon size={13} color={colors.textFaint} />
                                <Text style={styles.meta}>{item.mileageKm.toLocaleString("de-DE")} km</Text>
                              </>
                            ) : null}
                          </View>
                          {detail ? (
                            <Text style={styles.detail} numberOfLines={1}>
                              {detail}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.rowEnd}>
                          <Text style={styles.amount}>{eur(item.amount)}</Text>
                          <ChevronRightIcon size={16} color={colors.textFaint} />
                        </View>
                      </View>
                    </Card>
                  )}
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    body: { flex: 1, padding: spacing.lg, gap: spacing.md },
    summary: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    summaryIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryLabel: { ...typography.label, color: colors.textMuted },
    summaryValue: { ...typography.h1, color: colors.text },
    summaryHint: { ...typography.caption, color: colors.textFaint },
    list: { gap: spacing.md, paddingBottom: spacing.xl },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    rowInfo: { flex: 1, gap: 2 },
    rowTitle: { ...typography.h3, color: colors.text },
    metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
    meta: { ...typography.caption, color: colors.textMuted },
    detail: { ...typography.caption, color: colors.textFaint },
    rowEnd: { alignItems: "flex-end", gap: 2, flexDirection: "row" },
    amount: { ...typography.h3, color: colors.text },
    empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  });
