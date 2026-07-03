import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api/client";
import { computeFuelStats, type DashboardPeriod } from "../../../src/api/dashboard";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { BarChart } from "../../../src/ui/BarChart";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { StatTile } from "../../../src/ui/StatTile";
import { FuelIcon, GaugeIcon } from "../../../src/ui/icons";

const PERIODS: DashboardPeriod[] = ["month", "sixMonths", "year"];
const dec = (n: number, d = 1) => n.toFixed(d).replace(".", ",");
const shortDate = (iso: string) => {
  const dt = new Date(iso);
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

export default function FuelScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; period?: string }>();
  const id = params.id;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [period, setPeriod] = useState<DashboardPeriod>(
    PERIODS.includes(params.period as DashboardPeriod) ? (params.period as DashboardPeriod) : "sixMonths",
  );

  const vehicle = useQuery({ queryKey: ["vehicle", id], queryFn: () => api.getVehicle(id), enabled: !!id });
  const events = useQuery({ queryKey: ["events", id], queryFn: () => api.listEvents(id), enabled: !!id });

  const stats = useMemo(() => {
    if (!vehicle.data) return null;
    return computeFuelStats(vehicle.data, events.data ?? [], period);
  }, [vehicle.data, events.data, period]);

  const consumptionData = useMemo(
    () =>
      (stats?.fills ?? [])
        .filter((f) => f.consumption != null)
        .slice(-12)
        .map((f) => ({ label: shortDate(f.date), value: f.consumption as number })),
    [stats],
  );
  const priceData = useMemo(
    () =>
      (stats?.fills ?? [])
        .filter((f) => f.pricePerLiter != null)
        .slice(-12)
        .map((f) => ({ label: shortDate(f.date), value: f.pricePerLiter as number })),
    [stats],
  );

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("fuel.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Period selector */}
        <View style={styles.segment}>
          {PERIODS.map((p) => {
            const sel = p === period;
            return (
              <Pressable key={p} onPress={() => setPeriod(p)} style={[styles.segmentItem, sel && styles.segmentItemActive]}>
                <Text style={[styles.segmentText, sel && styles.segmentTextActive]} numberOfLines={1}>
                  {t(`dash.periods.${p}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {vehicle.isLoading || events.isLoading || !stats ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            {/* Key metrics */}
            <View style={styles.tiles}>
              <StatTile
                label={t("dash.consumption")}
                value={stats.avgConsumption != null ? `${dec(stats.avgConsumption)} l/100` : "—"}
                icon={<FuelIcon size={18} color={colors.primary} />}
              />
              <StatTile
                label={t("fuel.pricePerLiter")}
                value={stats.avgPricePerLiter != null ? `${dec(stats.avgPricePerLiter, 2)} €` : "—"}
                icon={<FuelIcon size={18} color={colors.primary} />}
              />
              <StatTile
                label={t("dash.costPerKm")}
                value={stats.costPerKm != null ? `${dec(stats.costPerKm, 2)} €` : "—"}
                icon={<GaugeIcon size={18} color={colors.primary} />}
              />
              <StatTile
                label={t("fuel.totalLiters")}
                value={`${dec(stats.totalLiters, 0)} l`}
                icon={<FuelIcon size={18} color={colors.primary} />}
              />
              <StatTile
                label={t("fuel.totalCost")}
                value={`${stats.totalCost.toLocaleString("de-DE", { maximumFractionDigits: 0 })} €`}
                icon={<FuelIcon size={18} color={colors.primary} />}
              />
              <StatTile
                label={t("dash.kmDriven")}
                value={stats.kmDriven != null ? `${stats.kmDriven.toLocaleString("de-DE")} km` : "—"}
                icon={<GaugeIcon size={18} color={colors.primary} />}
              />
            </View>

            {/* Charts */}
            {consumptionData.length > 0 ? (
              <Card>
                <Text style={styles.chartTitle}>{t("fuel.consumptionChart")}</Text>
                <BarChart data={consumptionData} format={(v) => dec(v)} />
              </Card>
            ) : null}
            {priceData.length > 0 ? (
              <Card>
                <Text style={styles.chartTitle}>{t("fuel.priceChart")}</Text>
                <BarChart data={priceData} format={(v) => dec(v, 2)} />
              </Card>
            ) : null}
            {consumptionData.length === 0 && priceData.length === 0 ? (
              <Text style={styles.muted}>{t("fuel.noData")}</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      padding: 4,
      gap: 4,
    },
    segmentItem: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: "center" },
    segmentItemActive: { backgroundColor: colors.primarySoft },
    segmentText: { ...typography.caption, color: colors.textMuted, fontWeight: "700" },
    segmentTextActive: { color: colors.primary },
    tiles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
    chartTitle: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
    muted: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.lg },
  });
