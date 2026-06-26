import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, StyleSheet, Text } from "react-native";
import { api, type VehicleEventDTO } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge } from "../../../src/ui/Badge";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";

function describe(e: VehicleEventDTO): string {
  if (e.type === "expense") {
    const amount = Number(e.payload.amount);
    const currency = String(e.payload.currency ?? "EUR");
    const category = String(e.payload.category ?? "");
    return `${category}: ${amount} ${currency}`;
  }
  return String(e.payload.title ?? e.type);
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const events = useQuery({ queryKey: ["events", id], queryFn: () => api.listEvents(id), enabled: !!id });

  return (
    <Screen>
      <Stack.Screen options={{ title: t("history.title") }} />
      {events.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (events.data?.length ?? 0) === 0 ? (
        <Text style={styles.muted}>{t("history.empty")}</Text>
      ) : (
        <FlatList
          data={events.data}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.title}>{describe(item)}</Text>
              <Text style={styles.muted}>
                {new Date(item.occurredAt).toLocaleDateString("de-DE")}
                {item.mileageKm != null ? ` · ${item.mileageKm.toLocaleString("de-DE")} km` : ""}
              </Text>
              <Badge label={item.type} tone={item.type === "expense" ? "warning" : "accent"} />
            </Card>
          )}
        />
      )}
      <Button title={t("history.add")} onPress={() => router.push(`/vehicle/${id}/add-event`)} />
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: { gap: spacing.md, paddingBottom: spacing.md },
    title: { ...typography.h3, color: colors.text },
    muted: { ...typography.caption, color: colors.textMuted },
  });
