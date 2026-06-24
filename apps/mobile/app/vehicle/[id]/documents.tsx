import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, StyleSheet, Text } from "react-native";
import { api } from "../../../src/api/client";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { colors, spacing, typography } from "../../../src/theme/tokens";

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const documents = useQuery({
    queryKey: ["documents", id],
    queryFn: () => api.listDocuments(id),
    enabled: !!id,
  });

  const upload = useMutation({
    mutationFn: async () => {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled) return null;
      const asset = result.assets[0];
      if (!asset) return null;
      return api.uploadDocument(
        id,
        { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
        { type: "other", title: asset.name },
      );
    },
    onSuccess: (doc) => {
      if (doc) void queryClient.invalidateQueries({ queryKey: ["documents", id] });
    },
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: t("documents.title") }} />
      {documents.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (documents.data?.length ?? 0) === 0 ? (
        <Text style={styles.muted}>{t("documents.empty")}</Text>
      ) : (
        <FlatList
          data={documents.data}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.title}>{item.title ?? item.type}</Text>
              <Text style={styles.muted}>
                {item.type}
                {item.expiresAt
                  ? ` · ${t("documents.expires")} ${new Date(item.expiresAt).toLocaleDateString()}`
                  : ""}
              </Text>
            </Card>
          )}
        />
      )}
      <Button title={t("documents.upload")} onPress={() => upload.mutate()} loading={upload.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.md },
  title: { ...typography.body, color: colors.text, fontWeight: "600" },
  muted: { ...typography.caption, color: colors.textMuted },
});
