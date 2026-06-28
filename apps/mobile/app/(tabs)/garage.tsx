import { useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../../src/theme/tokens";
import { Badge } from "../../src/ui/Badge";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { CarPhoto } from "../../src/ui/CarPhoto";
import { Screen } from "../../src/ui/Screen";
import { Skeleton } from "../../src/ui/Skeleton";
import { ChevronRightIcon, PlusIcon } from "../../src/ui/icons";

export default function GarageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { ready, user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: api.listVehicles, enabled: ready && !!user });

  if (!ready) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }
  if (!user) return <Redirect href="/sign-in" />;

  const count = vehicles.data?.length ?? 0;

  return (
    <Screen flush>
      <FlatList
        data={vehicles.data ?? []}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          count > 0 ? (
            <View style={styles.headerRow}>
              <Badge label={`${count} ${t("garage.cars")}`} tone="accent" />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/vehicle/${item.id}`)}>
            {({ pressed }) => (
              <Card style={[styles.carCard, pressed && styles.carCardPressed]}>
                <View style={styles.carCardRow}>
                  <CarPhoto uri={item.photoUrl} width={88} height={64} radius={10} />
                  <View style={styles.carInfo}>
                    <Text style={styles.carTitle}>
                      {item.make} {item.model}
                    </Text>
                    <Text style={styles.carSub}>
                      {item.year}
                      {item.engine ? ` · ${item.engine}` : ""}
                    </Text>
                    <View style={styles.carMetaRow}>
                      {item.mileageKm != null ? (
                        <Badge label={`${item.mileageKm.toLocaleString("de-DE")} km`} />
                      ) : null}
                      {item.plate ? <Badge label={item.plate} /> : null}
                    </View>
                  </View>
                  <ChevronRightIcon size={22} color={colors.textFaint} />
                </View>
              </Card>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          vehicles.isLoading ? (
            <View style={{ gap: spacing.md }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={92} radius={16} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t("garage.empty.title")}</Text>
              <Text style={styles.emptySub}>{t("garage.empty.subtitle")}</Text>
            </View>
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              size="lg"
              title={t("garage.addCar")}
              icon={<PlusIcon size={20} color={colors.onPrimary} />}
              onPress={() => router.push("/add-vehicle")}
            />
          </View>
        }
      />
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    headerRow: { alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
    carCard: { paddingVertical: spacing.lg },
    carCardPressed: { borderColor: colors.borderStrong, backgroundColor: colors.surfaceHover },
    carCardRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    carInfo: { flex: 1, gap: spacing.xs },
    carTitle: { ...typography.h2, color: colors.text },
    carSub: { ...typography.caption, color: colors.textMuted },
    carMetaRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs, flexWrap: "wrap" },
    empty: { alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.xl },
    emptyTitle: { ...typography.h1, color: colors.text, textAlign: "center" },
    emptySub: { ...typography.body, color: colors.textMuted, textAlign: "center" },
    footer: { marginTop: spacing.lg },
  });
