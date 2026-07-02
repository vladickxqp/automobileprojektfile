import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { api, type ReminderDTO } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { TextField } from "../../../src/ui/TextField";

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const parseDate = (s: string): string | undefined => {
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return undefined;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

export default function RemindersScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; title?: string; kind?: string; due?: string }>();
  const id = params.id;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Prefilled from a tapped maintenance recommendation (1-tap reminder).
  const [title, setTitle] = useState(params.title ?? "");
  const [due, setDue] = useState(params.due ? fmtDate(new Date(params.due)) : "");
  const kind = params.kind;

  const reminders = useQuery({
    queryKey: ["reminders", id],
    queryFn: () => api.listReminders(id),
    enabled: !!id,
  });

  const add = useMutation({
    mutationFn: () =>
      api.createReminder(id, {
        title: title.trim(),
        ...(kind ? { kind } : {}),
        ...(parseDate(due) ? { dueDate: parseDate(due) } : {}),
      }),
    onSuccess: () => {
      setTitle("");
      setDue("");
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
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString("de-DE") : t("reminders.noDate")} ·{" "}
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
      <TextField label={t("reminders.due")} value={due} onChangeText={setDue} placeholder="TT.MM.JJJJ" />
      <Button
        title={t("reminders.add")}
        onPress={() => add.mutate()}
        loading={add.isPending}
        disabled={!title.trim()}
      />
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: { gap: spacing.md, paddingBottom: spacing.md },
    title: { ...typography.h3, color: colors.text },
    muted: { ...typography.caption, color: colors.textMuted },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  });
