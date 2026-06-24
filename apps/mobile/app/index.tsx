import { useQuery } from "@tanstack/react-query";
import { Redirect, Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../src/api/client";
import { useAuth } from "../src/auth/AuthContext";
import { Button } from "../src/ui/Button";
import { Card } from "../src/ui/Card";
import { Screen } from "../src/ui/Screen";
import { colors, spacing, typography } from "../src/theme/tokens";

export default function GarageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { ready, user } = useAuth();

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

  return (
    <Screen>
      <Stack.Screen options={{ title: t("garage.title") }} />
      {vehicles.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : vehicles.data && vehicles.data.length > 0 ? (
        <FlatList
          data={vehicles.data}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/vehicle/${item.id}`)}>
              <Card>
                <Text style={styles.carTitle}>
                  {item.make} {item.model}
                </Text>
                <Text style={styles.carSub}>
                  {item.year} · {item.vin}
                </Text>
                {item.mileageKm != null ? (
                  <Text style={styles.carSub}>{item.mileageKm.toLocaleString()} km</Text>
                ) : null}
              </Card>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("garage.empty.title")}</Text>
          <Text style={styles.emptySub}>{t("garage.empty.subtitle")}</Text>
        </View>
      )}
      <Button title={t("garage.addCar")} onPress={() => router.push("/add-vehicle")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.md },
  carTitle: { ...typography.h2, color: colors.text },
  carSub: { ...typography.caption, color: colors.textMuted },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  emptyTitle: { ...typography.h1, color: colors.text, textAlign: "center" },
  emptySub: { ...typography.body, color: colors.textMuted, textAlign: "center" },
});
