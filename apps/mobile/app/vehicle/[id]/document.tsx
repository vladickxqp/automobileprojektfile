import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, type DocumentDTO } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge, type BadgeTone } from "../../../src/ui/Badge";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { ChevronRightIcon, FileIcon, ShieldIcon } from "../../../src/ui/icons";

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "—");

export default function DocumentDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const docType = type ?? "other";
  const typeLabel = t(`documents.types.${docType}`, { defaultValue: docType });

  const documents = useQuery({ queryKey: ["documents", id], queryFn: () => api.listDocuments(id), enabled: !!id });

  const ofType = useMemo(() => {
    const all = (documents.data ?? []).filter((d) => d.type === docType);
    return all.sort((a, b) => +new Date(b.issuedAt ?? b.createdAt) - +new Date(a.issuedAt ?? a.createdAt));
  }, [documents.data, docType]);
  const latest = ofType[0];

  const status = (date?: string | null): { label: string; tone: BadgeTone } => {
    if (!date) return { label: "—", tone: "neutral" };
    const d = Math.ceil((+new Date(date) - Date.now()) / 86_400_000);
    if (d < 0) return { label: t("home.expired"), tone: "danger" };
    if (d < 30) return { label: t("home.expiringSoon"), tone: "warning" };
    return { label: t("home.valid"), tone: "success" };
  };

  const openFile = (url?: string | null) => {
    if (url && url !== "#") {
      void Linking.openURL(url).catch(() => Alert.alert(typeLabel, t("documents.noFile")));
    } else {
      Alert.alert(typeLabel, t("documents.noFile"));
    }
  };

  const Icon = docType === "tuv" ? ShieldIcon : FileIcon;

  return (
    <Screen flush>
      <Stack.Screen options={{ title: typeLabel }} />
      <ScrollView contentContainerStyle={styles.content}>
        {documents.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            {/* Primary document */}
            <Card elevated style={styles.headCard}>
              <View style={styles.headRow}>
                <View style={styles.iconWrap}>
                  <Icon size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headTitle}>{typeLabel}</Text>
                  {latest?.title ? <Text style={styles.muted}>{latest.title}</Text> : null}
                </View>
                <Badge {...status(latest?.expiresAt)} />
              </View>

              {latest ? (
                <>
                  <View style={styles.divider} />
                  <Row label={t("documents.issued")} value={fmtDate(latest.issuedAt)} styles={styles} />
                  <View style={styles.divider} />
                  <Row label={t("documents.validUntil")} value={fmtDate(latest.expiresAt)} styles={styles} />
                </>
              ) : (
                <Text style={[styles.muted, { marginTop: spacing.sm }]}>{t("documents.none")}</Text>
              )}
            </Card>

            {latest ? (
              <Button title={t("documents.view")} onPress={() => openFile(latest.fileUrl)} />
            ) : null}
            <Button variant="secondary" title={t("documents.upload")} onPress={() => router.push(`/vehicle/${id}/documents`)} />

            {/* Earlier documents of the same type */}
            {ofType.length > 1 ? (
              <>
                <Text style={styles.sectionLabel}>{t("documents.history")}</Text>
                {ofType.slice(1).map((d: DocumentDTO) => (
                  <Pressable key={d.id} onPress={() => openFile(d.fileUrl)}>
                    {({ pressed }) => (
                      <Card style={pressed ? { borderColor: colors.borderStrong } : undefined}>
                        <View style={styles.histRow}>
                          <FileIcon size={18} color={colors.textMuted} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.histTitle} numberOfLines={1}>
                              {d.title ?? typeLabel}
                            </Text>
                            <Text style={styles.muted}>
                              {t("documents.validUntil")} {fmtDate(d.expiresAt)}
                            </Text>
                          </View>
                          <ChevronRightIcon size={16} color={colors.textFaint} />
                        </View>
                      </Card>
                    )}
                  </Pressable>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    headCard: { gap: spacing.xs },
    headRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    headTitle: { ...typography.h2, color: colors.text },
    muted: { ...typography.caption, color: colors.textMuted },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
    detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs },
    detailLabel: { ...typography.body, color: colors.textMuted },
    detailValue: { ...typography.body, color: colors.text, fontWeight: "700" },
    sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.sm },
    histRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    histTitle: { ...typography.h3, color: colors.text },
  });
