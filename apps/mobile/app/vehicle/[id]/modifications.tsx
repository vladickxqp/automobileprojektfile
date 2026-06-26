import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, type ModificationDTO } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge } from "../../../src/ui/Badge";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { TextField } from "../../../src/ui/TextField";

const CATEGORY_KEYS = ["engine", "exhaust", "suspension", "wheels", "exterior", "interior", "other"];

export default function ModificationsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const catLabel = (key: string) => t(`modifications.categories.${key}`, { defaultValue: key });

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("engine");
  const [gainHp, setGainHp] = useState("");
  const [cost, setCost] = useState("");
  const [adding, setAdding] = useState(false);

  const mods = useQuery({ queryKey: ["modifications", id], queryFn: () => api.listModifications(id), enabled: !!id });

  const add = useMutation({
    mutationFn: () =>
      api.createModification(id, {
        title: title.trim(),
        category,
        installedAt: new Date().toISOString(),
        gainHp: gainHp ? Number(gainHp) : undefined,
        cost: cost ? Number(cost) : undefined,
      }),
    onSuccess: () => {
      setTitle("");
      setGainHp("");
      setCost("");
      setAdding(false);
      void queryClient.invalidateQueries({ queryKey: ["modifications", id] });
    },
  });

  const list = mods.data ?? [];
  const totalHp = list.reduce((s, m) => s + (m.gainHp ?? 0), 0);
  const totalCost = list.reduce((s, m) => s + (m.cost ?? 0), 0);

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("modifications.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statRow}>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>+{totalHp}</Text>
            <Text style={styles.statLabel}>{t("modifications.hpGained")}</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>{totalCost.toLocaleString("de-DE")} €</Text>
            <Text style={styles.statLabel}>{t("modifications.invested")}</Text>
          </Card>
        </View>

        {mods.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : list.length === 0 ? (
          <Text style={styles.muted}>{t("modifications.none")}</Text>
        ) : (
          list.map((m: ModificationDTO) => (
            <Card key={m.id}>
              <View style={styles.modHead}>
                <Text style={styles.modTitle}>{m.title}</Text>
                <Badge label={catLabel(m.category)} tone="accent" />
              </View>
              <Text style={styles.muted}>
                {new Date(m.installedAt).toLocaleDateString("de-DE")}
                {m.gainHp ? ` · +${m.gainHp} PS` : ""}
                {m.cost != null ? ` · ${m.cost.toLocaleString("de-DE")} €` : ""}
              </Text>
              {m.notes ? <Text style={styles.notes}>{m.notes}</Text> : null}
            </Card>
          ))
        )}

        {adding ? (
          <Card elevated style={styles.form}>
            <TextField label={t("modifications.name")} value={title} onChangeText={setTitle} placeholder={t("modifications.namePlaceholder")} />
            <Text style={styles.formLabel}>{t("modifications.category")}</Text>
            <View style={styles.chips}>
              {CATEGORY_KEYS.map((key) => {
                const active = key === category;
                return (
                  <Pressable key={key} onPress={() => setCategory(key)} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{catLabel(key)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <TextField label={t("modifications.hp")} keyboardType="number-pad" value={gainHp} onChangeText={setGainHp} />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label={t("modifications.cost")} keyboardType="number-pad" value={cost} onChangeText={setCost} />
              </View>
            </View>
            <Button title={t("common.save")} onPress={() => add.mutate()} loading={add.isPending} disabled={!title.trim()} />
            <Button variant="ghost" title={t("common.cancel")} onPress={() => setAdding(false)} />
          </Card>
        ) : (
          <Button title={t("modifications.addMod")} onPress={() => setAdding(true)} />
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    statRow: { flexDirection: "row", gap: spacing.md },
    stat: { flex: 1, alignItems: "flex-start", gap: spacing.xs },
    statValue: { ...typography.h1, color: colors.text },
    statLabel: { ...typography.label, color: colors.textMuted },
    muted: { ...typography.caption, color: colors.textMuted },
    modHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
    modTitle: { ...typography.h3, color: colors.text, flex: 1 },
    notes: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
    form: { gap: spacing.md },
    formLabel: { ...typography.label, color: colors.textMuted },
    formRow: { flexDirection: "row", gap: spacing.md },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    chipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    chipTextActive: { color: colors.primary },
  });
