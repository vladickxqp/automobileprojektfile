import { usePathname, useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../theme/tokens";
import { LogoMark } from "./Logo";
import { CarIcon, HomeIcon, LayersIcon, MapPinIcon, SparkleIcon, UserIcon, type IconProps } from "./icons";

interface NavItem {
  route: string;
  label: string;
  Icon: (p: IconProps) => JSX.Element;
}

// Slide-in side menu (replaces the bottom bar). Opened by the header hamburger.
export function AppDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(300, width * 0.82);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const tx = useRef(new Animated.Value(-panelWidth)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!open) return;
    const useNative = Platform.OS !== "web";
    Animated.parallel([
      Animated.timing(tx, { toValue: 0, duration: 220, useNativeDriver: useNative }),
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: useNative }),
    ]).start();
  }, [open, tx, fade]);

  if (!open) return null;

  const items: NavItem[] = [
    { route: "/home", label: t("home.tab"), Icon: HomeIcon },
    { route: "/garage", label: t("garage.title"), Icon: CarIcon },
    { route: "/karte", label: t("services.tab"), Icon: MapPinIcon },
    { route: "/mechaniker", label: t("mechaniker.tab"), Icon: SparkleIcon },
    { route: "/fleet", label: t("fleet.title"), Icon: LayersIcon },
    { route: "/profile", label: t("profile.title"), Icon: UserIcon },
  ];

  const go = (route: string) => {
    onClose();
    router.replace(route);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Menü schließen" />
      </Animated.View>
      <Animated.View
        style={[styles.panel, { width: panelWidth, paddingTop: insets.top + spacing.lg, transform: [{ translateX: tx }] }]}
      >
        <View style={styles.brandRow}>
          <LogoMark size={40} />
          <Text style={styles.brand}>CarDNA</Text>
        </View>
        {items.map((it) => {
          const active = pathname === it.route || (it.route === "/home" && (pathname === "/" || pathname === "/home"));
          const color = active ? colors.primary : colors.textMuted;
          return (
            <Pressable key={it.route} onPress={() => go(it.route)} style={[styles.item, active && styles.itemActive]}>
              <it.Icon size={22} color={color} />
              <Text style={[styles.itemLabel, { color: active ? colors.text : colors.textMuted }]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { backgroundColor: "rgba(0,0,0,0.55)" },
    panel: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.background,
      borderRightWidth: 1,
      borderRightColor: colors.borderStrong,
      paddingHorizontal: spacing.lg,
      gap: spacing.xs,
      ...Platform.select({ web: { boxShadow: "8px 0 40px -12px rgba(0,0,0,0.6)" } as object, default: {} }),
    },
    brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
    brand: { ...typography.h2, color: colors.text },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
    },
    itemActive: { backgroundColor: colors.primarySoft },
    itemLabel: { ...typography.h3 },
  });
