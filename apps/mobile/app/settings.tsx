import { Stack } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useTheme } from "../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Card } from "../src/ui/Card";
import { Screen } from "../src/ui/Screen";
import { ChevronRightIcon, GlobeIcon, MoonIcon, ShieldIcon, SunIcon } from "../src/ui/icons";

const LANGS: { code: string; label: string }[] = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [notif, setNotif] = useState({ maintenance: true, tuv: true, insurance: true, offers: false });
  const current = i18n.language?.slice(0, 2) ?? "de";

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("settings.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title={t("settings.language")} icon={<GlobeIcon size={18} color={colors.primary} />} colors={colors} styles={styles}>
          {LANGS.map((l) => {
            const active = current === l.code;
            return (
              <Pressable key={l.code} style={styles.row} onPress={() => void i18n.changeLanguage(l.code)}>
                <Text style={styles.rowLabel}>{l.label}</Text>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </Section>

        <Section
          title={t("settings.appearance")}
          icon={isDark ? <MoonIcon size={18} color={colors.primary} /> : <SunIcon size={18} color={colors.primary} />}
          colors={colors}
          styles={styles}
        >
          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentItem, isDark && styles.segmentActive]}
              onPress={() => setMode("dark")}
            >
              <Text style={[styles.segmentText, isDark && styles.segmentTextActive]}>{t("settings.dark")}</Text>
            </Pressable>
            <Pressable
              style={[styles.segmentItem, !isDark && styles.segmentActive]}
              onPress={() => setMode("light")}
            >
              <Text style={[styles.segmentText, !isDark && styles.segmentTextActive]}>{t("settings.light")}</Text>
            </Pressable>
          </View>
        </Section>

        <Section title={t("settings.notifications")} colors={colors} styles={styles}>
          <ToggleRow label={t("settings.maintenance")} value={notif.maintenance} onChange={(v) => setNotif({ ...notif, maintenance: v })} colors={colors} styles={styles} />
          <ToggleRow label={t("settings.tuv")} value={notif.tuv} onChange={(v) => setNotif({ ...notif, tuv: v })} colors={colors} styles={styles} />
          <ToggleRow label={t("settings.insurance")} value={notif.insurance} onChange={(v) => setNotif({ ...notif, insurance: v })} colors={colors} styles={styles} />
          <ToggleRow label={t("settings.offers")} value={notif.offers} onChange={(v) => setNotif({ ...notif, offers: v })} colors={colors} styles={styles} />
        </Section>

        <Section title={t("settings.privacy")} icon={<ShieldIcon size={18} color={colors.primary} />} colors={colors} styles={styles}>
          <LinkRow label={t("settings.privacyPolicy")} onPress={() => Alert.alert(t("settings.privacyPolicy"), t("settings.demoNotice"))} colors={colors} styles={styles} />
          <LinkRow label={t("settings.exportData")} onPress={() => Alert.alert(t("settings.exportData"), t("settings.demoNotice"))} colors={colors} styles={styles} />
          <LinkRow label={t("settings.deleteAccount")} onPress={() => Alert.alert(t("settings.deleteAccount"), t("settings.demoNotice"))} danger colors={colors} styles={styles} />
        </Section>

        <Text style={styles.version}>CarDNA · Demo · v0.0.1</Text>
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  icon,
  children,
  colors,
  styles,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.sectionHead}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Card style={{ gap: 0, paddingVertical: spacing.xs }}>{children}</Card>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  colors,
  styles,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.borderStrong }}
        thumbColor="#fff"
      />
    </View>
  );
}

function LinkRow({
  label,
  onPress,
  danger,
  colors,
  styles,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      <ChevronRightIcon size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
    sectionHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginLeft: spacing.xs },
    sectionTitle: { ...typography.label, color: colors.textMuted },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    rowLabel: { ...typography.body, color: colors.text },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.borderStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: { borderColor: colors.primary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      padding: 4,
      margin: spacing.sm,
    },
    segmentItem: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center" },
    segmentActive: { backgroundColor: colors.primary },
    segmentText: { ...typography.body, fontWeight: "700", color: colors.textMuted },
    segmentTextActive: { color: colors.onPrimary },
    version: { ...typography.caption, color: colors.textFaint, textAlign: "center", marginTop: spacing.md },
  });
