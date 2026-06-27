import { useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, type VehicleEventDTO } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../src/theme/tokens";
import { Badge, type BadgeTone } from "../../src/ui/Badge";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { CarPhoto } from "../../src/ui/CarPhoto";
import { Screen } from "../../src/ui/Screen";
import { ScoreRing } from "../../src/ui/ScoreRing";
import { Skeleton } from "../../src/ui/Skeleton";
import {
  ActivityIcon,
  ChevronRightIcon,
  FileIcon,
  FuelIcon,
  PlusIcon,
  ShieldIcon,
  SparkleIcon,
  WrenchIcon,
} from "../../src/ui/icons";

function describe(e: VehicleEventDTO): string {
  if (e.type === "expense") {
    return `${String(e.payload.category ?? "")} · ${Number(e.payload.amount)} ${String(e.payload.currency ?? "EUR")}`;
  }
  return String(e.payload.title ?? e.type);
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { ready, user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: api.listVehicles, enabled: ready && !!user });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const current = vehicles.data?.find((v) => v.id === selectedId) ?? vehicles.data?.[0];
  const id = current?.id;

  const score = useQuery({ queryKey: ["score", id], queryFn: () => api.getScore(id!), enabled: !!id });
  const reminders = useQuery({ queryKey: ["reminders", id], queryFn: () => api.listReminders(id!), enabled: !!id });
  const documents = useQuery({ queryKey: ["documents", id], queryFn: () => api.listDocuments(id!), enabled: !!id });
  const summary = useQuery({ queryKey: ["expenses", id], queryFn: () => api.expenseSummary(id!), enabled: !!id });
  const events = useQuery({ queryKey: ["events", id], queryFn: () => api.listEvents(id!), enabled: !!id });

  if (!ready) return <Screen><Skeleton height={220} radius={16} /></Screen>;
  if (!user) return <Redirect href="/sign-in" />;

  if (!vehicles.isLoading && (vehicles.data?.length ?? 0) === 0) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("home.noVehicleTitle")}</Text>
          <Text style={styles.emptySub}>{t("home.noVehicleSub")}</Text>
          <Button
            title={t("home.addVehicle")}
            icon={<PlusIcon size={20} color={colors.onPrimary} />}
            onPress={() => router.push("/add-vehicle")}
          />
        </View>
      </Screen>
    );
  }

  const statusOf = (date?: string | null): { label: string; tone: BadgeTone } => {
    if (!date) return { label: "—", tone: "neutral" };
    const d = Math.ceil((+new Date(date) - Date.now()) / 86_400_000);
    if (d < 0) return { label: t("home.expired"), tone: "danger" };
    if (d < 30) return { label: t("home.expiringSoon"), tone: "warning" };
    return { label: t("home.valid"), tone: "success" };
  };

  const tuv = (documents.data ?? []).find((d) => d.type === "TÜV");
  const ins = (documents.data ?? []).find((d) => d.type === "insurance");
  const nextRem = (reminders.data ?? [])
    .filter((r) => r.dueDate)
    .sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!))[0];
  const eur = summary.data?.byCurrency.EUR;
  const recent = (events.data ?? []).slice(0, 3);

  const actions = [
    { label: t("home.askAi"), icon: <SparkleIcon size={22} color={colors.primary} />, to: `/vehicle/${id}/assistant` },
    { label: t("home.scanObd"), icon: <ActivityIcon size={22} color={colors.primary} />, to: `/vehicle/${id}/diagnostics` },
    { label: t("home.addExpense"), icon: <FuelIcon size={22} color={colors.primary} />, to: `/vehicle/${id}/add-event` },
    { label: t("home.uploadDoc"), icon: <FileIcon size={22} color={colors.primary} />, to: `/vehicle/${id}/documents` },
    { label: t("home.addMaintenance"), icon: <WrenchIcon size={22} color={colors.primary} />, to: `/vehicle/${id}/add-event` },
  ];

  return (
    <Screen flush>
      <ScrollView contentContainerStyle={styles.content}>
        {vehicles.isLoading || !current ? (
          <>
            <Skeleton height={200} radius={16} />
            <Skeleton height={120} radius={16} />
          </>
        ) : (
          <>
            {/* Vehicle switcher */}
            {(vehicles.data?.length ?? 0) > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcher}>
                {vehicles.data!.map((v) => {
                  const sel = v.id === id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => setSelectedId(v.id)}
                      style={[styles.switchChip, sel && styles.switchChipActive]}
                    >
                      <Text style={[styles.switchText, sel && styles.switchTextActive]} numberOfLines={1}>
                        {v.make} {v.model}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Current vehicle hero */}
            <Pressable onPress={() => router.push(`/vehicle/${id}`)}>
              <Card elevated style={styles.hero}>
                <CarPhoto uri={current.photoUrl} height={170} />
                <View style={styles.heroRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>
                      {current.make} {current.model}
                    </Text>
                    <Text style={styles.heroSub}>
                      {current.year}
                      {current.mileageKm != null ? ` · ${current.mileageKm.toLocaleString("de-DE")} km` : ""}
                    </Text>
                  </View>
                  <ScoreRing score={score.data?.score ?? null} size={84} strokeWidth={9} />
                </View>
              </Card>
            </Pressable>

            {/* Quick actions */}
            <Text style={styles.sectionLabel}>{t("home.quickActions").toUpperCase()}</Text>
            <View style={styles.actions}>
              {actions.map((a) => (
                <Pressable
                  key={a.label}
                  onPress={() => router.push(a.to)}
                  style={({ pressed }) => [styles.action, pressed && { borderColor: colors.primary }]}
                >
                  <View style={styles.actionIcon}>{a.icon}</View>
                  <Text style={styles.actionLabel} numberOfLines={1}>
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Status */}
            <Text style={styles.sectionLabel}>{t("home.status").toUpperCase()}</Text>
            <Card>
              <StatusRow icon={<ShieldIcon size={18} color={colors.textMuted} />} label={t("home.tuv")} date={tuv?.expiresAt ?? null} statusOf={statusOf} colors={colors} styles={styles} />
              <View style={styles.divider} />
              <StatusRow icon={<FileIcon size={18} color={colors.textMuted} />} label={t("home.insurance")} date={ins?.expiresAt ?? null} statusOf={statusOf} colors={colors} styles={styles} />
              <View style={styles.divider} />
              <View style={styles.statusRow}>
                <WrenchIcon size={18} color={colors.textMuted} />
                <Text style={styles.statusLabel}>{t("home.nextService")}</Text>
                <Text style={styles.statusValue} numberOfLines={1}>
                  {nextRem ? `${nextRem.title} · ${new Date(nextRem.dueDate!).toLocaleDateString("de-DE")}` : t("home.none")}
                </Text>
              </View>
            </Card>

            {/* Expenses snapshot */}
            <Pressable onPress={() => router.push(`/vehicle/${id}/expenses`)}>
              <Card style={styles.expenseCard}>
                <View>
                  <Text style={styles.cardLabel}>{t("dashboard.expenses")}</Text>
                  <Text style={styles.expenseValue}>{eur != null ? `${eur.toLocaleString("de-DE")} €` : "—"}</Text>
                </View>
                <ChevronRightIcon size={22} color={colors.textFaint} />
              </Card>
            </Pressable>

            {/* Recent activity */}
            <View style={styles.recentHead}>
              <Text style={styles.sectionLabel}>{t("home.recent").toUpperCase()}</Text>
              <Pressable onPress={() => router.push(`/vehicle/${id}/history`)}>
                <ChevronRightIcon size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <Card>
              {recent.length === 0 ? (
                <Text style={styles.muted}>{t("home.noActivity")}</Text>
              ) : (
                recent.map((e, i) => (
                  <View key={e.id}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.activityRow}>
                      <Text style={styles.activityText} numberOfLines={1}>
                        {describe(e)}
                      </Text>
                      <Text style={styles.muted}>{new Date(e.occurredAt).toLocaleDateString("de-DE")}</Text>
                    </View>
                  </View>
                ))
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function StatusRow({
  icon,
  label,
  date,
  statusOf,
  colors,
  styles,
}: {
  icon: ReactNode;
  label: string;
  date: string | null;
  statusOf: (d?: string | null) => { label: string; tone: BadgeTone };
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  const s = statusOf(date);
  return (
    <View style={styles.statusRow}>
      {icon}
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusDate}>{date ? new Date(date).toLocaleDateString("de-DE") : ""}</Text>
      <Badge label={s.label} tone={s.tone} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    switcher: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.lg },
    switchChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    switchChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    switchText: { ...typography.caption, color: colors.textMuted, fontWeight: "700" },
    switchTextActive: { color: colors.primary },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
    emptyTitle: { ...typography.h1, color: colors.text, textAlign: "center" },
    emptySub: { ...typography.body, color: colors.textMuted, textAlign: "center" },
    hero: { gap: spacing.md },
    heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    heroTitle: { ...typography.h1, color: colors.text },
    heroSub: { ...typography.caption, color: colors.textMuted },
    sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.xs },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    action: {
      width: "30%",
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      gap: spacing.sm,
      alignItems: "center",
    },
    actionIcon: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    actionLabel: { ...typography.caption, color: colors.text, fontWeight: "600", textAlign: "center" },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
    statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
    statusLabel: { ...typography.body, color: colors.text, flex: 1 },
    statusDate: { ...typography.caption, color: colors.textMuted },
    statusValue: { ...typography.caption, color: colors.text, fontWeight: "600", flexShrink: 1 },
    expenseCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    cardLabel: { ...typography.label, color: colors.textMuted },
    expenseValue: { ...typography.h1, color: colors.text },
    recentHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    activityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.md },
    activityText: { ...typography.body, color: colors.text, flex: 1 },
    muted: { ...typography.caption, color: colors.textMuted },
  });
