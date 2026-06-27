import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppDrawer } from "../../src/ui/AppDrawer";
import { IconButton } from "../../src/ui/IconButton";
import { BellIcon, MenuIcon } from "../../src/ui/icons";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Tabs
        tabBar={() => null}
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          headerLeft: () => (
            <View style={{ paddingLeft: 4 }}>
              <IconButton variant="ghost" accessibilityLabel="Menü" onPress={() => setDrawerOpen(true)}>
                <MenuIcon size={22} color={colors.text} />
              </IconButton>
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t("home.tab"),
            headerRight: () => (
              <View style={{ paddingRight: 4 }}>
                <IconButton variant="ghost" accessibilityLabel={t("notifications.title")} onPress={() => router.push("/notifications")}>
                  <BellIcon size={20} color={colors.text} />
                </IconButton>
              </View>
            ),
          }}
        />
        <Tabs.Screen name="garage" options={{ title: t("garage.title") }} />
        <Tabs.Screen name="karte" options={{ title: t("services.tab") }} />
        <Tabs.Screen name="mechaniker" options={{ title: t("mechaniker.tab") }} />
        <Tabs.Screen name="fleet" options={{ title: t("fleet.title") }} />
        <Tabs.Screen name="profile" options={{ title: t("profile.title") }} />
      </Tabs>

      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
