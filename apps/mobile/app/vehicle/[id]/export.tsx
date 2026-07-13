import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api/client";
import { computeAutoScore } from "../../../src/api/autoscore";
import { buildEventsCsv, buildLifeRecordHtml } from "../../../src/api/export";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { ChevronRightIcon, FileIcon, ChartIcon } from "../../../src/ui/icons";

const slug = (s: string) => s.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "cardna";

function webDownload(name: string, content: string, mime: string) {
  const g = globalThis as unknown as {
    Blob?: new (parts: string[], opts: { type: string }) => unknown;
    document?: { createElement: (tag: string) => { href: string; download: string; click: () => void } };
    URL?: { createObjectURL: (b: unknown) => string; revokeObjectURL: (u: string) => void };
  };
  if (!g.document || !g.URL || !g.Blob) return;
  const url = g.URL.createObjectURL(new g.Blob([content], { type: mime }));
  const a = g.document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  g.URL.revokeObjectURL(url);
}

export default function ExportScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [busy, setBusy] = useState<string | null>(null);

  const vehicle = useQuery({ queryKey: ["vehicle", id], queryFn: () => api.getVehicle(id), enabled: !!id });
  const events = useQuery({ queryKey: ["events", id], queryFn: () => api.listEvents(id), enabled: !!id });
  const documents = useQuery({ queryKey: ["documents", id], queryFn: () => api.listDocuments(id), enabled: !!id });

  const ready = vehicle.data && !events.isLoading && !documents.isLoading;
  const base = vehicle.data ? slug(`${vehicle.data.make}-${vehicle.data.model}`) : "cardna";

  const fail = (e: unknown) => Alert.alert(t("export.title"), e instanceof Error ? e.message : String(e));

  const exportPdf = async () => {
    if (!vehicle.data) return;
    setBusy("pdf");
    try {
      const score = computeAutoScore(vehicle.data, events.data ?? [], documents.data ?? [], t);
      const html = buildLifeRecordHtml(vehicle.data, events.data ?? [], documents.data ?? [], score, t);
      if (Platform.OS === "web") {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = async () => {
    setBusy("csv");
    try {
      const csv = buildEventsCsv(events.data ?? [], t);
      const name = `${base}.csv`;
      if (Platform.OS === "web") {
        webDownload(name, csv, "text/csv;charset=utf-8");
      } else {
        const uri = FileSystem.cacheDirectory + name;
        await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "text/csv" });
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("export.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        {!ready ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Row
              icon={<FileIcon size={22} color={colors.primary} />}
              title={t("export.pdf")}
              hint={t("export.pdfHint")}
              loading={busy === "pdf"}
              onPress={exportPdf}
              colors={colors}
              styles={styles}
            />
            <Row
              icon={<ChartIcon size={22} color={colors.primary} />}
              title={t("export.csv")}
              hint={t("export.csvHint")}
              loading={busy === "csv"}
              onPress={exportCsv}
              colors={colors}
              styles={styles}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({
  icon,
  title,
  hint,
  loading,
  onPress,
  colors,
  styles,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  loading: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable onPress={onPress} disabled={loading}>
      {({ pressed }) => (
        <Card style={[styles.card, pressed && { borderColor: colors.primary }]}>
          <View style={styles.iconWrap}>{icon}</View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.hint}>{hint}</Text>
          </View>
          {loading ? <ActivityIndicator color={colors.primary} /> : <ChevronRightIcon size={20} color={colors.textFaint} />}
        </Card>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    card: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { ...typography.h3, color: colors.text },
    hint: { ...typography.caption, color: colors.textMuted },
  });
