import { useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../src/theme/tokens";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { Screen } from "../../src/ui/Screen";
import { Skeleton } from "../../src/ui/Skeleton";
import { PlusIcon, SparkleIcon } from "../../src/ui/icons";

export default function MechanikerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { ready, user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: api.listVehicles, enabled: ready && !!user });
  const list = vehicles.data ?? [];

  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [symptom, setSymptom] = useState<string | null>(null);

  const symptoms = t("mechaniker.symptoms", { returnObjects: true }) as unknown as string[];
  const activeId = vehicleId ?? list[0]?.id ?? null;

  if (!ready) return <Screen><Skeleton height={120} radius={16} /></Screen>;
  if (!user) return <Redirect href="/sign-in" />;

  const start = () => {
    if (!activeId) return;
    router.push(`/vehicle/${activeId}/assistant${symptom ? `?symptom=${encodeURIComponent(symptom)}` : ""}`);
  };

  return (
    <Screen flush>
      <ScrollView contentContainerStyle={styles.content}>
        <Card accent style={styles.hero}>
          <View style={styles.heroIcon}>
            <SparkleIcon size={26} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t("mechaniker.title")}</Text>
          <Text style={styles.subtitle}>{t("mechaniker.subtitle")}</Text>
        </Card>

        {vehicles.isLoading ? (
          <Skeleton height={120} radius={16} />
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.muted}>{t("mechaniker.noVehicle")}</Text>
            <Button
              title={t("mechaniker.addVehicle")}
              icon={<PlusIcon size={20} color={colors.onPrimary} />}
              onPress={() => router.push("/add-vehicle")}
            />
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{t("mechaniker.symptomsLabel").toUpperCase()}</Text>
            <View style={styles.chips}>
              {symptoms.map((s) => {
                const sel = s === symptom;
                return (
                  <Pressable key={s} onPress={() => setSymptom(sel ? null : s)} style={[styles.chip, sel && styles.chipActive]}>
                    <Text style={[styles.chipText, sel && styles.chipTextActive]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>

            {list.length > 1 ? (
              <>
                <Text style={styles.sectionLabel}>{t("mechaniker.selectVehicle").toUpperCase()}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleRow}>
                  {list.map((v) => {
                    const sel = v.id === activeId;
                    return (
                      <Pressable key={v.id} onPress={() => setVehicleId(v.id)} style={[styles.chip, sel && styles.chipActive]}>
                        <Text style={[styles.chipText, sel && styles.chipTextActive]}>
                          {v.make} {v.model}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}

            <Button
              size="lg"
              title={t("mechaniker.start")}
              icon={<SparkleIcon size={20} color={colors.onPrimary} />}
              onPress={start}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    hero: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { ...typography.h1, color: colors.text, textAlign: "center" },
    subtitle: { ...typography.body, color: colors.textMuted, textAlign: "center" },
    sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.sm },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    vehicleRow: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.lg },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    chipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    chipTextActive: { color: colors.primary },
    empty: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl },
    muted: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  });
