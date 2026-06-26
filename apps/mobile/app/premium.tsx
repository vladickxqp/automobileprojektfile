import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Badge } from "../src/ui/Badge";
import { Button } from "../src/ui/Button";
import { Card } from "../src/ui/Card";
import { Screen } from "../src/ui/Screen";
import { CrownIcon } from "../src/ui/icons";

const FEATURES = [
  "Unbegrenzte Fahrzeuge im Profil",
  "KI-Mechaniker ohne Anfragelimit",
  "OBD-Diagnose-Verlauf & Trends",
  "Professionelle Verkaufs-Reports mit Link",
  "Cloud-Backup aller Dokumente",
  "Vorrangiger Support",
];

export default function PremiumScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [plan, setPlan] = useState<"yearly" | "monthly">("yearly");

  return (
    <Screen flush>
      <Stack.Screen options={{ title: "CarDNA Premium" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card accent style={styles.hero}>
          <View style={styles.crown}>
            <CrownIcon size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Hol mehr aus jedem Auto.</Text>
          <Text style={styles.subtitle}>Alle Premium-Funktionen in einem Tarif.</Text>
        </Card>

        <Card style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.check}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.plans}>
          <Plan
            label="Jährlich"
            price="49,99 € / Jahr"
            hint="2 Monate gratis"
            active={plan === "yearly"}
            onPress={() => setPlan("yearly")}
            colors={colors}
            styles={styles}
          />
          <Plan
            label="Monatlich"
            price="4,99 € / Monat"
            active={plan === "monthly"}
            onPress={() => setPlan("monthly")}
            colors={colors}
            styles={styles}
          />
        </View>

        <Button
          size="lg"
          title="Premium starten"
          onPress={() => Alert.alert("CarDNA Premium", "In dieser Demo ist der Kauf nicht aktiv. Anbindung an App Store / Google Play folgt.")}
        />
        <Text style={styles.legal}>Demo — kein echter Kauf. Jederzeit kündbar.</Text>
      </ScrollView>
    </Screen>
  );
}

function Plan({
  label,
  price,
  hint,
  active,
  onPress,
  colors,
  styles,
}: {
  label: string;
  price: string;
  hint?: string;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable style={[styles.plan, active && styles.planActive]} onPress={onPress}>
      <View style={styles.planHead}>
        <Text style={styles.planLabel}>{label}</Text>
        {hint ? <Badge label={hint} tone="accent" /> : null}
      </View>
      <Text style={styles.planPrice}>{price}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    hero: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
    crown: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { ...typography.h1, color: colors.text, textAlign: "center" },
    subtitle: { ...typography.body, color: colors.textMuted, textAlign: "center" },
    features: { gap: spacing.md },
    featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    checkMark: { color: colors.primary, fontWeight: "800", fontSize: 14 },
    featureText: { ...typography.body, color: colors.text, flex: 1 },
    plans: { flexDirection: "row", gap: spacing.md },
    plan: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.xs,
      backgroundColor: colors.surface,
    },
    planActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    planHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.xs },
    planLabel: { ...typography.h3, color: colors.text },
    planPrice: { ...typography.caption, color: colors.textMuted },
    legal: { ...typography.caption, color: colors.textFaint, textAlign: "center" },
  });
