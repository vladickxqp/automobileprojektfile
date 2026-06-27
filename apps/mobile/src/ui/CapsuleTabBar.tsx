import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";

// monobank-style bottom navigation: a horizontally scrollable row of pill capsules. The active
// capsule is highlighted with the accent; extra sections scroll off the edge on small screens.
export function CapsuleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {state.routes.map((route, i) => {
          const { options } = descriptors[route.key];
          const focused = state.index === i;
          const label = (options.title ?? route.name) as string;
          const color = focused ? colors.primary : colors.textMuted;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              style={[
                styles.pill,
                {
                  backgroundColor: focused ? colors.primarySoft : colors.surfaceAlt,
                  borderColor: focused ? colors.primary : colors.border,
                },
              ]}
            >
              {options.tabBarIcon?.({ focused, color, size: 18 })}
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, paddingTop: 8 },
  scroll: { flexDirection: "row", gap: 8, paddingHorizontal: 12, alignItems: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: "pointer" } as object, default: {} }),
  },
  label: { fontSize: 13, fontWeight: "700" },
});
