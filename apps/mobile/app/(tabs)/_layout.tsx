import { Tabs, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { CapsuleTabBar } from "../../src/ui/CapsuleTabBar";
import { IconButton } from "../../src/ui/IconButton";
import { ThemeToggle } from "../../src/ui/ThemeToggle";
import { BellIcon, CarIcon, HomeIcon, LayersIcon, MapPinIcon, SparkleIcon, UserIcon } from "../../src/ui/icons";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Tabs
      tabBar={(props) => <CapsuleTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        headerRight: () => <ThemeToggle />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("home.tab"),
          tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} />,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingRight: 4 }}>
              <IconButton variant="ghost" accessibilityLabel={t("notifications.title")} onPress={() => router.push("/notifications")}>
                <BellIcon size={20} color={colors.text} />
              </IconButton>
              <ThemeToggle />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="garage"
        options={{ title: t("garage.title"), tabBarIcon: ({ color, size }) => <CarIcon size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="karte"
        options={{ title: t("services.tab"), tabBarIcon: ({ color, size }) => <MapPinIcon size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="mechaniker"
        options={{ title: t("mechaniker.tab"), tabBarIcon: ({ color, size }) => <SparkleIcon size={size} color={color} /> }}
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
