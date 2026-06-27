import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge } from "../../../src/ui/Badge";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { ChevronRightIcon, FileIcon } from "../../../src/ui/icons";
import { Screen } from "../../../src/ui/Screen";

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  const openDoc = (url: string | null | undefined) => {
    if (url && url !== "#") {
      void Linking.openURL(url).catch(() => Alert.alert(t("documents.title"), t("documents.noFile")));
    } else {
      Alert.alert(t("documents.title"), t("documents.noFile"));
    }
  };

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
            <Pressable onPress={() => openDoc(item.fileUrl)}>
              {({ pressed }) => (
                <Card style={pressed ? { borderColor: colors.borderStrong } : undefined}>
                  <View style={styles.row}>
                    <View style={styles.iconWrap}>
                      <FileIcon size={20} color={colors.primary} />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.title}>{item.title ?? item.type}</Text>
                      <Text style={styles.muted}>
                        {item.expiresAt
                          ? `${t("documents.expires")} ${new Date(item.expiresAt).toLocaleDateString("de-DE")}`
                          : item.type}
                      </Text>
                    </View>
                    <Badge label={item.type} />
                    <ChevronRightIcon size={18} color={colors.textFaint} />
                  </View>
                </Card>
              )}
            </Pressable>
          )}
        />
      )}
      <Button title={t("documents.upload")} onPress={() => upload.mutate()} loading={upload.isPending} />
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: { gap: spacing.md, paddingBottom: spacing.md },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    info: { flex: 1, gap: 2 },
    title: { ...typography.h3, color: colors.text },
    muted: { ...typography.caption, color: colors.textMuted },
  });
