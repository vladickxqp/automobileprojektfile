import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, type NotificationDTO } from "../src/api/client";
import { useTheme } from "../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Card } from "../src/ui/Card";
import { Screen } from "../src/ui/Screen";
import { BellIcon, ChevronRightIcon } from "../src/ui/icons";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const notifications = useQuery({ queryKey: ["notifications"], queryFn: api.listNotifications });

  const sevColor = (s: NotificationDTO["severity"]) =>
    s === "danger" ? colors.danger : s === "warning" ? colors.warning : colors.textMuted;

  const relative = (date: string | null): string => {
    if (!date) return "";
    const d = Math.ceil((+new Date(date) - Date.now()) / 86_400_000);
    if (d < 0) return t("common.overdue");
    if (d === 0) return t("common.today");
    return t("common.inDays", { count: d });
  };

  const list = notifications.data ?? [];

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("notifications.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        {notifications.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <BellIcon size={40} color={colors.textFaint} />
            <Text style={styles.emptyText}>{t("notifications.empty")}</Text>
          </View>
        ) : (
          list.map((n) => (
            <Pressable key={n.id} onPress={() => router.push(`/vehicle/${n.vehicleId}`)}>
              {({ pressed }) => (
                <Card style={[styles.row, pressed && { borderColor: colors.borderStrong }]}>
                  <View style={[styles.dot, { backgroundColor: sevColor(n.severity) }]} />
                  <View style={styles.info}>
                    <Text style={styles.title}>{n.title}</Text>
                    <Text style={styles.sub}>
                      {n.vehicleName}
                      {n.date ? ` · ${new Date(n.date).toLocaleDateString("de-DE")}` : ""}
                    </Text>
                  </View>
                  <Text style={[styles.rel, { color: sevColor(n.severity) }]}>{relative(n.date)}</Text>
                  <ChevronRightIcon size={18} color={colors.textFaint} />
                </Card>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    empty: { alignItems: "center", justifyContent: "center", gap: spacing.md, paddingVertical: spacing.xxxl },
    emptyText: { ...typography.body, color: colors.textMuted },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    dot: { width: 10, height: 10, borderRadius: 5 },
    info: { flex: 1, gap: 2 },
    title: { ...typography.h3, color: colors.text },
    sub: { ...typography.caption, color: colors.textMuted },
    rel: { ...typography.caption, fontWeight: "700" },
  });
