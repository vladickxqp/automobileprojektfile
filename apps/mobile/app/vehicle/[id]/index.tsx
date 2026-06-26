import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ScoreFactorDTO } from "../../../src/api/client";
import { api } from "../../../src/api/client";
import { API_URL } from "../../../src/api/config";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Car3D } from "../../../src/ui/Car3D";
import { Screen } from "../../../src/ui/Screen";
import { ScoreRing, scoreColor } from "../../../src/ui/ScoreRing";
import { StatTile } from "../../../src/ui/StatTile";
import {
  ActivityIcon,
  BellIcon,
  FileIcon,
  FuelIcon,
  GaugeIcon,
  SparkleIcon,
  WrenchIcon,
} from "../../../src/ui/icons";

export default function VehicleDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const vehicle = useQuery({ queryKey: ["vehicle", id], queryFn: () => api.getVehicle(id), enabled: !!id });
  const summary = useQuery({ queryKey: ["expenses", id], queryFn: () => api.expenseSummary(id), enabled: !!id });
  const reminders = useQuery({ queryKey: ["reminders", id], queryFn: () => api.listReminders(id), enabled: !!id });
  const score = useQuery({ queryKey: ["score", id], queryFn: () => api.getScore(id), enabled: !!id });

  const computeScore = useMutation({
    mutationFn: () => api.computeScore(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["score", id] }),
  });

  const saleReport = useMutation({
    mutationFn: () => api.generateSaleReport(id),
    onSuccess: (report) => setReportUrl(`${API_URL}${report.url}`),
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
  const eur = summary.data?.byCurrency.EUR;
  const nextReminders = (reminders.data ?? []).slice(0, 2);
  const scoreValue = score.data?.score ?? null;
  const factors = score.data?.factors ?? [];

  return (
    <Screen flush>
      <Stack.Screen options={{ title: `${v.make} ${v.model}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card elevated style={styles.hero}>
          <Car3D height={250} />
          <Text style={styles.heroTitle}>
            {v.make} {v.model}
          </Text>
          <Text style={styles.heroSub}>
            {v.year}
            {v.engine ? ` · ${v.engine}` : ""}
          </Text>
        </Card>

        {/* AutoScore */}
        <Card elevated style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <ScoreRing score={scoreValue} />
            <View style={styles.factors}>
              {factors.map((f) => (
                <FactorBar key={f.key} factor={f} colors={colors} />
              ))}
            </View>
          </View>
          <Button
            variant="secondary"
            title={scoreValue == null ? t("dashboard.computeScore") : t("dashboard.recomputeScore")}
            loading={computeScore.isPending}
            onPress={() => computeScore.mutate()}
          />
        </Card>

        {/* Key stats */}
        <View style={styles.statRow}>
          <StatTile
            label={t("dashboard.mileage")}
            value={v.mileageKm != null ? `${v.mileageKm.toLocaleString("de-DE")} km` : "—"}
            icon={<GaugeIcon size={18} color={colors.primary} />}
          />
          <StatTile
            label={t("dashboard.expenses")}
            value={eur != null ? `${eur.toLocaleString("de-DE")} €` : "—"}
            icon={<FuelIcon size={18} color={colors.primary} />}
          />
        </View>

        <Card>
          <Text style={styles.cardTitle}>{t("dashboard.vin")}</Text>
          <Text style={styles.vin} selectable>
            {v.vin}
          </Text>
        </Card>

        {/* Reminders */}
        <Card>
          <View style={styles.cardHeadRow}>
            <Text style={styles.cardTitle}>{t("dashboard.reminders")}</Text>
            <BellIcon size={18} color={colors.textMuted} />
          </View>
          {nextReminders.length === 0 ? (
            <Text style={styles.muted}>{t("dashboard.noReminders")}</Text>
          ) : (
            nextReminders.map((r) => (
              <View key={r.id} style={styles.row}>
                <Text style={styles.rowLabel}>{r.title}</Text>
                <Text style={styles.rowValue}>
                  {r.dueDate ? new Date(r.dueDate).toLocaleDateString("de-DE") : "—"}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* Sale report */}
        <Card>
          <Text style={styles.cardTitle}>{t("dashboard.prepareSale")}</Text>
          {reportUrl ? (
            <Text selectable style={styles.link}>
              {reportUrl}
            </Text>
          ) : (
            <Text style={styles.muted}>{t("dashboard.prepareSaleHint")}</Text>
          )}
          <Button
            title={reportUrl ? t("dashboard.regenerateReport") : t("dashboard.generateReport")}
            loading={saleReport.isPending}
            onPress={() => saleReport.mutate()}
          />
        </Card>

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>WERKZEUGE</Text>
        <View style={styles.actionsGrid}>
          <ActionTile
            label={t("dashboard.assistant")}
            icon={<SparkleIcon size={22} color={colors.primary} />}
            onPress={() => router.push(`/vehicle/${id}/assistant`)}
            colors={colors}
            styles={styles}
          />
          <ActionTile
            label={t("dashboard.diagnostics")}
            icon={<ActivityIcon size={22} color={colors.primary} />}
            onPress={() => router.push(`/vehicle/${id}/diagnostics`)}
            colors={colors}
            styles={styles}
          />
          <ActionTile
            label={t("dashboard.history")}
            icon={<WrenchIcon size={22} color={colors.primary} />}
            onPress={() => router.push(`/vehicle/${id}/history`)}
            colors={colors}
            styles={styles}
          />
          <ActionTile
            label={t("dashboard.documents")}
            icon={<FileIcon size={22} color={colors.primary} />}
            onPress={() => router.push(`/vehicle/${id}/documents`)}
            colors={colors}
            styles={styles}
          />
          <ActionTile
            label={t("dashboard.remindersScreen")}
            icon={<BellIcon size={22} color={colors.primary} />}
            onPress={() => router.push(`/vehicle/${id}/reminders`)}
            colors={colors}
            styles={styles}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function FactorBar({ factor, colors }: { factor: ScoreFactorDTO; colors: ThemeColors }) {
  const pct = Math.max(0, Math.min(100, factor.score));
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ ...typography.caption, color: colors.textMuted }} numberOfLines={1}>
          {factor.label}
        </Text>
        <Text style={{ ...typography.caption, color: colors.text, fontWeight: "700" }}>{pct}</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: "hidden" }}>
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 3,
            backgroundColor: scoreColor(pct, colors),
          }}
        />
      </View>
    </View>
  );
}

function ActionTile({
  label,
  icon,
  onPress,
  colors,
  styles,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && { borderColor: colors.primary }]}>
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    hero: { alignItems: "center", gap: spacing.xs, paddingBottom: spacing.lg },
    heroTitle: { ...typography.h1, color: colors.text, textAlign: "center" },
    heroSub: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
    scoreCard: { gap: spacing.lg },
    scoreRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
    factors: { flex: 1, gap: spacing.sm, minWidth: 0 },
    statRow: { flexDirection: "row", gap: spacing.md },
    cardTitle: { ...typography.label, color: colors.textMuted },
    cardHeadRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    vin: { ...typography.body, color: colors.text, fontWeight: "600", letterSpacing: 1 },
    muted: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
    link: { ...typography.caption, color: colors.primary, marginBottom: spacing.xs },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
    rowLabel: { ...typography.body, color: colors.textMuted, flexShrink: 1, paddingRight: spacing.sm },
    rowValue: { ...typography.body, color: colors.text, fontWeight: "600" },
    sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.sm },
    actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
    action: {
      width: "47%",
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    actionIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    actionLabel: { ...typography.h3, color: colors.text },
  });
