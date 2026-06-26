import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/theme/ThemeProvider";
import { ThemeToggle } from "../../src/ui/ThemeToggle";
import { CarIcon, LayersIcon, UserIcon } from "../../src/ui/icons";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        headerRight: () => <ThemeToggle />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="garage"
        options={{ title: t("garage.title"), tabBarIcon: ({ color, size }) => <CarIcon size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="fleet"
        options={{ title: t("fleet.title"), tabBarIcon: ({ color, size }) => <LayersIcon size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t("profile.title"), tabBarIcon: ({ color, size }) => <UserIcon size={size} color={color} /> }}
      />
    </Tabs>
  );
}
