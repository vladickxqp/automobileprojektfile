import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../src/api/client";
import { useTheme } from "../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Badge } from "../src/ui/Badge";
import { Card } from "../src/ui/Card";
import { Screen } from "../src/ui/Screen";
import { ScoreRing } from "../src/ui/ScoreRing";
import { StatTile } from "../src/ui/StatTile";
import { BellIcon, ChartIcon, ChevronRightIcon, GaugeIcon, LayersIcon } from "../src/ui/icons";

export default function FleetScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const summary = useQuery({ queryKey: ["fleetSummary"], queryFn: api.fleetSummary });
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: api.listVehicles });

  if (summary.isLoading || !summary.data) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t("fleet.title") }} />
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const s = summary.data;

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("fleet.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card elevated style={styles.hero}>
          <ScoreRing score={s.avgScore} label={t("fleet.avgCondition")} size={120} />
          <View style={styles.heroSide}>
            <View style={styles.heroRow}>
              <LayersIcon size={18} color={colors.primary} />
              <Text style={styles.heroText}>{t("fleet.vehicles", { count: s.vehicles })}</Text>
            </View>
            <View style={styles.heroRow}>
              <BellIcon size={18} color={colors.warning} />
              <Text style={styles.heroText}>{t("fleet.dueReminders", { count: s.dueReminders })}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.statRow}>
          <StatTile label={t("fleet.totalKm")} value={`${s.totalKm.toLocaleString("de-DE")} km`} icon={<GaugeIcon size={18} color={colors.primary} />} />
          <StatTile label={t("fleet.totalCost")} value={`${s.totalSpentEur.toLocaleString("de-DE")} €`} icon={<ChartIcon size={18} color={colors.primary} />} />
        </View>

        <Text style={styles.sectionLabel}>{t("garage.vehicles")}</Text>
        {(vehicles.data ?? []).map((v) => (
          <Pressable key={v.id} onPress={() => router.push(`/vehicle/${v.id}`)}>
            {({ pressed }) => (
              <Card style={[styles.row, pressed && { borderColor: colors.borderStrong }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vTitle}>
                    {v.make} {v.model}
                  </Text>
                  <Text style={styles.muted}>
                    {v.year}
                    {v.mileageKm != null ? ` · ${v.mileageKm.toLocaleString("de-DE")} km` : ""}
                  </Text>
                </View>
                {v.plate ? <Badge label={v.plate} /> : null}
                <ChevronRightIcon size={20} color={colors.textFaint} />
              </Card>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    hero: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
    heroSide: { flex: 1, gap: spacing.md },
    heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    heroText: { ...typography.body, color: colors.text, fontWeight: "600" },
    statRow: { flexDirection: "row", gap: spacing.md },
    sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.sm },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    vTitle: { ...typography.h3, color: colors.text },
    muted: { ...typography.caption, color: colors.textMuted },
  });
