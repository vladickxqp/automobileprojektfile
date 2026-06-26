import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useMemo, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../src/api/client";
import { useAuth } from "../src/auth/AuthContext";
import { useTheme } from "../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Badge } from "../src/ui/Badge";
import { Button } from "../src/ui/Button";
import { Card } from "../src/ui/Card";
import { LogoMark } from "../src/ui/Logo";
import { Screen } from "../src/ui/Screen";
import { ChevronRightIcon, CrownIcon, GaugeIcon, LayersIcon, SettingsIcon } from "../src/ui/icons";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: api.listVehicles });
  const count = vehicles.data?.length ?? 0;

  return (
    <Screen flush>
      <Stack.Screen options={{ title: "Profil" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card elevated style={styles.head}>
          <View style={styles.avatar}>
            <LogoMark size={56} />
          </View>
          <Text style={styles.name}>{user?.email ?? "Gast"}</Text>
          <Badge label="Free-Tarif" tone="neutral" />
        </Card>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <GaugeIcon size={20} color={colors.primary} />
            <Text style={styles.statValue}>{count}</Text>
            <Text style={styles.statLabel}>Fahrzeuge</Text>
          </View>
          <View style={styles.stat}>
            <CrownIcon size={20} color={colors.primary} />
            <Text style={styles.statValue}>Free</Text>
            <Text style={styles.statLabel}>Tarif</Text>
          </View>
        </View>

        {/* Premium upsell */}
        <Card accent style={styles.premium}>
          <View style={styles.premiumHead}>
            <CrownIcon size={20} color={colors.primary} />
            <Text style={styles.premiumTitle}>CarDNA Premium</Text>
          </View>
          <Text style={styles.premiumText}>
            Unbegrenzte Fahrzeuge, KI-Diagnose ohne Limit, Verkaufs-Reports und Cloud-Backup.
          </Text>
          <Button title="Premium entdecken" onPress={() => router.push("/premium")} />
        </Card>

        <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
          <Row icon={<LayersIcon size={20} color={colors.textMuted} />} label="Flotte / Mehrere Fahrzeuge" onPress={() => router.push("/fleet")} colors={colors} styles={styles} />
          <View style={styles.divider} />
          <Row icon={<SettingsIcon size={20} color={colors.textMuted} />} label="Einstellungen" onPress={() => router.push("/settings")} colors={colors} styles={styles} />
        </Card>

        <Button variant="secondary" title="Abmelden" onPress={() => { void signOut(); router.replace("/"); }} />
      </ScrollView>
    </Screen>
  );
}

function Row({
  icon,
  label,
  onPress,
  colors,
  styles,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <ChevronRightIcon size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    head: { alignItems: "center", gap: spacing.sm },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 24,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    name: { ...typography.h2, color: colors.text },
    statRow: { flexDirection: "row", gap: spacing.md },
    stat: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.xs,
      alignItems: "flex-start",
    },
    statValue: { ...typography.h1, color: colors.text },
    statLabel: { ...typography.label, color: colors.textMuted },
    premium: { gap: spacing.sm },
    premiumHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    premiumTitle: { ...typography.h3, color: colors.text },
    premiumText: { ...typography.caption, color: colors.textMuted },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    rowLabel: { ...typography.body, color: colors.text },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.sm },
  });
