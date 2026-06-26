import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../src/api/client";
import { decodeVin as decodeVinReal } from "../src/api/vin";
import { useTheme } from "../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Button } from "../src/ui/Button";
import { CarPhoto } from "../src/ui/CarPhoto";
import { Screen } from "../src/ui/Screen";
import { TextField } from "../src/ui/TextField";

export default function AddVehicleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const onDecode = async () => {
    const value = vin.trim().toUpperCase();
    if (value.length !== 17) {
      Alert.alert(t("addCar.vinInvalid"));
      return;
    }
    setDecoding(true);
    try {
      // Real decode via NHTSA vPIC; fall back to the demo decoder if offline / unrecognised.
      let decoded;
      try {
        decoded = await decodeVinReal(value);
      } catch {
        decoded = await api.decodeVin(value);
      }
      if (decoded.make) setMake(decoded.make);
      if (decoded.model) setModel(decoded.model);
      if (decoded.year) setYear(String(decoded.year));
    } catch (e) {
      Alert.alert(t("addCar.decodeFailed"), e instanceof Error ? e.message : String(e));
    } finally {
      setDecoding(false);
    }
  };

  const create = useMutation({
    mutationFn: () =>
      api.createVehicle({
        vin: vin.trim().toUpperCase(),
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        photoUrl: photoUri ?? undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      router.replace("/garage");
    },
    onError: (e) =>
      Alert.alert(t("addCar.createFailed"), e instanceof Error ? e.message : String(e)),
  });

  const canSubmit =
    vin.trim().length === 17 && make.trim().length > 0 && model.trim().length > 0 && Number(year) > 1900;

  return (
    <Screen>
      <Stack.Screen options={{ title: t("addCar.title") }} />
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.photoWrap}>
          <CarPhoto uri={photoUri} height={180} />
        </View>
        <Button
          variant="secondary"
          title={photoUri ? t("addCar.changePhoto") : t("addCar.addPhoto")}
          onPress={pickPhoto}
        />
        <Text style={styles.hint}>{t("addCar.vinHint")}</Text>
        <TextField
          label={t("addCar.vin")}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={17}
          value={vin}
          onChangeText={setVin}
        />
        <Button variant="secondary" title={t("addCar.decode")} onPress={onDecode} loading={decoding} />
        <TextField label={t("addCar.make")} value={make} onChangeText={setMake} />
        <TextField label={t("addCar.model")} value={model} onChangeText={setModel} />
        <TextField
          label={t("addCar.year")}
          keyboardType="number-pad"
          maxLength={4}
          value={year}
          onChangeText={setYear}
        />
        <Button
          title={t("addCar.save")}
          onPress={() => create.mutate()}
          loading={create.isPending}
          disabled={!canSubmit}
        />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    form: { gap: spacing.md, paddingBottom: spacing.xl },
    photoWrap: { marginBottom: spacing.xs },
    hint: { ...typography.caption, color: colors.textMuted },
  });
