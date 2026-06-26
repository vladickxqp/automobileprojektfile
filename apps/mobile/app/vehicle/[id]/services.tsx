import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { fetchFuelPrices } from "../../../src/api/fuel";
import { fetchNearbyServices, getLocation, type PlaceCategory } from "../../../src/api/places";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge } from "../../../src/ui/Badge";
import { Card } from "../../../src/ui/Card";
import { Screen } from "../../../src/ui/Screen";
import { MapPinIcon, StarIcon } from "../../../src/ui/icons";

interface Display {
  id: string;
  name: string;
  category: PlaceCategory;
  distanceKm: number;
  lat?: number;
  lon?: number;
  x?: number;
  y?: number;
  rating?: number;
  price?: string;
  open?: boolean;
  fuel?: { diesel: number | null; e5: number | null; e10: number | null };
}

const CATEGORIES = [{ key: "all" }, { key: "workshop" }, { key: "tires" }, { key: "wash" }, { key: "fuel" }];

const DEMO: Display[] = [
  { id: "d1", name: "AutoTechnik Müller", category: "workshop", distanceKm: 1.2, rating: 4.7, price: "€€", open: true, x: 0.3, y: 0.35 },
  { id: "d2", name: "BoschCar Service", category: "workshop", distanceKm: 2.8, rating: 4.5, price: "€€€", open: true, x: 0.62, y: 0.5 },
  { id: "d3", name: "ReifenProfi", category: "tires", distanceKm: 3.1, rating: 4.6, price: "€€", open: false, x: 0.5, y: 0.7 },
  { id: "d4", name: "CleanCar Waschpark", category: "wash", distanceKm: 0.8, rating: 4.3, price: "€", open: true, x: 0.2, y: 0.62 },
  { id: "d5", name: "Shell Station", category: "fuel", distanceKm: 0.5, rating: 4.1, price: "€€", open: true, x: 0.75, y: 0.28 },
];

const clamp = (v: number) => Math.max(0.08, Math.min(0.92, v));
const eur = (v: number) => v.toFixed(3).replace(".", ",");

