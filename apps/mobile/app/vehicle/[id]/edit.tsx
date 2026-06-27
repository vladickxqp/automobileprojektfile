import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Button } from "../../../src/ui/Button";
import { CarPhoto } from "../../../src/ui/CarPhoto";
import { Screen } from "../../../src/ui/Screen";
import { TextField } from "../../../src/ui/TextField";

export default function EditVehicleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const vehicle = useQuery({ queryKey: ["vehicle", id], queryFn: () => api.getVehicle(id), enabled: !!id });
  const v = vehicle.data;

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [plate, setPlate] = useState("");
  const [mileage, setMileage] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (v && !initialized.current) {
      initialized.current = true;
      setMake(v.make);
      setModel(v.model);
      setYear(String(v.year));
      setEngine(v.engine ?? "");
      setPlate(v.plate ?? "");
      setMileage(v.mileageKm != null ? String(v.mileageKm) : "");
      setPhotoUri(v.photoUrl);
    }
  }, [v]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const minMileage = v?.mileageKm ?? 0;
  const mileageNum = mileage ? Number(mileage) : null;
  const mileageInvalid = mileageNum != null && mileageNum < minMileage;

  const save = useMutation({
    mutationFn: () =>
      api.updateVehicle(id, {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        engine: engine.trim() || null,
        plate: plate.trim() || null,
        mileageKm: mileageNum ?? undefined,
        photoUrl: photoUri ?? undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vehicle", id] });
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      router.back();
    },
    onError: (e) => Alert.alert(t("addCar.createFailed"), e instanceof Error ? e.message : String(e)),
  });

  const canSubmit = make.trim().length > 0 && model.trim().length > 0 && Number(year) > 1900 && !mileageInvalid;

  if (vehicle.isLoading || !v) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t("editVehicle.title") }} />
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen flush>
      <Stack.Screen options={{ title: t("editVehicle.title") }} />
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.photoWrap}>
          <CarPhoto uri={photoUri} height={170} />
        </View>
        <Button
          variant="secondary"
          title={photoUri ? t("addCar.changePhoto") : t("addCar.addPhoto")}
          onPress={pickPhoto}
        />
        <TextField label={t("addCar.make")} value={make} onChangeText={setMake} />
        <TextField label={t("addCar.model")} value={model} onChangeText={setModel} />
        <TextField label={t("addCar.year")} keyboardType="number-pad" maxLength={4} value={year} onChangeText={setYear} />
        <TextField label={t("dashboard.engine")} value={engine} onChangeText={setEngine} />
        <TextField label={t("editVehicle.plate")} value={plate} onChangeText={setPlate} autoCapitalize="characters" />
        <TextField label={t("dashboard.mileage")} keyboardType="number-pad" value={mileage} onChangeText={setMileage} />
        {mileageInvalid ? (
          <Text style={styles.error}>≥ {minMileage.toLocaleString("de-DE")} km</Text>
        ) : null}
        <Button title={t("common.save")} onPress={() => save.mutate()} loading={save.isPending} disabled={!canSubmit} />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    form: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    photoWrap: { marginBottom: spacing.xs },
    error: { ...typography.caption, color: colors.danger },
  });
