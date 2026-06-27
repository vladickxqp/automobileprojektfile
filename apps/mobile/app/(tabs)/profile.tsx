import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../src/theme/tokens";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { LogoMark } from "../../src/ui/Logo";
import { Screen } from "../../src/ui/Screen";
import { ChevronRightIcon, GaugeIcon, LayersIcon, SettingsIcon } from "../../src/ui/icons";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: api.listVehicles });
  const count = vehicles.data?.length ?? 0;

  return (
    <Screen flush>
      <ScrollView contentContainerStyle={styles.content}>
        <Card elevated style={styles.head}>
          <View style={styles.avatar}>
            <LogoMark size={56} />
          </View>
          <Text style={styles.name}>{user?.email ?? t("profile.guest")}</Text>
        </Card>

        <Card style={styles.stat}>
          <GaugeIcon size={20} color={colors.primary} />
          <Text style={styles.statValue}>{count}</Text>
          <Text style={styles.statLabel}>{t("profile.vehicles")}</Text>
        </Card>

        <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
          <Row icon={<LayersIcon size={20} color={colors.textMuted} />} label={t("profile.fleet")} onPress={() => router.push("/fleet")} colors={colors} styles={styles} />
          <View style={styles.divider} />
          <Row icon={<SettingsIcon size={20} color={colors.textMuted} />} label={t("profile.settings")} onPress={() => router.push("/settings")} colors={colors} styles={styles} />
        </Card>

        <Button variant="secondary" title={t("profile.signOut")} onPress={() => { void signOut(); router.replace("/"); }} />
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
    stat: { alignItems: "flex-start", gap: spacing.xs },
    statValue: { ...typography.h1, color: colors.text },
    statLabel: { ...typography.label, color: colors.textMuted },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    rowLabel: { ...typography.body, color: colors.text },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.sm },
  });
