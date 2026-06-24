import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { api, type CreateEventInput } from "../../../src/api/client";
import { Button } from "../../../src/ui/Button";
import { Screen } from "../../../src/ui/Screen";
import { TextField } from "../../../src/ui/TextField";
import { spacing } from "../../../src/theme/tokens";

export default function AddEventScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [kind, setKind] = useState<"maintenance" | "expense">("maintenance");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("fuel");
  const [amount, setAmount] = useState("");
  const [mileage, setMileage] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const occurredAt = new Date().toISOString();
      const mileageKm = mileage ? Number(mileage) : undefined;
      const input: CreateEventInput =
        kind === "maintenance"
          ? { type: "maintenance", occurredAt, mileageKm, payload: { title: title.trim() } }
          : {
              type: "expense",
              occurredAt,
              mileageKm,
              payload: { category: category.trim(), amount: Number(amount) },
            };
      return api.createEvent(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events", id] });
      void queryClient.invalidateQueries({ queryKey: ["expenses", id] });
      router.back();
    },
    onError: (e) => Alert.alert(t("addEvent.failed"), e instanceof Error ? e.message : String(e)),
  });

  const canSubmit = kind === "maintenance" ? title.trim().length > 0 : Number(amount) > 0;

  return (
    <Screen>
      <Stack.Screen options={{ title: t("addEvent.title") }} />
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.tabs}>
          <View style={styles.tab}>
            <Button
              title={t("addEvent.maintenance")}
              variant={kind === "maintenance" ? "primary" : "secondary"}
              onPress={() => setKind("maintenance")}
            />
          </View>
          <View style={styles.tab}>
            <Button
              title={t("addEvent.expense")}
              variant={kind === "expense" ? "primary" : "secondary"}
              onPress={() => setKind("expense")}
            />
          </View>
        </View>

        {kind === "maintenance" ? (
          <TextField label={t("addEvent.workTitle")} value={title} onChangeText={setTitle} />
        ) : (
          <>
            <TextField
              label={t("addEvent.category")}
              autoCapitalize="none"
              value={category}
              onChangeText={setCategory}
            />
            <TextField
              label={t("addEvent.amount")}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </>
        )}

        <TextField
          label={t("addEvent.mileage")}
          keyboardType="number-pad"
          value={mileage}
          onChangeText={setMileage}
        />
        <Button
          title={t("addEvent.save")}
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!canSubmit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingBottom: spacing.xl },
  tabs: { flexDirection: "row", gap: spacing.sm },
  tab: { flex: 1 },
});
