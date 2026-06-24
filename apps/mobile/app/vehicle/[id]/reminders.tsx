import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { api, type ReminderDTO } from "../../../src/api/client";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { TextField } from "../../../src/ui/TextField";
import { colors, spacing, typography } from "../../../src/theme/tokens";

export default function RemindersScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState("");

  const reminders = useQuery({
    queryKey: ["reminders", id],
    queryFn: () => api.listReminders(id),
    enabled: !!id,
  });

  const add = useMutation({
    mutationFn: () => api.createReminder(id, { title: title.trim() }),
    onSuccess: () => {
      setTitle("");
      void queryClient.invalidateQueries({ queryKey: ["reminders", id] });
    },
  });

  const complete = useMutation({
    mutationFn: (reminderId: string) => api.completeReminder(id, reminderId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["reminders", id] }),
  });

  const renderItem = ({ item }: { item: ReminderDTO }) => (
    <Card>
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.row}>
        <Text style={styles.muted}>
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : t("reminders.noDate")} ·{" "}
          {item.source}
        </Text>
        {item.source === "user" ? (
          <Button variant="secondary" title={t("reminders.done")} onPress={() => complete.mutate(item.id)} />
        ) : null}
      </View>
    </Card>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: t("reminders.title") }} />
      {reminders.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={reminders.data}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.muted}>{t("reminders.empty")}</Text>}
          renderItem={renderItem}
        />
      )}
      <TextField label={t("reminders.newTitle")} value={title} onChangeText={setTitle} />
      <Button
        title={t("reminders.add")}
        onPress={() => add.mutate()}
        loading={add.isPending}
        disabled={!title.trim()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.md },
  title: { ...typography.body, color: colors.text, fontWeight: "600" },
  muted: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
});
