import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { useTheme } from "../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Button } from "../src/ui/Button";
import { Card } from "../src/ui/Card";
import { CarSilhouette } from "../src/ui/CarSilhouette";
import { Screen } from "../src/ui/Screen";
import { TextField } from "../src/ui/TextField";
import { AppleIcon, GoogleIcon } from "../src/ui/icons";

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "signIn") await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
      router.replace("/garage");
    } catch (e) {
      Alert.alert(t("auth.error"), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setBusy(true);
    try {
      await signIn(`demo+${provider}@cardna.app`, "demo-oauth");
      router.replace("/garage");
    } catch (e) {
      Alert.alert(t("auth.error"), e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen flush>
      <Stack.Screen options={{ title: "CarDNA" }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <CarSilhouette width={300} height={140} />
          </View>

          <Text style={styles.brand}>CarDNA</Text>
          <Text style={styles.tagline}>{t("auth.tagline")}</Text>

          <Card elevated style={styles.form}>
            <Text style={styles.formTitle}>
              {t(mode === "signIn" ? "auth.signInTitle" : "auth.signUpTitle")}
            </Text>
            <TextField
              label={t("auth.email")}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="du@beispiel.de"
            />
            <TextField
              label={t("auth.password")}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
            />
            <Button
              size="lg"
              title={t(mode === "signIn" ? "auth.signIn" : "auth.signUp")}
              onPress={submit}
              loading={busy}
              disabled={!email.trim() || password.length < 8}
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>{t("auth.or")}</Text>
              <View style={styles.line} />
            </View>

            <Button
              variant="secondary"
              title={t("auth.continueGoogle")}
              icon={<GoogleIcon size={18} />}
              onPress={() => oauth("google")}
            />
            <Button
              variant="secondary"
              title={t("auth.continueApple")}
              icon={<AppleIcon size={18} color={colors.text} />}
              onPress={() => oauth("apple")}
            />

            <Button
              variant="ghost"
              title={t(mode === "signIn" ? "auth.toSignUp" : "auth.toSignIn")}
              onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            />
          </Card>

          <Text style={styles.demoHint}>{t("common.demo")}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
    hero: {
      backgroundColor: colors.backgroundElevated,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xl,
      marginBottom: spacing.sm,
    },
    brand: { ...typography.display, color: colors.text, textAlign: "center" },
    tagline: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
      marginBottom: spacing.md,
    },
    form: { gap: spacing.md },
    formTitle: { ...typography.h2, color: colors.text },
    divider: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    line: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { ...typography.caption, color: colors.textFaint },
    demoHint: { ...typography.caption, color: colors.textFaint, textAlign: "center", marginTop: spacing.md },
  });
