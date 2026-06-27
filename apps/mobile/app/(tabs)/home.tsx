import { useQueries, useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../../src/theme/tokens";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { CarPhoto } from "../../src/ui/CarPhoto";
import { Screen } from "../../src/ui/Screen";
import { ScoreRing } from "../../src/ui/ScoreRing";
import { Skeleton } from "../../src/ui/Skeleton";
import { PlusIcon } from "../../src/ui/icons";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { ready, user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: api.listVehicles, enabled: ready && !!user });
  const list = vehicles.data ?? [];

  // One score query per vehicle so each card shows its own AutoScore.
  const scores = useQueries({
    queries: list.map((v) => ({
      queryKey: ["score", v.id],
      queryFn: () => api.getScore(v.id),
      enabled: ready && !!user,
      staleTime: 60_000,
    })),
  });

  if (!ready) {
    return (
      <Screen>
        <Skeleton height={220} radius={20} />
      </Screen>
    );
  }
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <Screen flush>
      <ScrollView contentContainerStyle={styles.content}>
        {vehicles.isLoading ? (
          [0, 1].map((i) => <Skeleton key={i} height={230} radius={20} />)
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t("home.noVehicleTitle")}</Text>
            <Text style={styles.emptySub}>{t("home.noVehicleSub")}</Text>
          </View>
        ) : (
          list.map((v, i) => {
            const score = scores[i]?.data?.score ?? null;
            return (
              <Pressable key={v.id} onPress={() => router.push(`/vehicle/${v.id}`)}>
                {({ pressed }) => (
                  <Card elevated style={[styles.card, pressed && styles.cardPressed]}>
                    <CarPhoto uri={v.photoUrl} height={150} />
                    <View style={styles.row}>
                      <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>
                          {v.make} {v.model}
                        </Text>
                        <Text style={styles.sub}>
                          {v.year}
                          {v.mileageKm != null ? ` · ${v.mileageKm.toLocaleString("de-DE")} km` : ""}
                        </Text>
                      </View>
                      <ScoreRing score={score} size={60} strokeWidth={7} />
                    </View>
                  </Card>
                )}
              </Pressable>
            );
          })
        )}

        <Button
          size="lg"
          title={t("garage.addCar")}
          icon={<PlusIcon size={20} color={colors.onPrimary} />}
          onPress={() => router.push("/add-vehicle")}
        />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    card: { gap: spacing.md },
    cardPressed: { borderColor: colors.borderStrong },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    info: { flex: 1, gap: spacing.xs },
    name: { ...typography.h3, color: colors.text },
    sub: { ...typography.caption, color: colors.textMuted },
    empty: { alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.xxxl },
    emptyTitle: { ...typography.h1, color: colors.text, textAlign: "center" },
    emptySub: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  });
