import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { api, type AiMessageDTO } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Button } from "../../../src/ui/Button";
import { Screen } from "../../../src/ui/Screen";
import { TextField } from "../../../src/ui/TextField";

export default function AssistantScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.text, isUser && styles.userText]}>{item.content}</Text>
          {item.sources && item.sources.length > 0 ? (
            <Text style={[styles.sources, isUser && styles.userText]}>
              {t("assistant.sources")}: {item.sources.map((s) => s.title).join("; ")}
            </Text>
          ) : null}
        </View>
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: { gap: spacing.md, paddingBottom: spacing.md },
    row: { flexDirection: "row" },
    rowRight: { justifyContent: "flex-end" },
    rowLeft: { justifyContent: "flex-start" },
    bubble: {
      maxWidth: "88%",
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
    },
    userBubble: { backgroundColor: colors.primary, borderColor: colors.primary },
    assistantBubble: { backgroundColor: colors.surface, borderColor: colors.border },
    text: { ...typography.body, color: colors.text },
    userText: { color: colors.onPrimary },
    sources: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
    muted: { ...typography.caption, color: colors.textMuted },
    error: { ...typography.caption, color: colors.danger },
  });
