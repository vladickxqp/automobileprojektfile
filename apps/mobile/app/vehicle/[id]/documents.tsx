import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, type DocumentUploadMeta } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Badge } from "../../../src/ui/Badge";
import { Button } from "../../../src/ui/Button";
import { Card } from "../../../src/ui/Card";
import { Dropdown } from "../../../src/ui/Dropdown";
import { Screen } from "../../../src/ui/Screen";
import { TextField } from "../../../src/ui/TextField";
import { ChevronRightIcon, FileIcon } from "../../../src/ui/icons";

const TYPE_KEYS = ["invoice", "techpassport", "insurance", "tuv", "tax", "warranty", "contract", "other"];
const INTERVALS = ["monthly", "quarterly", "semiannual", "annual"];

// DD.MM.YYYY -> ISO, or undefined if empty/invalid.
const toIso = (s: string): string | undefined => {
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return undefined;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [type, setType] = useState("invoice");
  const [title, setTitle] = useState("");
  const [issued, setIssued] = useState("");
  const [expires, setExpires] = useState("");
  const [insurer, setInsurer] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [premium, setPremium] = useState("");
  const [interval, setIntervalValue] = useState("annual");
  const [paymentDate, setPaymentDate] = useState("");
  const [amount, setAmount] = useState("");
  const [debitDate, setDebitDate] = useState("");
  const [dealer, setDealer] = useState("");
  const [scope, setScope] = useState("");

  const typeLabel = (key: string) => t(`documents.types.${key}`, { defaultValue: key });
  const documents = useQuery({ queryKey: ["documents", id], queryFn: () => api.listDocuments(id), enabled: !!id });

  const buildMeta = (): DocumentUploadMeta => {
    const m: DocumentUploadMeta = { type };
    if (title.trim()) m.title = title.trim();
    if (toIso(issued)) m.issuedAt = toIso(issued);
    if (toIso(expires)) m.expiresAt = toIso(expires);
    if (type === "insurance") {
      if (insurer.trim()) m.insurer = insurer.trim();
      if (policyNumber.trim()) m.policyNumber = policyNumber.trim();
      if (premium.trim()) m.premium = premium.replace(",", ".");
      m.interval = interval;
      if (toIso(paymentDate)) m.paymentDate = toIso(paymentDate);
    }
    if (type === "tax") {
      if (amount.trim()) m.amount = amount.replace(",", ".");
      if (toIso(debitDate)) m.debitDate = toIso(debitDate);
    }
    if (type === "warranty") {
      if (dealer.trim()) m.dealer = dealer.trim();
      if (scope.trim()) m.scope = scope.trim();
    }
    return m;
  };

  const upload = useMutation({
    mutationFn: async () => {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled) return null;
      const asset = result.assets[0];
      if (!asset) return null;
      return api.uploadDocument(id, { uri: asset.uri, name: asset.name, mimeType: asset.mimeType }, buildMeta());
    },
    onSuccess: (doc) => {
      if (!doc) return;
      setTitle("");
      setIssued("");
      setExpires("");
      setInsurer("");
      setPolicyNumber("");
      setPremium("");
      setPaymentDate("");
      setAmount("");
      setDebitDate("");
      setDealer("");
      setScope("");
      void queryClient.invalidateQueries({ queryKey: ["documents", id] });
    },
    onError: (e) => Alert.alert(t("documents.title"), e instanceof Error ? e.message : String(e)),
  });

  const openDoc = (url?: string | null) => {
    if (url && url !== "#") void Linking.openURL(url).catch(() => Alert.alert(t("documents.title"), t("documents.noFile")));
    else Alert.alert(t("documents.title"), t("documents.noFile"));
  };

  const docs = documents.data ?? [];

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("documents.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Existing documents */}
        {documents.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : docs.length === 0 ? (
          <Text style={styles.muted}>{t("documents.empty")}</Text>
        ) : (
          docs.map((item) => (
            <Pressable key={item.id} onPress={() => openDoc(item.fileUrl)}>
              {({ pressed }) => (
                <Card style={pressed ? { borderColor: colors.borderStrong } : undefined}>
                  <View style={styles.row}>
                    <View style={styles.iconWrap}>
                      <FileIcon size={20} color={colors.primary} />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.title} numberOfLines={1}>
                        {item.title ?? typeLabel(item.type)}
                      </Text>
                      <Text style={styles.muted}>
                        {item.expiresAt
                          ? `${t("documents.validUntil")} ${new Date(item.expiresAt).toLocaleDateString("de-DE")}`
                          : typeLabel(item.type)}
                      </Text>
                    </View>
                    <Badge label={typeLabel(item.type)} />
                    <ChevronRightIcon size={18} color={colors.textFaint} />
                  </View>
                </Card>
              )}
            </Pressable>
          ))
        )}

        {/* Add document — dynamic form */}
        <Text style={styles.sectionLabel}>{t("documents.newDoc")}</Text>
        <Card style={{ gap: spacing.md }}>
          <Dropdown
            label={t("documents.typeLabel")}
            value={type}
            onChange={setType}
            options={TYPE_KEYS.map((k) => ({ value: k, label: typeLabel(k) }))}
          />
          <TextField label={t("documents.title")} value={title} onChangeText={setTitle} />

          {type === "insurance" ? (
            <>
              <TextField label={t("documents.fields.insurer")} value={insurer} onChangeText={setInsurer} />
              <TextField label={t("documents.fields.policyNumber")} value={policyNumber} onChangeText={setPolicyNumber} autoCapitalize="characters" />
              <View style={styles.rowFields}>
                <View style={styles.flex}>
                  <TextField label={t("documents.fields.premium")} keyboardType="decimal-pad" value={premium} onChangeText={setPremium} />
                </View>
                <View style={styles.flex}>
                  <Dropdown
                    label={t("documents.fields.interval")}
                    value={interval}
                    onChange={setIntervalValue}
                    options={INTERVALS.map((k) => ({ value: k, label: t(`documents.intervals.${k}`) }))}
                  />
                </View>
              </View>
              <View style={styles.rowFields}>
                <View style={styles.flex}>
                  <TextField label={t("documents.fields.paymentDate")} value={paymentDate} onChangeText={setPaymentDate} placeholder="TT.MM.JJJJ" />
                </View>
                <View style={styles.flex}>
                  <TextField label={t("documents.validUntil")} value={expires} onChangeText={setExpires} placeholder="TT.MM.JJJJ" />
                </View>
              </View>
            </>
          ) : null}

          {type === "tuv" ? (
            <View style={styles.rowFields}>
              <View style={styles.flex}>
                <TextField label={t("documents.fields.date")} value={issued} onChangeText={setIssued} placeholder="TT.MM.JJJJ" />
              </View>
              <View style={styles.flex}>
                <TextField label={t("documents.validUntil")} value={expires} onChangeText={setExpires} placeholder="TT.MM.JJJJ" />
              </View>
            </View>
          ) : null}

          {type === "tax" ? (
            <View style={styles.rowFields}>
              <View style={styles.flex}>
                <TextField label={t("documents.fields.amount")} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
              </View>
              <View style={styles.flex}>
                <TextField label={t("documents.fields.debitDate")} value={debitDate} onChangeText={setDebitDate} placeholder="TT.MM.JJJJ" />
              </View>
            </View>
          ) : null}

          {type === "warranty" ? (
            <>
              <View style={styles.rowFields}>
                <View style={styles.flex}>
                  <TextField label={t("documents.fields.start")} value={issued} onChangeText={setIssued} placeholder="TT.MM.JJJJ" />
                </View>
                <View style={styles.flex}>
                  <TextField label={t("documents.fields.end")} value={expires} onChangeText={setExpires} placeholder="TT.MM.JJJJ" />
                </View>
              </View>
              <TextField label={t("documents.fields.dealer")} value={dealer} onChangeText={setDealer} />
              <TextField label={t("documents.fields.scope")} value={scope} onChangeText={setScope} multiline />
            </>
          ) : null}

          <Button title={t("documents.upload")} onPress={() => upload.mutate()} loading={upload.isPending} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    info: { flex: 1, gap: 2 },
    title: { ...typography.h3, color: colors.text },
    muted: { ...typography.caption, color: colors.textMuted },
    sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.sm },
    rowFields: { flexDirection: "row", gap: spacing.md },
    flex: { flex: 1 },
  });
