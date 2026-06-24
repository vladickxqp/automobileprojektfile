import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { api, type AiMessageDTO } from "../../../src/api/client";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { TextField } from "../../../src/ui/TextField";
import { colors, spacing, typography } from "../../../src/theme/tokens";

export default function AssistantScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState("");

  const history = useQuery({
    queryKey: ["assistant", id],
    queryFn: () => api.assistantHistory(id),
    enabled: !!id,
  });

  const ask = useMutation({
    mutationFn: (text: string) => api.askAssistant(id, text),
    onSuccess: () => {
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["assistant", id] });
    },
  });

  const renderItem = ({ item }: { item: AiMessageDTO }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
        <Card style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={styles.text}>{item.content}</Text>
          {item.sources && item.sources.length > 0 ? (
            <Text style={styles.sources}>
              {t("assistant.sources")}: {item.sources.map((s) => s.title).join("; ")}
            </Text>
          ) : null}
        </Card>
      </View>
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("assistant.title") }} />
      {history.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={history.data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.muted}>{t("assistant.empty")}</Text>}
          renderItem={renderItem}
        />
      )}
      {ask.isError ? (
        <Text style={styles.error}>
          {ask.error instanceof Error ? ask.error.message : String(ask.error)}
        </Text>
      ) : null}
      <TextField
        placeholder={t("assistant.placeholder")}
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <Button
        title={t("assistant.send")}
        onPress={() => ask.mutate(message.trim())}
        loading={ask.isPending}
        disabled={!message.trim()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.md },
  row: { flexDirection: "row" },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  bubble: { maxWidth: "88%" },
  userBubble: { backgroundColor: colors.primary, borderColor: colors.primary },
  assistantBubble: {},
  text: { ...typography.body, color: colors.text },
  sources: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  muted: { ...typography.caption, color: colors.textMuted },
  error: { ...typography.caption, color: colors.danger },
});
