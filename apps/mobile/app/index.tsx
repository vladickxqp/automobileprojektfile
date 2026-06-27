import { Redirect, Stack } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { isOnboarded } from "../src/onboarding/store";
import { useTheme } from "../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { LogoMark } from "../src/ui/Logo";

// Launch gate: shows an animated CarDNA splash, then routes to onboarding / sign-in / garage.
export default function Launch() {
  const { ready, user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [minElapsed, setMinElapsed] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const useNative = Platform.OS !== "web";
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 550, useNativeDriver: useNative }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: useNative }),
    ]).start();
    const timer = setTimeout(() => setMinElapsed(true), 1500);
    return () => clearTimeout(timer);
  }, [opacity, scale]);

  if (!ready || !minElapsed) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
          <LogoMark size={92} />
          <Text style={styles.brand}>CarDNA</Text>
          <Text style={styles.tagline}>Die digitale Lebensakte deines Autos</Text>
        </Animated.View>
      </View>
    );
  }

  if (!isOnboarded()) return <Redirect href="/onboarding" />;
  if (!user) return <Redirect href="/sign-in" />;
  return <Redirect href="/home" />;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
    center: { alignItems: "center", gap: spacing.md },
    brand: { ...typography.display, color: colors.text, letterSpacing: 1 },
    tagline: { ...typography.body, color: colors.textMuted },
  });
