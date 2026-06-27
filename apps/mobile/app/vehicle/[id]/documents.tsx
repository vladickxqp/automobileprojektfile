import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge } from "../../../src/ui/Badge";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { ChevronRightIcon, FileIcon } from "../../../src/ui/icons";
import { Screen } from "../../../src/ui/Screen";

const TYPE_KEYS = ["invoice", "techpassport", "insurance", "TÜV", "warranty", "contract", "other"];

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [type, setType] = useState("invoice");

  const typeLabel = (key: string) => t(`documents.types.${key}`, { defaultValue: key });

  const documents = useQuery({ queryKey: ["documents", id], queryFn: () => api.listDocuments(id), enabled: !!id });

  const upload = useMutation({
    mutationFn: async () => {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled) return null;
      const asset = result.assets[0];
      if (!asset) return null;
      return api.uploadDocument(
        id,
        { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
        { type, title: asset.name },
      );
    },
    onSuccess: (doc) => {
      if (doc) void queryClient.invalidateQueries({ queryKey: ["documents", id] });
    },
    onError: (e) => Alert.alert(t("documents.title"), e instanceof Error ? e.message : String(e)),
  });

  const openDoc = (url: string | null | undefined) => {
    if (url && url !== "#") {
      void Linking.openURL(url).catch(() => Alert.alert(t("documents.title"), t("documents.noFile")));
    } else {
      Alert.alert(t("documents.title"), t("documents.noFile"));
    }
  };

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("documents.title") }} />
      <View style={styles.body}>
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
                        <Text style={styles.title} numberOfLines={1}>
                          {item.title ?? typeLabel(item.type)}
                        </Text>
                        <Text style={styles.muted}>
                          {item.expiresAt
                            ? `${t("documents.expires")} ${new Date(item.expiresAt).toLocaleDateString("de-DE")}`
                            : typeLabel(item.type)}
                        </Text>
                      </View>
                      <Badge label={typeLabel(item.type)} />
                      <ChevronRightIcon size={18} color={colors.textFaint} />
                    </View>
                  </Card>
                )}
              </Pressable>
            )}
          />
        )}

        {/* Type selector + upload */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>{t("documents.typeLabel")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {TYPE_KEYS.map((k) => {
              const sel = k === type;
              return (
                <Pressable key={k} onPress={() => setType(k)} style={[styles.chip, sel && styles.chipActive]}>
                  <Text style={[styles.chipText, sel && styles.chipTextActive]}>{typeLabel(k)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Button title={t("documents.upload")} onPress={() => upload.mutate()} loading={upload.isPending} />
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    body: { flex: 1, padding: spacing.lg, gap: spacing.md },
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
    footer: { gap: spacing.sm },
    footerLabel: { ...typography.label, color: colors.textMuted },
    chips: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.lg },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    chipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    chipTextActive: { color: colors.primary },
  });
