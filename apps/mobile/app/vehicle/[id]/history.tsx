import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { api, type VehicleEventDTO } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { ActivityIcon, BellIcon, FileIcon, FuelIcon, GaugeIcon, WrenchIcon } from "../../../src/ui/icons";

function describe(e: VehicleEventDTO): string {
  if (e.type === "expense") {
    const amount = Number(e.payload.amount);
    const currency = String(e.payload.currency ?? "EUR");
    const category = String(e.payload.category ?? "");
    return `${category}: ${amount} ${currency}`;
  }
  return String(e.payload.title ?? e.type);
}

function eventVisual(type: VehicleEventDTO["type"], colors: ThemeColors): { icon: (c: string) => ReactNode; color: string } {
  switch (type) {
    case "expense":
      return { icon: (c) => <FuelIcon size={16} color={c} />, color: colors.warning };
    case "scan":
      return { icon: (c) => <ActivityIcon size={16} color={c} />, color: colors.danger };
    case "document":
      return { icon: (c) => <FileIcon size={16} color={c} />, color: colors.textMuted };
    case "score":
      return { icon: (c) => <GaugeIcon size={16} color={c} />, color: colors.success };
    case "incident":
      return { icon: (c) => <BellIcon size={16} color={c} />, color: colors.danger };
    default:
      return { icon: (c) => <WrenchIcon size={16} color={c} />, color: colors.primary };
  }
}

const TYPE_LABEL: Record<string, string> = {
  maintenance: "Wartung",
  repair: "Reparatur",
  expense: "Ausgabe",
  scan: "Diagnose",
  document: "Dokument",
  score: "Score",
  incident: "Vorfall",
};

export default function HistoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const events = useQuery({ queryKey: ["events", id], queryFn: () => api.listEvents(id), enabled: !!id });

  const sorted = useMemo(
    () => [...(events.data ?? [])].sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt)),
    [events.data],
  );

  return (
    <Screen flush>
      <Stack.Screen options={{ title: "Verlauf" }} />
      <View style={styles.body}>
        {events.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : sorted.length === 0 ? (
          <Text style={styles.muted}>Noch keine Einträge in der Lebensakte.</Text>
        ) : (
          <View style={styles.timeline}>
            {sorted.map((e, i) => {
              const year = new Date(e.occurredAt).getFullYear();
              const prevYear = i > 0 ? new Date(sorted[i - 1].occurredAt).getFullYear() : null;
              const showYear = year !== prevYear;
              const vis = eventVisual(e.type, colors);
              return (
                <View key={e.id}>
                  {showYear ? <Text style={styles.year}>{year}</Text> : null}
                  <View style={styles.row}>
                    <View style={styles.rail}>
                      <View style={[styles.dot, { borderColor: vis.color }]}>{vis.icon(vis.color)}</View>
                      {i < sorted.length - 1 ? <View style={styles.line} /> : null}
                    </View>
                    <Card style={styles.entry}>
                      <Text style={styles.entryTitle}>{describe(e)}</Text>
                      <Text style={styles.muted}>
                        {new Date(e.occurredAt).toLocaleDateString("de-DE")} · {TYPE_LABEL[e.type] ?? e.type}
                        {e.mileageKm != null ? ` · ${e.mileageKm.toLocaleString("de-DE")} km` : ""}
                      </Text>
                    </Card>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <Button title="Eintrag hinzufügen" onPress={() => router.push(`/vehicle/${id}/add-event`)} />
      </View>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    body: { flex: 1, padding: spacing.lg, gap: spacing.md },
    timeline: { flex: 1 },
    year: { ...typography.label, color: colors.textFaint, marginTop: spacing.md, marginBottom: spacing.xs, marginLeft: 40 },
    row: { flexDirection: "row", gap: spacing.md },
    rail: { alignItems: "center", width: 28 },
    dot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
    entry: { flex: 1, marginBottom: spacing.md, gap: spacing.xs },
    entryTitle: { ...typography.h3, color: colors.text },
    muted: { ...typography.caption, color: colors.textMuted },
  });
