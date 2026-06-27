import { useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../src/theme/tokens";
import { Badge, type BadgeTone } from "../../src/ui/Badge";
import { Card } from "../../src/ui/Card";
import { CarPhoto } from "../../src/ui/CarPhoto";
import { Screen } from "../../src/ui/Screen";
import { ScoreRing } from "../../src/ui/ScoreRing";
import { Skeleton } from "../../src/ui/Skeleton";
import { StatTile } from "../../src/ui/StatTile";
import { ChevronRightIcon, FileIcon, FuelIcon, GaugeIcon, ShieldIcon } from "../../src/ui/icons";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { ready, user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: api.listVehicles, enabled: ready && !!user });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const list = vehicles.data ?? [];
  const current = list.find((v) => v.id === selectedId) ?? list[0];
  const id = current?.id;

  const score = useQuery({ queryKey: ["score", id], queryFn: () => api.getScore(id!), enabled: !!id });
  const summary = useQuery({ queryKey: ["expenses", id], queryFn: () => api.expenseSummary(id!), enabled: !!id });
  const documents = useQuery({ queryKey: ["documents", id], queryFn: () => api.listDocuments(id!), enabled: !!id });

  if (!ready) {
    return (
      <Screen>
        <Skeleton height={260} radius={20} />
      </Screen>
    );
  }
  if (!user) return <Redirect href="/sign-in" />;

  if (!vehicles.isLoading && list.length === 0) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("home.noVehicleTitle")}</Text>
          <Text style={styles.emptySub}>{t("home.noVehicleSub")}</Text>
        </View>
      </Screen>
    );
  }

  const status = (date?: string | null): { label: string; tone: BadgeTone } => {
    if (!date) return { label: "—", tone: "neutral" };
    const d = Math.ceil((+new Date(date) - Date.now()) / 86_400_000);
    if (d < 0) return { label: t("home.expired"), tone: "danger" };
    if (d < 30) return { label: t("home.expiringSoon"), tone: "warning" };
    return { label: t("home.valid"), tone: "success" };
  };
  const docs = documents.data ?? [];
  const tuv = docs.find((d) => d.type === "TÜV");
  const ins = docs.find((d) => d.type === "insurance");
  const eur = summary.data?.byCurrency.EUR;

  return (
    <Screen flush>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Switch the main vehicle */}
        {list.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcher}>
            {list.map((v) => {
              const sel = v.id === id;
              return (
                <Pressable key={v.id} onPress={() => setSelectedId(v.id)} style={[styles.switchChip, sel && styles.switchChipActive]}>
                  <Text style={[styles.switchText, sel && styles.switchTextActive]} numberOfLines={1}>
                    {v.make} {v.model}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {vehicles.isLoading || !current ? (
          <Skeleton height={260} radius={20} />
        ) : (
          <>
            {/* Main vehicle — clickable */}
            <Pressable onPress={() => router.push(`/vehicle/${id}`)}>
              {({ pressed }) => (
                <Card elevated style={[styles.hero, pressed && { borderColor: colors.borderStrong }]}>
                  <CarPhoto uri={current.photoUrl} height={170} />
                  <View style={styles.heroRow}>
                    <View style={styles.heroInfo}>
                      <Text style={styles.name} numberOfLines={1}>
                        {current.make} {current.model}
                      </Text>
                      <Text style={styles.sub}>
                        {current.year}
                        {current.engine ? ` · ${current.engine}` : ""}
                      </Text>
                    </View>
                    <ScoreRing score={score.data?.score ?? null} size={76} strokeWidth={8} />
                  </View>
                  <View style={styles.openRow}>
                    <Text style={styles.openText}>{t("dashboard.overview")}</Text>
                    <ChevronRightIcon size={18} color={colors.primary} />
                  </View>
                </Card>
              )}
            </Pressable>

            {/* Key stats */}
            <View style={styles.statRow}>
              <StatTile
                label={t("dashboard.mileage")}
                value={current.mileageKm != null ? `${current.mileageKm.toLocaleString("de-DE")} km` : "—"}
                icon={<GaugeIcon size={18} color={colors.primary} />}
              />
              <StatTile
                label={t("dashboard.expenses")}
                value={eur != null ? `${eur.toLocaleString("de-DE")} €` : "—"}
                icon={<FuelIcon size={18} color={colors.primary} />}
              />
            </View>

            {/* Status */}
            <Card>
              <Text style={styles.cardTitle}>{t("home.status")}</Text>
              <View style={styles.statusRow}>
                <ShieldIcon size={18} color={colors.textMuted} />
                <Text style={styles.statusLabel}>{t("home.tuv")}</Text>
                <Text style={styles.statusDate}>
                  {tuv?.expiresAt ? new Date(tuv.expiresAt).toLocaleDateString("de-DE") : ""}
                </Text>
                <Badge {...status(tuv?.expiresAt)} />
              </View>
              <View style={styles.divider} />
              <View style={styles.statusRow}>
                <FileIcon size={18} color={colors.textMuted} />
                <Text style={styles.statusLabel}>{t("home.insurance")}</Text>
                <Text style={styles.statusDate}>
                  {ins?.expiresAt ? new Date(ins.expiresAt).toLocaleDateString("de-DE") : ""}
                </Text>
                <Badge {...status(ins?.expiresAt)} />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
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
    hero: { gap: spacing.md },
    heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    heroInfo: { flex: 1, gap: spacing.xs },
    name: { ...typography.h2, color: colors.text },
    sub: { ...typography.caption, color: colors.textMuted },
    openRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
    openText: { ...typography.label, color: colors.primary },
    statRow: { flexDirection: "row", gap: spacing.md },
    cardTitle: { ...typography.label, color: colors.textMuted },
    statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
    statusLabel: { ...typography.body, color: colors.text, flex: 1 },
    statusDate: { ...typography.caption, color: colors.textMuted },
    divider: { height: 1, backgroundColor: colors.border },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.xxxl },
    emptyTitle: { ...typography.h1, color: colors.text, textAlign: "center" },
    emptySub: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  });
