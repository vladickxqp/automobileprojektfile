import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { fetchFuelPrices } from "../../api/fuel";
import { fetchNearbyServices, type PlaceCategory } from "../../api/places";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../theme/tokens";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Screen } from "../../ui/Screen";
import { MapPinIcon, StarIcon } from "../../ui/icons";

interface Display {
  id: string;
  name: string;
  category: PlaceCategory;
  distanceKm: number;
  lat?: number;
  lon?: number;
  rating?: number;
  price?: string;
  open?: boolean;
  fuel?: { diesel: number | null; e5: number | null; e10: number | null };
}

const CATEGORIES = [{ key: "all" }, { key: "workshop" }, { key: "tires" }, { key: "wash" }, { key: "fuel" }];

const clamp = (v: number) => Math.max(0.08, Math.min(0.92, v));
const eur = (v: number) => v.toFixed(3).replace(".", ",");

type LocStatus = "idle" | "loading" | "denied";

// Location-based map + nearby services. The user enables location first, then searches by category.
export default function PlacesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState("all");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locStatus, setLocStatus] = useState<LocStatus>("idle");

  const requestLocation = () => {
    setLocStatus("loading");
    const geo = (globalThis as { navigator?: { geolocation?: Geolocation } }).navigator?.geolocation;
    if (!geo) {
      setLocStatus("denied");
      return;
    }
    geo.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lon: p.coords.longitude });
        setLocStatus("idle");
      },
      () => setLocStatus("denied"),
      { timeout: 8000, maximumAge: 600_000 },
    );
  };

  const enabled = !!coords;
  const places = useQuery({
    queryKey: ["places", coords?.lat, coords?.lon],
    queryFn: () => fetchNearbyServices(coords!.lat, coords!.lon),
    enabled,
    retry: 0,
    staleTime: 5 * 60_000,
  });
  const fuel = useQuery({
    queryKey: ["fuel", coords?.lat, coords?.lon],
    queryFn: () => fetchFuelPrices(coords!.lat, coords!.lon),
    enabled,
    retry: 0,
    staleTime: 5 * 60_000,
  });

  const osm = useMemo<Display[]>(() => {
    const data = places.data;
    if (!data) return [];
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
  const loading = places.isLoading || fuel.isLoading;

  const lats = list.filter((s) => s.lat != null).map((s) => s.lat!);
  const lons = list.filter((s) => s.lon != null).map((s) => s.lon!);
  const minLat = Math.min(...lats), spanLat = Math.max(...lats) - minLat || 1;
  const minLon = Math.min(...lons), spanLon = Math.max(...lons) - minLon || 1;
  const pos = (s: Display) =>
    s.lat != null ? { x: clamp((s.lon! - minLon) / spanLon), y: clamp(1 - (s.lat! - minLat) / spanLat) } : { x: 0.5, y: 0.5 };

  const mapSvg = (
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
      {coords ? (
        <>
          <Circle cx={160} cy={90} r={7} fill={colors.primary} />
          <Circle cx={160} cy={90} r={13} fill="none" stroke={colors.primary} strokeWidth={2} opacity={0.5} />
        </>
      ) : null}
    </Svg>
  );

  // Gate: ask the user to enable location before anything loads.
  if (!coords) {
    return (
      <Screen flush>
        <View style={styles.content}>
          <View style={styles.mapWrap}>
            {mapSvg}
            <View style={styles.gateOverlay}>
              <MapPinIcon size={34} color={colors.primary} />
              <Text style={styles.gateHint}>{t("services.locationHint")}</Text>
              {locStatus === "loading" ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Button
                  title={locStatus === "denied" ? t("common.retry") : t("services.enableLocation")}
                  icon={<MapPinIcon size={20} color={colors.onPrimary} />}
                  onPress={requestLocation}
                />
              )}
              {locStatus === "denied" ? <Text style={styles.denied}>{t("services.locationDenied")}</Text> : null}
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen flush>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapWrap}>
          {mapSvg}
          {list.map((s) => {
            const p = pos(s);
            return (
              <View key={s.id} style={[styles.pin, { left: `${p.x * 100}%`, top: `${p.y * 100}%` }]}>
                <MapPinIcon size={26} color={colors.primary} />
              </View>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {CATEGORIES.map((c) => {
            const sel = c.key === filter;
            return (
              <Pressable key={c.key} onPress={() => setFilter(c.key)} style={[styles.chip, sel && styles.chipActive]}>
                <Text style={[styles.chipText, sel && styles.chipTextActive]}>{t(`services.${c.key}`)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.muted}>{t("services.searching")}</Text>
          </View>
        ) : list.length === 0 ? (
          <Text style={styles.muted}>{t("services.note")}</Text>
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

        {list.length > 0 ? <Text style={styles.note}>{pricedFuel ? t("services.priceNote") : t("services.liveNote")}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    mapWrap: { borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border, minHeight: 180 },
    gateOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      padding: spacing.lg,
      backgroundColor: colors.background + "D9",
    },
    gateHint: { ...typography.body, color: colors.text, textAlign: "center", maxWidth: 320 },
    denied: { ...typography.caption, color: colors.danger, textAlign: "center" },
    pin: { position: "absolute", marginLeft: -13, marginTop: -26 },
    filtersScroll: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.lg },
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
