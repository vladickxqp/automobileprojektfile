import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { computeDashboard, type CostCategory, type DashboardPeriod } from "../api/dashboard";
import type { VehicleDTO, VehicleEventDTO } from "../api/client";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../theme/tokens";
import { Card } from "./Card";
import { ActivityIcon, ChevronRightIcon, FuelIcon, GaugeIcon, LayersIcon, WrenchIcon } from "./icons";

const PERIODS: DashboardPeriod[] = ["month", "sixMonths", "year"];

interface Props {
  vehicle: VehicleDTO;
  events: VehicleEventDTO[];
}

const eur = (n: number) => `${n.toLocaleString("de-DE", { maximumFractionDigits: 0 })} €`;
const km = (n: number) => `${n.toLocaleString("de-DE")} km`;

export function VehicleDashboard({ vehicle, events }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  const stats = useMemo(() => computeDashboard(vehicle, events, period), [vehicle, events, period]);

  const openCosts = (category: CostCategory) =>
    router.push(`/vehicle/${vehicle.id}/costs?category=${category}&period=${period}`);

  return (
    <View style={styles.wrap}>
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

      {/* Driving report */}
      <Card elevated style={styles.reportCard}>
        <View style={styles.reportHead}>
          <View style={styles.reportIcon}>
            <ActivityIcon size={20} color={colors.primary} />
          </View>
          <Text style={styles.reportTitle}>{t("dash.drivingReport")}</Text>
        </View>
        <View style={styles.reportRow}>
          <GaugeIcon size={18} color={colors.textMuted} />
          <Text style={styles.reportLabel}>{t("dash.kmDriven")}</Text>
          <Text style={styles.reportValue}>{stats.kmDriven != null ? km(stats.kmDriven) : "—"}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.reportRow}>
          <ActivityIcon size={18} color={colors.textMuted} />
          <Text style={styles.reportLabel}>{t("dash.perMonth")}</Text>
          <Text style={styles.reportValue}>{stats.avgKmPerMonth != null ? km(stats.avgKmPerMonth) : "—"}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.reportRow}>
          <FuelIcon size={18} color={colors.textMuted} />
          <Text style={styles.reportLabel}>{t("dash.costPerKm")}</Text>
          <Text style={styles.reportValue}>
            {stats.costPerKm != null ? `${stats.costPerKm.toFixed(2).replace(".", ",")} €` : "—"}
          </Text>
        </View>
      </Card>

      {/* Cost tiles — tap for a detailed breakdown */}
      <View style={styles.tiles}>
        <CostTile
          colors={colors}
          icon={<FuelIcon size={18} color={colors.primary} />}
          label={t("dash.fuel")}
          value={eur(stats.fuelCost)}
          hint={t("dash.entries", { count: stats.fuelCount })}
          onPress={() => openCosts("fuel")}
        />
        <CostTile
          colors={colors}
          icon={<WrenchIcon size={18} color={colors.primary} />}
          label={t("dash.repair")}
          value={eur(stats.repairCost)}
          hint={t("dash.entries", { count: stats.repairCount })}
          onPress={() => openCosts("repair")}
        />
        <CostTile
          colors={colors}
          icon={<LayersIcon size={18} color={colors.primary} />}
          label={t("dash.other")}
          value={eur(stats.otherCost)}
          hint={t("dash.entries", { count: stats.otherCount })}
          onPress={() => openCosts("other")}
        />
        <CostTile
          colors={colors}
          icon={<ActivityIcon size={18} color={colors.primary} />}
          label={t("dash.total")}
          value={eur(stats.totalCost)}
          accent
          onPress={() => openCosts("total")}
        />
      </View>
    </View>
  );
}

function CostTile({
  colors,
  icon,
  label,
  value,
  hint,
  accent,
  onPress,
}: {
  colors: ThemeColors;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  onPress?: () => void;
}) {
  const styles = makeStyles(colors);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, accent && styles.tileAccent, pressed && { borderColor: colors.primary }]}
    >
      <View style={styles.tileHead}>
        {icon}
        <Text style={styles.tileLabel} numberOfLines={1}>
          {label}
        </Text>
        <ChevronRightIcon size={16} color={colors.textFaint} />
      </View>
      <Text style={[styles.tileValue, accent && { color: colors.primary }]} numberOfLines={1}>
        {value}
      </Text>
      {hint ? <Text style={styles.tileHint}>{hint}</Text> : null}
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: spacing.md },
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
    reportCard: { gap: spacing.sm },
    reportHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
    reportIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    reportTitle: { ...typography.h3, color: colors.text },
    reportRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
    reportLabel: { ...typography.body, color: colors.text, flex: 1 },
    reportValue: { ...typography.body, color: colors.text, fontWeight: "700" },
    divider: { height: 1, backgroundColor: colors.border },
    tiles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
    tile: {
      flex: 1,
      minWidth: 150,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    tileAccent: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    tileHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    tileLabel: { ...typography.label, color: colors.textMuted, flex: 1 },
    tileValue: { ...typography.h2, color: colors.text },
    tileHint: { ...typography.caption, color: colors.textFaint },
  });
