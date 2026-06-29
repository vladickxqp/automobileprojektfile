import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ScoreFactorDTO } from "../../../src/api/client";
import { api } from "../../../src/api/client";
import { API_URL } from "../../../src/api/config";
import { computeRecommendations } from "../../../src/api/maintenance";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge, type BadgeTone } from "../../../src/ui/Badge";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { CarPhoto } from "../../../src/ui/CarPhoto";
import { IconButton } from "../../../src/ui/IconButton";
import { Screen } from "../../../src/ui/Screen";
import { ScoreRing, scoreColor } from "../../../src/ui/ScoreRing";
import { Skeleton } from "../../../src/ui/Skeleton";
import { StatTile } from "../../../src/ui/StatTile";
import {
  ActivityIcon,
  BellIcon,
  CalculatorIcon,
  ChartIcon,
  ChevronRightIcon,
  FileIcon,
  FuelIcon,
  GaugeIcon,
  MapPinIcon,
  PencilIcon,
  SearchIcon,
  ShieldIcon,
  SlidersIcon,
  SparkleIcon,
  TrashIcon,
  WrenchIcon,
} from "../../../src/ui/icons";

function vehicleStatus(
  date: string | null | undefined,
  t: (key: string) => string,
): { label: string; tone: BadgeTone } {
  if (!date) return { label: "—", tone: "neutral" };
  const d = Math.ceil((+new Date(date) - Date.now()) / 86_400_000);
  if (d < 0) return { label: t("home.expired"), tone: "danger" };
  if (d < 30) return { label: t("home.expiringSoon"), tone: "warning" };
  return { label: t("home.valid"), tone: "success" };
}

