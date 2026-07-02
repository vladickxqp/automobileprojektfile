import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Platform, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../theme/tokens";

export type ToastType = "error" | "success" | "info";
interface ToastInput {
  message: string;
  type?: ToastType;
}

// Module-level bridge so non-React code (e.g. the react-query cache) can raise a toast.
let handler: ((t: ToastInput) => void) | null = null;
export function setToastHandler(fn: ((t: ToastInput) => void) | null): void {
  handler = fn;
}
export function toast(message: string, type: ToastType = "info"): void {
  handler?.({ message, type });
}

const ToastCtx = createContext<(t: ToastInput) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [current, setCurrent] = useState<ToastInput | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (t: ToastInput) => {
      if (timer.current) clearTimeout(timer.current);
      setCurrent(t);
      const useNative = Platform.OS !== "web";
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: useNative }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: useNative }).start(() => setCurrent(null));
      }, 3500);
    },
    [opacity],
  );

  useEffect(() => {
    setToastHandler(show);
    return () => setToastHandler(null);
  }, [show]);

  const tone =
    current?.type === "error" ? colors.danger : current?.type === "success" ? colors.success : colors.primary;

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {current ? (
        <Animated.View
          style={[styles.wrap, { bottom: insets.bottom + spacing.xl, opacity, borderColor: tone, pointerEvents: "none" }]}
        >
          <Text style={[styles.dot, { color: tone }]}>●</Text>
          <Text style={styles.msg} numberOfLines={4}>
            {current.message}
          </Text>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      position: "absolute",
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      ...Platform.select({ web: { boxShadow: "0 12px 40px -12px rgba(0,0,0,0.55)" } as object, default: {} }),
    },
    dot: { fontSize: 10 },
    msg: { ...typography.body, color: colors.text, flex: 1 },
  });
