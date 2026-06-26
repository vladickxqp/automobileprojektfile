import { useQuery } from "@tanstack/react-query";
import { Redirect, Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../src/api/client";
import { useAuth } from "../src/auth/AuthContext";
import { useTheme } from "../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Badge } from "../src/ui/Badge";
import { Button } from "../src/ui/Button";
import { Card } from "../src/ui/Card";
import { Car3D } from "../src/ui/Car3D";
import { IconButton } from "../src/ui/IconButton";
import { Screen } from "../src/ui/Screen";
import { ChevronRightIcon, PlusIcon, UserIcon } from "../src/ui/icons";

export default function GarageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { ready, user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const vehicles = useQuery({
    queryKey: ["vehicles"],
    queryFn: api.listVehicles,
    enabled: ready && !!user,
  });

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
      <Stack.Screen
        options={{
          title: t("garage.title"),
          headerLeft: () => (
            <IconButton variant="ghost" accessibilityLabel="Profil" onPress={() => router.push("/profile")}>
              <UserIcon size={20} color={colors.textMuted} />
            </IconButton>
          ),
        }}
      />
      <FlatList
        data={vehicles.data ?? []}
        keyExtractor={(v) => v.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Card elevated style={styles.hero}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>CarDNA</Text>
                  <Text style={styles.heroTitle}>{t("garage.title")}</Text>
                </View>
                <Badge label={`${count} ${count === 1 ? "Auto" : "Autos"}`} tone="accent" />
              </View>
              <Car3D height={220} />
            </Card>
            {count > 0 ? <Text style={styles.sectionLabel}>FAHRZEUGE</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/vehicle/${item.id}`)}>
            {({ pressed }) => (
              <Card style={[styles.carCard, pressed && styles.carCardPressed]}>
                <View style={styles.carCardRow}>
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
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
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
    headerWrap: { gap: spacing.md },
    hero: { gap: spacing.md, paddingBottom: spacing.sm },
    heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    heroLabel: { ...typography.label, color: colors.primary },
    heroTitle: { ...typography.h1, color: colors.text },
    sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.xs },
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