export default function ServicesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState("all");

  const location = useQuery({ queryKey: ["geo"], queryFn: getLocation, staleTime: Infinity });
  const enabled = !!location.data;
  const places = useQuery({
    queryKey: ["places", location.data?.lat, location.data?.lon],
    queryFn: () => fetchNearbyServices(location.data!.lat, location.data!.lon),
    enabled,
    retry: 0,
    staleTime: 5 * 60_000,
  });
  const fuel = useQuery({
    queryKey: ["fuel", location.data?.lat, location.data?.lon],
    queryFn: () => fetchFuelPrices(location.data!.lat, location.data!.lon),
    enabled,
    retry: 0,
    staleTime: 5 * 60_000,
  });

  const osm = useMemo<Display[]>(() => {
    const data = places.data;
    if (!data || data.length === 0) return DEMO;
    return data.map((p) => ({ id: p.id, name: p.name, category: p.category, distanceKm: p.distanceKm, lat: p.lat, lon: p.lon }));
  }, [places.data]);

  const pricedFuel = useMemo<Display[] | null>(() => {
    const data = fuel.data;
    if (!data || data.length === 0) return null;
    return data.map((s) => ({
      id: s.id,
      name: s.name,
      category: "fuel" as const,
      distanceKm: s.distanceKm,
      lat: s.lat,
      lon: s.lon,
      open: s.isOpen,
      fuel: { diesel: s.diesel, e5: s.e5, e10: s.e10 },
    }));
  }, [fuel.data]);

  const base = pricedFuel ? [...osm.filter((s) => s.category !== "fuel"), ...pricedFuel] : osm;
  const list = base.filter((s) => filter === "all" || s.category === filter).sort((a, b) => a.distanceKm - b.distanceKm);
  const loading = location.isLoading || places.isLoading || fuel.isLoading;

  // Pin positions: from real lat/lon when available, else the demo preset.
  const geoItems = list.filter((s) => s.lat != null);
  const lats = geoItems.map((s) => s.lat!);
  const lons = geoItems.map((s) => s.lon!);
  const minLat = Math.min(...lats), spanLat = Math.max(...lats) - minLat || 1;
  const minLon = Math.min(...lons), spanLon = Math.max(...lons) - minLon || 1;
  const pos = (s: Display) =>
    s.lat != null
      ? { x: clamp((s.lon! - minLon) / spanLon), y: clamp(1 - (s.lat! - minLat) / spanLat) }
      : { x: s.x ?? 0.5, y: s.y ?? 0.5 };

  const note = pricedFuel ? t("services.priceNote") : osm !== DEMO ? t("services.liveNote") : t("services.note");

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("services.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapWrap}>
          <Svg width="100%" height={180} viewBox="0 0 320 180">
            <Rect x={0} y={0} width={320} height={180} fill={colors.surfaceAlt} />
            {[40, 80, 120, 160, 200, 240, 280].map((x) => (
              <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={180} stroke={colors.border} strokeWidth={1} />
            ))}
            {[30, 60, 90, 120, 150].map((y) => (
              <Line key={`h${y}`} x1={0} y1={y} x2={320} y2={y} stroke={colors.border} strokeWidth={1} />
            ))}
            <Line x1={0} y1={95} x2={320} y2={70} stroke={colors.borderStrong} strokeWidth={6} />
            <Line x1={120} y1={0} x2={150} y2={180} stroke={colors.borderStrong} strokeWidth={6} />
            <Circle cx={160} cy={90} r={7} fill={colors.primary} />
            <Circle cx={160} cy={90} r={13} fill="none" stroke={colors.primary} strokeWidth={2} opacity={0.5} />
          </Svg>
          {list.map((s) => {
            const p = pos(s);
            return (
              <View key={s.id} style={[styles.pin, { left: `${p.x * 100}%`, top: `${p.y * 100}%` }]}>
                <MapPinIcon size={26} color={colors.primary} />
              </View>
            );
          })}
        </View>

        <View style={styles.filters}>
          {CATEGORIES.map((c) => {
            const active = c.key === filter;
            return (
              <Pressable key={c.key} onPress={() => setFilter(c.key)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(`services.${c.key}`)}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.muted}>{t("services.searching")}</Text>
          </View>
        ) : null}

        {list.map((s) => (
          <Card key={s.id}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.muted}>{t(`services.${s.category}`)}</Text>
                {s.fuel ? (
                  <View style={styles.fuelRow}>
                    {s.fuel.diesel ? <Text style={styles.fuelPrice}>Diesel {eur(s.fuel.diesel)} €</Text> : null}
                    {s.fuel.e10 ? <Text style={styles.fuelPrice}>E10 {eur(s.fuel.e10)} €</Text> : null}
                    {s.fuel.e5 ? <Text style={styles.fuelPrice}>E5 {eur(s.fuel.e5)} €</Text> : null}
                  </View>
                ) : null}
                <View style={styles.metaRow}>
                  {s.rating != null ? (
                    <View style={styles.rating}>
                      <StarIcon size={13} color={colors.warning} />
                      <Text style={styles.ratingText}>{s.rating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                  {s.price ? <Text style={styles.muted}>· {s.price}</Text> : null}
                  {s.open != null ? (
                    <Badge label={s.open ? t("common.open") : t("common.closed")} tone={s.open ? "success" : "danger"} />
                  ) : null}
                </View>
              </View>
              <View style={styles.distBox}>
                <Text style={styles.dist}>{s.distanceKm.toFixed(1)}</Text>
                <Text style={styles.muted}>km</Text>
              </View>
            </View>
          </Card>
        ))}

        <Text style={styles.note}>{note}</Text>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    mapWrap: { borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
    pin: { position: "absolute", marginLeft: -13, marginTop: -26 },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    chipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
    chipTextActive: { color: colors.primary },
    loading: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    info: { flex: 1, gap: spacing.xs },
    name: { ...typography.h3, color: colors.text },
    muted: { ...typography.caption, color: colors.textMuted },
    fuelRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 2 },
    fuelPrice: { ...typography.caption, color: colors.primary, fontWeight: "700" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs, flexWrap: "wrap" },
    rating: { flexDirection: "row", alignItems: "center", gap: 3 },
    ratingText: { ...typography.caption, color: colors.text, fontWeight: "700" },
    distBox: { alignItems: "flex-end" },
    dist: { ...typography.h2, color: colors.text },
    note: { ...typography.caption, color: colors.textFaint, textAlign: "center" },
  });
