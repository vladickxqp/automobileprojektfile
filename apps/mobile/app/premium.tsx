import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Badge } from "../src/ui/Badge";
import { Button } from "../src/ui/Button";
import { Card } from "../src/ui/Card";
import { Screen } from "../src/ui/Screen";
import { CrownIcon } from "../src/ui/icons";

export default function PremiumScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [plan, setPlan] = useState<"yearly" | "monthly">("yearly");
  const features = t("premium.features", { returnObjects: true }) as unknown as string[];

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("premium.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card accent style={styles.hero}>
          <View style={styles.crown}>
            <CrownIcon size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t("premium.heroTitle")}</Text>
          <Text style={styles.subtitle}>{t("premium.heroSubtitle")}</Text>
        </Card>

        <Card style={styles.features}>
          {features.map((f) => (
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
            label={t("premium.yearly")}
            price={t("premium.yearlyPrice")}
            hint={t("premium.monthsFree")}
            active={plan === "yearly"}
            onPress={() => setPlan("yearly")}
            colors={colors}
            styles={styles}
          />
          <Plan
            label={t("premium.monthly")}
            price={t("premium.monthlyPrice")}
            active={plan === "monthly"}
            onPress={() => setPlan("monthly")}
            colors={colors}
            styles={styles}
          />
        </View>

        <Button
          size="lg"
          title={t("premium.start")}
          onPress={() => Alert.alert(t("premium.title"), t("premium.notActive"))}
        />
        <Text style={styles.legal}>{t("premium.legal")}</Text>
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
