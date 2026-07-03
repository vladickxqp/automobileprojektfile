import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api/client";
import { computeAutoScore } from "../../../src/api/autoscore";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge } from "../../../src/ui/Badge";
import { Card } from "../../../src/ui/Card";
import { ScoreRing, scoreColor } from "../../../src/ui/ScoreRing";
import { Screen } from "../../../src/ui/Screen";

export default function AutoScoreScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const vehicle = useQuery({ queryKey: ["vehicle", id], queryFn: () => api.getVehicle(id), enabled: !!id });
  const events = useQuery({ queryKey: ["events", id], queryFn: () => api.listEvents(id), enabled: !!id });
  const documents = useQuery({ queryKey: ["documents", id], queryFn: () => api.listDocuments(id), enabled: !!id });

  const result = useMemo(() => {
    if (!vehicle.data) return null;
    return computeAutoScore(vehicle.data, events.data ?? [], documents.data ?? [], t);
  }, [vehicle.data, events.data, documents.data, t]);

  const loading = vehicle.isLoading || events.isLoading || documents.isLoading || !result;

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("autoscore.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Card elevated style={styles.hero}>
              <ScoreRing score={result.score} size={120} />
              <Text style={styles.overall}>{t("autoscore.overall")}</Text>
              <Badge label={result.verdict} tone={result.tone === "success" ? "success" : result.tone === "warning" ? "warning" : "danger"} />
            </Card>

            {result.factors.map((f) => {
              const tone = scoreColor(f.score, colors);
              return (
                <Card key={f.key} style={styles.factorCard}>
                  <View style={styles.factorHead}>
                    <Text style={styles.factorLabel}>{f.label}</Text>
                    <Text style={[styles.factorScore, { color: tone }]}>{Math.round(f.score)}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.round(f.score)}%`, backgroundColor: tone }]} />
                  </View>
                  <Text style={styles.detail}>{f.detail}</Text>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    hero: { alignItems: "center", gap: spacing.sm },
    overall: { ...typography.label, color: colors.textMuted },
    factorCard: { gap: spacing.sm },
    factorHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    factorLabel: { ...typography.h3, color: colors.text },
    factorScore: { ...typography.h3, fontWeight: "800" },
    track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
    fill: { height: 8, borderRadius: radius.pill },
    detail: { ...typography.caption, color: colors.textMuted },
  });
