import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge } from "../../../src/ui/Badge";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { MapPinIcon, StarIcon } from "../../../src/ui/icons";

interface Service {
  name: string;
  type: string;
  category: string;
  distanceKm: number;
  rating: number;
  price: string;
  open: boolean;
  x: number; // map position 0..1
  y: number;
}

const CATEGORIES = [
  { key: "all", label: "Alle" },
  { key: "workshop", label: "Werkstatt" },
  { key: "tires", label: "Reifen" },
  { key: "wash", label: "Waschen" },
  { key: "fuel", label: "Tanken" },
];

const SERVICES: Service[] = [
  { name: "AutoTechnik Müller", type: "Freie Werkstatt", category: "workshop", distanceKm: 1.2, rating: 4.7, price: "€€", open: true, x: 0.3, y: 0.35 },
  { name: "BoschCar Service", type: "Markenwerkstatt", category: "workshop", distanceKm: 2.8, rating: 4.5, price: "€€€", open: true, x: 0.62, y: 0.5 },
  { name: "ReifenProfi", type: "Reifenservice", category: "tires", distanceKm: 3.1, rating: 4.6, price: "€€", open: false, x: 0.5, y: 0.7 },
  { name: "CleanCar Waschpark", type: "Autowäsche", category: "wash", distanceKm: 0.8, rating: 4.3, price: "€", open: true, x: 0.2, y: 0.62 },
  { name: "Shell Station", type: "Tankstelle", category: "fuel", distanceKm: 0.5, rating: 4.1, price: "€€", open: true, x: 0.75, y: 0.28 },
];

export default function ServicesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState("all");

  const list = SERVICES.filter((s) => filter === "all" || s.category === filter).sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("services.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Faux map */}
        <View style={styles.mapWrap}>
          <Svg width="100%" height={180} viewBox="0 0 320 180">
            <Rect x={0} y={0} width={320} height={180} fill={colors.surfaceAlt} />
            {[40, 80, 120, 160, 200, 240, 280].map((x) => (
              <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={180} stroke={colors.border} strokeWidth={1} />
            ))}
            {[30, 60, 90, 120, 150].map((y) => (
              <Line key={`h${y}`} x1={0} y1={y} x2={320} y2={y} stroke={colors.border} strokeWidth={1} />
            ))}
            <Line x1={0} y1={95} x2={320} y2={70} stroke={colors.borderStrong} strokeWidth={6} />
            <Line x1={120} y1={0} x2={150} y2={180} stroke={colors.borderStrong} strokeWidth={6} />
            {/* you */}
            <Circle cx={160} cy={90} r={7} fill={colors.primary} />
            <Circle cx={160} cy={90} r={13} fill="none" stroke={colors.primary} strokeWidth={2} opacity={0.5} />
          </Svg>
          {list.map((s) => (
            <View key={s.name} style={[styles.pin, { left: `${s.x * 100}%`, top: `${s.y * 100}%` }]}>
              <MapPinIcon size={26} color={colors.primary} />
            </View>
          ))}
        </View>

        <View style={styles.filters}>
          {CATEGORIES.map((c) => {
            const active = c.key === filter;
            return (
              <Pressable key={c.key} onPress={() => setFilter(c.key)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(`services.${c.key}`)}</Text>
              </Pressable>
            );
          })}
        </View>

        {list.map((s) => (
          <Card key={s.name}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.muted}>{s.type}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.rating}>
                    <StarIcon size={13} color={colors.warning} />
                    <Text style={styles.ratingText}>{s.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.muted}>· {s.price}</Text>
                  <Badge label={s.open ? t("common.open") : t("common.closed")} tone={s.open ? "success" : "danger"} />
                </View>
              </View>
              <View style={styles.distBox}>
                <Text style={styles.dist}>{s.distanceKm.toFixed(1)}</Text>
                <Text style={styles.muted}>km</Text>
              </View>
            </View>
          </Card>
        ))}
        <Text style={styles.note}>{t("services.note")}</Text>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    mapWrap: { borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
    pin: { position: "absolute", marginLeft: -13, marginTop: -26 },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    chipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    chipTextActive: { color: colors.primary },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    info: { flex: 1, gap: spacing.xs },
    name: { ...typography.h3, color: colors.text },
    muted: { ...typography.caption, color: colors.textMuted },
    metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs, flexWrap: "wrap" },
    rating: { flexDirection: "row", alignItems: "center", gap: 3 },
    ratingText: { ...typography.caption, color: colors.text, fontWeight: "700" },
    distBox: { alignItems: "flex-end" },
    dist: { ...typography.h2, color: colors.text },
    note: { ...typography.caption, color: colors.textFaint, textAlign: "center" },
  });
