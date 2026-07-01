import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { VehicleEventDTO } from "../api/client";
import { isFuelCategory, maintenanceCost } from "../api/dashboard";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../theme/tokens";
import { Card } from "./Card";
import { ChevronRightIcon, FuelIcon, LayersIcon, WrenchIcon } from "./icons";

const RELEVANT = new Set(["maintenance", "repair", "expense"]);

const eur = (n: number) => `${n.toLocaleString("de-DE", { maximumFractionDigits: 0 })} €`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("de-DE");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Props {
  vehicleId: string;
  events: VehicleEventDTO[];
  limit?: number;
}

export function RecentEvents({ vehicleId, events, limit = 4 }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const recent = useMemo(
    () =>
      events
        .filter((e) => RELEVANT.has(e.type))
        .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))
        .slice(0, limit),
    [events, limit],
  );

  const isRepair = (e: VehicleEventDTO) => e.type === "maintenance" || e.type === "repair";
  const isFuel = (e: VehicleEventDTO) => e.type === "expense" && isFuelCategory(String(e.payload?.category ?? ""));

  const amountOf = (e: VehicleEventDTO) => {
    const p = (e.payload ?? {}) as Record<string, unknown>;
    return isRepair(e) ? maintenanceCost(p) : Number(p.amount) || 0;
  };
  const titleOf = (e: VehicleEventDTO) => {
    const p = (e.payload ?? {}) as Record<string, unknown>;
    if (isRepair(e))
      return (
        (typeof p.title === "string" && p.title) ||
        (typeof p.category === "string" ? t(`addEvent.categories.${p.category}`, { defaultValue: cap(p.category) }) : t("dash.repair"))
      );
    if (isFuel(e)) return t("dash.fuel");
    return typeof p.category === "string" ? cap(p.category) : t("dash.other");
  };
  const iconOf = (e: VehicleEventDTO) => {
    if (isRepair(e)) return <WrenchIcon size={18} color={colors.primary} />;
    if (isFuel(e)) return <FuelIcon size={18} color={colors.primary} />;
    return <LayersIcon size={18} color={colors.primary} />;
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>{t("home.recent")}</Text>
        {recent.length > 0 ? (
          <Pressable style={styles.link} onPress={() => router.push(`/vehicle/${vehicleId}/history`)}>
            <Text style={styles.linkText}>{t("home.showAll")}</Text>
            <ChevronRightIcon size={14} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      {recent.length === 0 ? (
        <Text style={styles.muted}>{t("home.noActivity")}</Text>
      ) : (
        recent.map((e, i) => (
          <View key={e.id}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <Pressable
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.65 }]}
              onPress={() => router.push(`/vehicle/${vehicleId}/add-event?eventId=${e.id}`)}
            >
              <View style={styles.iconWrap}>{iconOf(e)}</View>
              <View style={styles.info}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {titleOf(e)}
                </Text>
                <Text style={styles.muted}>{fmtDate(e.occurredAt)}</Text>
              </View>
              {amountOf(e) > 0 ? <Text style={styles.amount}>{eur(amountOf(e))}</Text> : null}
              <ChevronRightIcon size={16} color={colors.textFaint} />
            </Pressable>
          </View>
        ))
      )}
    </Card>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
    title: { ...typography.label, color: colors.textMuted },
    link: { flexDirection: "row", alignItems: "center", gap: 2 },
    linkText: { ...typography.caption, color: colors.primary, fontWeight: "700" },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    info: { flex: 1, gap: 2 },
    rowTitle: { ...typography.body, color: colors.text, fontWeight: "600" },
    muted: { ...typography.caption, color: colors.textMuted },
    amount: { ...typography.body, color: colors.text, fontWeight: "700" },
    divider: { height: 1, backgroundColor: colors.border },
  });
