import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge } from "../../../src/ui/Badge";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { TextField } from "../../../src/ui/TextField";
import { SearchIcon } from "../../../src/ui/icons";

interface Part {
  name: string;
  brand: string;
  oem: boolean;
  condition: "neu" | "gebraucht";
  priceFrom: number;
  offers: number;
}

const CATALOG: Part[] = [
  { name: "Bremsscheiben vorne", brand: "Brembo", oem: false, condition: "neu", priceFrom: 89, offers: 14 },
  { name: "Bremsbeläge vorne", brand: "ATE", oem: false, condition: "neu", priceFrom: 42, offers: 21 },
  { name: "Ölfilter", brand: "Mahle", oem: false, condition: "neu", priceFrom: 9, offers: 33 },
  { name: "Luftfilter", brand: "K&N", oem: false, condition: "neu", priceFrom: 28, offers: 12 },
  { name: "Zündkerzen (Satz)", brand: "NGK", oem: false, condition: "neu", priceFrom: 24, offers: 18 },
  { name: "Stoßdämpfer hinten", brand: "Bilstein", oem: false, condition: "neu", priceFrom: 96, offers: 9 },
  { name: "Wasserpumpe", brand: "OEM", oem: true, condition: "neu", priceFrom: 74, offers: 7 },
  { name: "Turbolader", brand: "Garrett", oem: false, condition: "gebraucht", priceFrom: 480, offers: 4 },
  { name: "Scheinwerfer links", brand: "OEM", oem: true, condition: "gebraucht", priceFrom: 130, offers: 6 },
];

export default function PartsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [query]);

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("parts.title") }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.searchRow}>
          <SearchIcon size={18} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <TextField placeholder={t("parts.searchPlaceholder")} value={query} onChangeText={setQuery} autoCapitalize="none" />
          </View>
        </View>
        <Text style={styles.note}>{t("parts.note")}</Text>

        {results.map((p) => (
          <Card key={p.name + p.brand}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.muted}>{p.brand}</Text>
                <View style={styles.badges}>
                  <Badge label={p.oem ? t("parts.oem") : t("parts.alternative")} tone={p.oem ? "accent" : "neutral"} />
                  <Badge label={p.condition === "neu" ? t("common.new") : t("common.used")} tone={p.condition === "neu" ? "success" : "warning"} />
                </View>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>{t("parts.from")}</Text>
                <Text style={styles.price}>{p.priceFrom} €</Text>
                <Text style={styles.offers}>{t("parts.offers", { count: p.offers })}</Text>
              </View>
            </View>
          </Card>
        ))}
        {results.length === 0 ? <Text style={styles.muted}>{t("parts.noResults", { query })}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    note: { ...typography.caption, color: colors.textFaint },
    row: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
    info: { flex: 1, gap: spacing.xs },
    name: { ...typography.h3, color: colors.text },
    muted: { ...typography.caption, color: colors.textMuted },
    badges: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs, flexWrap: "wrap" },
    priceBox: { alignItems: "flex-end" },
    priceLabel: { ...typography.caption, color: colors.textMuted },
    price: { ...typography.h2, color: colors.primary },
    offers: { ...typography.caption, color: colors.textFaint },
  });
