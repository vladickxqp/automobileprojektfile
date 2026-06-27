import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../src/i18n";
import { AuthProvider } from "../src/auth/AuthContext";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";
import { IconButton } from "../src/ui/IconButton";
import { ArrowLeftIcon } from "../src/ui/icons";

const queryClient = new QueryClient();

function ThemedStack() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <View style={{ paddingLeft: 4, paddingRight: 8 }}>
                <IconButton variant="ghost" accessibilityLabel="Zurück" onPress={() => router.back()}>
                  <ArrowLeftIcon size={22} color={colors.text} />
                </IconButton>
              </View>
            ) : undefined,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemedStack />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
