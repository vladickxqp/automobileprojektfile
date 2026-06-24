import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { Button } from "../src/ui/Button";
import { Screen } from "../src/ui/Screen";
import { TextField } from "../src/ui/TextField";
import { colors, spacing, typography } from "../src/theme/tokens";

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "signIn") await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
      router.replace("/");
    } catch (e) {
      Alert.alert(t("auth.error"), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "AutoLife" }} />
      <Text style={styles.title}>
        {t(mode === "signIn" ? "auth.signInTitle" : "auth.signUpTitle")}
      </Text>
      <TextField
        label={t("auth.email")}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label={t("auth.password")}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={t(mode === "signIn" ? "auth.signIn" : "auth.signUp")}
        onPress={submit}
        loading={busy}
        disabled={!email.trim() || password.length < 8}
      />
      <Button
        variant="secondary"
        title={t(mode === "signIn" ? "auth.toSignUp" : "auth.toSignIn")}
        onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
});
