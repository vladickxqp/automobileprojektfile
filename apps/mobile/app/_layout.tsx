import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../src/i18n";
import { ApiError } from "../src/api/apiClient";
import { AuthProvider } from "../src/auth/AuthContext";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";
import { IconButton } from "../src/ui/IconButton";
import { ToastProvider, toast } from "../src/ui/Toast";
import { ArrowLeftIcon } from "../src/ui/icons";

// Surface any query/mutation failure as an error toast. 401s are swallowed — the API interceptor
// already logs the user out and routes to sign-in.
function notifyError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) return;
  toast(error instanceof Error ? error.message : String(error), "error");
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: notifyError }),
  mutationCache: new MutationCache({ onError: notifyError }),
});

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
          headerLeft: ({ canGoBack }) => (
            <View style={{ paddingLeft: 4, paddingRight: 8 }}>
              <IconButton
                variant="ghost"
                accessibilityLabel="Zurück"
                onPress={() => (canGoBack ? router.back() : router.replace("/home"))}
              >
                <ArrowLeftIcon size={22} color={colors.text} />
              </IconButton>
            </View>
          ),
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
            <ToastProvider>
              <ThemedStack />
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
