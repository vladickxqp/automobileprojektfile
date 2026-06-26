import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api/client";
import { createElm327, type AdapterMode } from "../../../src/obd";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";

export default function DiagnosticsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [mode, setMode] = useState<AdapterMode>("demo");
  const [status, setStatus] = useState<string | null>(null);

  const scans = useQuery({ queryKey: ["scans", id], queryFn: () => api.listScans(id), enabled: !!id });

  const scan = useMutation({
    mutationFn: async () => {
      const elm = await createElm327(mode);
      try {
        setStatus(t("diagnostics.connecting"));
        await elm.connect();
        setStatus(t("diagnostics.reading"));
        const codes = await elm.readDtcs();
        await elm.disconnect();
        return api.createScan(id, {
          dtcCodes: codes,
          adapterInfo: mode === "demo" ? "Demo adapter (simulated)" : "ELM327 BLE",
        });
      } finally {
        setStatus(null);
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["scans", id] }),
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: t("diagnostics.title") }} />
      <View style={styles.tabs}>
        <View style={styles.tab}>
          <Button
            title={t("diagnostics.demo")}
            variant={mode === "demo" ? "primary" : "secondary"}
            onPress={() => setMode("demo")}
          />
        </View>
        <View style={styles.tab}>
          <Button
            title={t("diagnostics.bluetooth")}
            variant={mode === "bluetooth" ? "primary" : "secondary"}
            onPress={() => setMode("bluetooth")}
          />
        </View>
      </View>

      <Button title={t("diagnostics.scan")} onPress={() => scan.mutate()} loading={scan.isPending} />
      {status ? <Text style={styles.muted}>{status}</Text> : null}
      {scan.isError ? (
        <Text style={styles.error}>
          {scan.error instanceof Error ? scan.error.message : String(scan.error)}
        </Text>
      ) : null}

      {scans.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={scans.data}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.muted}>{t("diagnostics.empty")}</Text>}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.muted}>
                {new Date(item.scannedAt).toLocaleString("de-DE")}
                {item.adapterInfo ? ` · ${item.adapterInfo}` : ""}
              </Text>
              {item.decoded.length === 0 ? (
                <Text style={styles.ok}>{t("diagnostics.noCodes")}</Text>
              ) : (
                item.decoded.map((d) => (
                  <View key={d.code} style={styles.codeRow}>
                    <Text style={styles.code}>{d.code}</Text>
                    <Text style={styles.codeDesc}>{d.description ?? t("diagnostics.unknownCode")}</Text>
                  </View>
                ))
              )}
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tabs: { flexDirection: "row", gap: spacing.sm },
    tab: { flex: 1 },
    list: { gap: spacing.md, paddingVertical: spacing.md },
    muted: { ...typography.caption, color: colors.textMuted },
    error: { ...typography.caption, color: colors.danger },
    ok: { ...typography.body, color: colors.success, marginTop: spacing.xs },
    codeRow: { marginTop: spacing.sm },
    code: { ...typography.body, color: colors.warning, fontWeight: "700" },
    codeDesc: { ...typography.body, color: colors.text },
  });
