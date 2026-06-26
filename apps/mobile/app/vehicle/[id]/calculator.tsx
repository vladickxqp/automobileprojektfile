import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";

interface Repair {
  key: string;
  label: string;
  partsMin: number;
  partsMax: number;
  laborHours: number;
}

// Rough reference ranges for common jobs — a starting estimate, not a binding quote.
const REPAIRS: Repair[] = [
  { key: "oil", label: "Ölservice", partsMin: 60, partsMax: 140, laborHours: 0.8 },
  { key: "brakes_front", label: "Bremsen vorne", partsMin: 180, partsMax: 420, laborHours: 1.5 },
  { key: "clutch", label: "Kupplung", partsMin: 350, partsMax: 700, laborHours: 6 },
  { key: "timing_belt", label: "Zahnriemen", partsMin: 180, partsMax: 400, laborHours: 4 },
  { key: "battery", label: "Batterie", partsMin: 120, partsMax: 300, laborHours: 0.5 },
  { key: "suspension", label: "Stoßdämpfer (Achse)", partsMin: 200, partsMax: 500, laborHours: 2.5 },
  { key: "turbo", label: "Turbolader", partsMin: 600, partsMax: 1400, laborHours: 6 },
  { key: "exhaust", label: "Auspuff/Kat", partsMin: 250, partsMax: 900, laborHours: 2 },
];

const RATES = [
  { key: "indie", label: "Freie Werkstatt", rate: 90 },
  { key: "dealer", label: "Vertragswerkstatt", rate: 140 },
];

const fmt = (n: number) => `${Math.round(n).toLocaleString("de-DE")} €`;

export default function CalculatorScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [repair, setRepair] = useState<Repair>(REPAIRS[1]);
  const [rateKey, setRateKey] = useState("indie");

  const rate = RATES.find((r) => r.key === rateKey)!.rate;
  const partsAvg = (repair.partsMin + repair.partsMax) / 2;
  const labor = repair.laborHours * rate;
  const proTotal = partsAvg + labor;

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("calculator.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>{t("calculator.chooseRepair")}</Text>
        <View style={styles.chips}>
          {REPAIRS.map((r) => {
            const active = r.key === repair.key;
            return (
              <Pressable key={r.key} onPress={() => setRepair(r)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(`calculator.repairs.${r.key}`)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>{t("calculator.workshop")}</Text>
        <View style={styles.segment}>
          {RATES.map((r) => {
            const active = r.key === rateKey;
            return (
              <Pressable key={r.key} onPress={() => setRateKey(r.key)} style={[styles.segmentItem, active && styles.segmentActive]}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {t(`calculator.${r.key}`)} · {r.rate} €/h
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.cards}>
          <Card style={styles.estimate}>
            <Text style={styles.estLabel}>{t("calculator.diy")}</Text>
            <Text style={styles.estValue}>{fmt(partsAvg)}</Text>
            <Text style={styles.estSub}>{t("calculator.partsOnly")} · {fmt(repair.partsMin)}–{fmt(repair.partsMax)}</Text>
          </Card>
          <Card accent style={styles.estimate}>
            <Text style={styles.estLabel}>{t("calculator.workshopLabel")}</Text>
            <Text style={[styles.estValue, { color: colors.primary }]}>{fmt(proTotal)}</Text>
            <Text style={styles.estSub}>{t("calculator.partsAndLabor", { hours: repair.laborHours })}</Text>
          </Card>
        </View>

        <Card>
          <Row label={t("calculator.partsAvg")} value={fmt(partsAvg)} colors={colors} styles={styles} />
          <Row label={t("calculator.labor", { hours: repair.laborHours, rate })} value={fmt(labor)} colors={colors} styles={styles} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("calculator.totalWorkshop")}</Text>
            <Text style={styles.totalValue}>{fmt(proTotal)}</Text>
          </View>
          <Text style={styles.disclaimer}>{t("calculator.disclaimer")}</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, colors, styles }: { label: string; value: string; colors: ThemeColors; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
    sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.sm },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    chipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    chipTextActive: { color: colors.primary },
    segment: { flexDirection: "row", backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4 },
    segmentItem: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center" },
    segmentActive: { backgroundColor: colors.primary },
    segmentText: { ...typography.caption, fontWeight: "700", color: colors.textMuted },
    segmentTextActive: { color: colors.onPrimary },
    cards: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
    estimate: { flex: 1, gap: spacing.xs },
    estLabel: { ...typography.label, color: colors.textMuted },
    estValue: { fontSize: 26, fontWeight: "800", color: colors.text },
    estSub: { ...typography.caption, color: colors.textMuted },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
    rowLabel: { ...typography.body, color: colors.textMuted, flex: 1 },
    rowValue: { ...typography.body, color: colors.text, fontWeight: "600" },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: spacing.sm,
      marginTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalLabel: { ...typography.h3, color: colors.text },
    totalValue: { ...typography.h3, color: colors.primary },
    disclaimer: { ...typography.caption, color: colors.textFaint, marginTop: spacing.sm },
  });