export default function VehicleDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "tools">("overview");

  const vehicle = useQuery({ queryKey: ["vehicle", id], queryFn: () => api.getVehicle(id), enabled: !!id });
  const summary = useQuery({ queryKey: ["expenses", id], queryFn: () => api.expenseSummary(id), enabled: !!id });
  const reminders = useQuery({ queryKey: ["reminders", id], queryFn: () => api.listReminders(id), enabled: !!id });
  const documents = useQuery({ queryKey: ["documents", id], queryFn: () => api.listDocuments(id), enabled: !!id });
  const score = useQuery({ queryKey: ["score", id], queryFn: () => api.getScore(id), enabled: !!id });
  const events = useQuery({ queryKey: ["events", id], queryFn: () => api.listEvents(id), enabled: !!id });

  const computeScore = useMutation({
    mutationFn: () => api.computeScore(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["score", id] }),
  });

  const saleReport = useMutation({
    mutationFn: () => api.generateSaleReport(id),
    onSuccess: (report) => setReportUrl(`${API_URL}${report.url}`),
  });

  const del = useMutation({
    mutationFn: () => api.deleteVehicle(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["fleetSummary"] });
      router.replace("/home");
    },
  });

  const confirmDelete = () => {
    const title = t("editVehicle.delete");
    const msg = t("editVehicle.deleteConfirm");
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(msg)) del.mutate();
    } else {
      Alert.alert(title, msg, [
        { text: t("common.cancel"), style: "cancel" },
        { text: title, style: "destructive", onPress: () => del.mutate() },
      ]);
    }
  };

  if (vehicle.isLoading || !vehicle.data) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "" }} />
        <Skeleton height={250} radius={16} />
        <Skeleton height={140} radius={16} />
        <Skeleton height={90} radius={16} />
      </Screen>
    );
  }

  const v = vehicle.data;
  const eur = summary.data?.byCurrency.EUR;
  const docs = documents.data ?? [];
  const rems = reminders.data ?? [];
  const tuvDoc = docs.find((d) => d.type === "TÜV");
  const insDoc = docs.find((d) => d.type === "insurance");
  const nextRem = rems
    .filter((r) => r.dueDate)
    .sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!))[0];
  const recs = computeRecommendations(v, events.data ?? [], docs, t);
  const scoreValue = score.data?.score ?? null;
  const factors = score.data?.factors ?? [];

  return (
    <Screen flush>
      <Stack.Screen
        options={{
          title: `${v.make} ${v.model}`,
          headerRight: () => (
            <View style={{ paddingRight: 4 }}>
              <IconButton variant="ghost" accessibilityLabel={t("dashboard.edit")} onPress={() => router.push(`/vehicle/${id}/edit`)}>
                <PencilIcon size={20} color={colors.text} />
              </IconButton>
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card elevated style={styles.hero}>
          <CarPhoto uri={v.photoUrl} height={210} />
          <Text style={styles.heroTitle}>
            {v.make} {v.model}
          </Text>
          <Text style={styles.heroSub}>
            {v.year}
            {v.engine ? ` · ${v.engine}` : ""}
          </Text>
        </Card>

        <View style={styles.segment}>
          <Pressable
            style={[styles.segmentItem, tab === "overview" && styles.segmentActive]}
            onPress={() => setTab("overview")}
          >
            <Text style={[styles.segmentText, tab === "overview" && styles.segmentTextActive]}>
              {t("dashboard.overview")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentItem, tab === "tools" && styles.segmentActive]}
            onPress={() => setTab("tools")}
          >
            <Text style={[styles.segmentText, tab === "tools" && styles.segmentTextActive]}>
              {t("dashboard.toolsTab")}
            </Text>
          </Pressable>
        </View>

        {tab === "overview" ? (
          <>
        {/* Vehicle history shortcut */}
        <Pressable onPress={() => router.push(`/vehicle/${id}/history`)}>
          {({ pressed }) => (
            <Card style={[styles.histCard, pressed && { borderColor: colors.primary }]}>
              <View style={styles.histIcon}>
                <WrenchIcon size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.histTitle}>{t("history.title")}</Text>
                <Text style={styles.muted}>{t("history.subtitle")}</Text>
              </View>
              <ChevronRightIcon size={20} color={colors.textFaint} />
            </Card>
          )}
        </Pressable>

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

        {/* Status */}
        <Card>
          <Text style={styles.cardTitle}>{t("home.status")}</Text>
          <Pressable style={styles.statusRow} onPress={() => router.push(`/vehicle/${id}/document?type=TÜV`)}>
            <ShieldIcon size={18} color={colors.textMuted} />
            <Text style={styles.statusLabel}>{t("home.tuv")}</Text>
            <Text style={styles.statusDate}>
              {tuvDoc?.expiresAt ? new Date(tuvDoc.expiresAt).toLocaleDateString("de-DE") : ""}
            </Text>
            <Badge {...vehicleStatus(tuvDoc?.expiresAt, t)} />
            <ChevronRightIcon size={16} color={colors.textFaint} />
          </Pressable>
          <View style={styles.statusDivider} />
          <Pressable style={styles.statusRow} onPress={() => router.push(`/vehicle/${id}/document?type=insurance`)}>
            <FileIcon size={18} color={colors.textMuted} />
            <Text style={styles.statusLabel}>{t("home.insurance")}</Text>
            <Text style={styles.statusDate}>
              {insDoc?.expiresAt ? new Date(insDoc.expiresAt).toLocaleDateString("de-DE") : ""}
            </Text>
            <Badge {...vehicleStatus(insDoc?.expiresAt, t)} />
            <ChevronRightIcon size={16} color={colors.textFaint} />
          </Pressable>
          <View style={styles.statusDivider} />
          <View style={styles.statusRow}>
            <WrenchIcon size={18} color={colors.textMuted} />
            <Text style={styles.statusLabel}>{t("home.nextService")}</Text>
            <Text style={styles.statusValue} numberOfLines={1}>
              {nextRem ? `${nextRem.title} · ${new Date(nextRem.dueDate!).toLocaleDateString("de-DE")}` : t("home.none")}
            </Text>
          </View>
        </Card>

        {/* Maintenance recommendations */}
        <Card>
          <Text style={styles.cardTitle}>{t("recommend.title")}</Text>
          {recs.length === 0 ? (
            <Text style={styles.muted}>{t("recommend.allGood")}</Text>
          ) : (
            recs.map((r) => {
              const tone = r.severity === "danger" ? colors.danger : r.severity === "warning" ? colors.warning : colors.success;
              return (
                <View key={r.id} style={styles.statusRow}>
                  <View style={[styles.upDot, { backgroundColor: tone }]} />
                  <Text style={styles.statusLabel}>{r.label}</Text>
                  {r.detail ? <Text style={[styles.recDetail, { color: tone }]}>{r.detail}</Text> : null}
                </View>
              );
            })
          )}
        </Card>

        <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
          <TrashIcon size={18} color={colors.danger} />
          <Text style={styles.deleteText}>{t("editVehicle.delete")}</Text>
        </Pressable>
          </>
        ) : (
          <>
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
            label={t("dashboard.costs")}
            icon={<ChartIcon size={22} color={colors.primary} />}
            onPress={() => router.push(`/vehicle/${id}/expenses`)}
            colors={colors}
            styles={styles}
          />
          <ActionTile
            label={t("dashboard.repairCosts")}
            icon={<CalculatorIcon size={22} color={colors.primary} />}
            onPress={() => router.push(`/vehicle/${id}/calculator`)}
            colors={colors}
            styles={styles}
          />
          <ActionTile
            label={t("dashboard.modifications")}
            icon={<SlidersIcon size={22} color={colors.primary} />}
            onPress={() => router.push(`/vehicle/${id}/modifications`)}
            colors={colors}
            styles={styles}
          />
          <ActionTile
            label={t("dashboard.parts")}
            icon={<SearchIcon size={22} color={colors.primary} />}
            onPress={() => router.push(`/vehicle/${id}/parts`)}
            colors={colors}
            styles={styles}
          />
          <ActionTile
            label={t("dashboard.services")}
            icon={<MapPinIcon size={22} color={colors.primary} />}
            onPress={() => router.push(`/vehicle/${id}/services`)}
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
          </>
        )}
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
    segment: { flexDirection: "row", backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4 },
    segmentItem: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center" },
    segmentActive: { backgroundColor: colors.primary },
    segmentText: { ...typography.body, fontWeight: "700", color: colors.textMuted },
    segmentTextActive: { color: colors.onPrimary },
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
    upRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
    upDot: { width: 8, height: 8, borderRadius: 4 },
    upLabel: { ...typography.body, color: colors.text, flex: 1 },
    upDate: { ...typography.caption, color: colors.textMuted },
    upIn: { ...typography.caption, fontWeight: "700", width: 66, textAlign: "right" },
    statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
    statusLabel: { ...typography.body, color: colors.text, flex: 1 },
    statusDate: { ...typography.caption, color: colors.textMuted },
    statusValue: { ...typography.caption, color: colors.text, fontWeight: "600", flexShrink: 1 },
    statusDivider: { height: 1, backgroundColor: colors.border },
    recDetail: { ...typography.caption, fontWeight: "700" },
    histCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    histIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    histTitle: { ...typography.h3, color: colors.text },
    deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, marginTop: spacing.xs },
    deleteText: { ...typography.body, color: colors.danger, fontWeight: "700" },
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
