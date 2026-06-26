import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Button } from "../src/ui/Button";
import { Card } from "../src/ui/Card";
import { Screen } from "../src/ui/Screen";
import { TextField } from "../src/ui/TextField";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Screen>
      <Stack.Screen options={{ title: t("forgot.title") }} />
      <Card elevated style={styles.card}>
        {sent ? (
          <>
            <Text style={styles.sent}>{t("forgot.sent")}</Text>
            <Button title={t("forgot.back")} onPress={() => router.replace("/sign-in")} />
          </>
        ) : (
          <>
            <Text style={styles.intro}>{t("forgot.intro")}</Text>
            <TextField
              label={t("auth.email")}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="du@beispiel.de"
            />
            <Button
              size="lg"
              title={t("forgot.send")}
              onPress={() => setSent(true)}
              disabled={!email.includes("@")}
            />
            <Button variant="ghost" title={t("forgot.back")} onPress={() => router.replace("/sign-in")} />
          </>
        )}
      </Card>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { gap: spacing.md },
    intro: { ...typography.body, color: colors.textMuted },
    sent: { ...typography.body, color: colors.text },
  });
