import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { api, type CreateEventInput } from "../../../src/api/client";
import { useTheme } from "../../../src/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../../../src/theme/tokens";
import { Button } from "../../../src/ui/Button";
import { Dropdown } from "../../../src/ui/Dropdown";
import { Screen } from "../../../src/ui/Screen";
import { TextField } from "../../../src/ui/TextField";
import { PlusIcon, TrashIcon } from "../../../src/ui/icons";

const CATEGORY_KEYS = ["oil", "oilfilter", "brakes", "tires", "tuv", "inspection", "battery", "fluids", "repair", "other"];
const EXPENSE_CATEGORY_KEYS = ["fuel", "service", "repair", "insurance", "tuning", "care", "other"];

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const parseDate = (s: string): Date => {
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
};

export default function AddEventScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId?: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isEdit = !!eventId;

  const events = useQuery({ queryKey: ["events", id], queryFn: () => api.listEvents(id), enabled: !!id && isEdit });

  const [kind, setKind] = useState<"maintenance" | "expense">("maintenance");
  const [category, setCategory] = useState("oil");
  const [date, setDate] = useState(fmtDate(new Date()));
  const [mileage, setMileage] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [diy, setDiy] = useState(false);
  const [workshop, setWorkshop] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  // expense-only
  const [expCategory, setExpCategory] = useState("fuel");
  const [amount, setAmount] = useState("");
  const [liters, setLiters] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (!isEdit || initialized.current) return;
    const ev = events.data?.find((e) => e.id === eventId);
    if (!ev) return;
    initialized.current = true;
    const p = ev.payload as Record<string, unknown>;
    setDate(fmtDate(new Date(ev.occurredAt)));
    setMileage(ev.mileageKm != null ? String(ev.mileageKm) : "");
    if (ev.type === "expense") {
      setKind("expense");
      const cat = String(p.category ?? "fuel");
      setExpCategory(EXPENSE_CATEGORY_KEYS.includes(cat) ? cat : "other");
      setAmount(p.amount != null ? String(p.amount) : "");
      setLiters(p.liters != null ? String(p.liters) : "");
    } else {
      setKind("maintenance");
      setCategory(typeof p.category === "string" && CATEGORY_KEYS.includes(p.category) ? p.category : "other");
      setDescription(String(p.notes ?? ""));
      const c = p.cost != null ? Number(p.cost) : (Number(p.partsCost) || 0) + (Number(p.laborCost) || 0);
      setCost(c ? String(c) : "");
      setDiy(Boolean(p.diy));
      setWorkshop(String(p.workshop ?? p.shopName ?? ""));
      setPhotos(Array.isArray(p.photos) ? (p.photos as string[]) : []);
    }
  }, [events.data, eventId, isEdit]);

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotos((p) => [...p, result.assets[0].uri]);
  };

  const save = useMutation({
    mutationFn: () => {
      const occurredAt = parseDate(date).toISOString();
      const mileageKm = mileage ? Number(mileage) : undefined;
      const maintenancePayload = {
        title: t(`addEvent.categories.${category}`),
        category,
        notes: description.trim() || undefined,
        cost: cost ? Number(cost) : undefined,
        currency: "EUR",
        workshop: diy ? undefined : workshop.trim() || undefined,
        diy,
        photos: photos.length ? photos : undefined,
      };
      const expensePayload = {
        category: expCategory,
        amount: Number(amount),
        currency: "EUR",
        ...(expCategory === "fuel" && liters ? { liters: Number(liters) } : {}),
      };
      if (isEdit) {
        return api.updateEvent(id, eventId!, {
          occurredAt,
          mileageKm,
          payload: kind === "maintenance" ? maintenancePayload : expensePayload,
        });
      }
      const input: CreateEventInput =
        kind === "maintenance"
          ? { type: "maintenance", occurredAt, mileageKm, payload: maintenancePayload }
          : { type: "expense", occurredAt, mileageKm, payload: expensePayload };
      return api.createEvent(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events", id] });
      void queryClient.invalidateQueries({ queryKey: ["expenses", id] });
      router.back();
    },
    onError: (e) => Alert.alert(t("addEvent.failed"), e instanceof Error ? e.message : String(e)),
  });

  const del = useMutation({
    mutationFn: () => api.deleteEvent(id, eventId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events", id] });
      void queryClient.invalidateQueries({ queryKey: ["expenses", id] });
      router.back();
    },
  });

  const confirmDelete = () => {
    const msg = t("addEvent.deleteConfirm");
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(msg)) del.mutate();
    } else {
      Alert.alert(t("addEvent.delete"), msg, [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("addEvent.delete"), style: "destructive", onPress: () => del.mutate() },
      ]);
    }
  };

  const canSubmit = kind === "maintenance" ? true : Number(amount) > 0;

  return (
    <Screen flush>
      <Stack.Screen options={{ title: isEdit ? t("addEvent.editTitle") : t("addEvent.title") }} />
      <ScrollView contentContainerStyle={styles.form}>
        {!isEdit ? (
          <View style={styles.tabs}>
            <View style={styles.tab}>
              <Button title={t("addEvent.maintenance")} variant={kind === "maintenance" ? "primary" : "secondary"} onPress={() => setKind("maintenance")} />
            </View>
            <View style={styles.tab}>
              <Button title={t("addEvent.expense")} variant={kind === "expense" ? "primary" : "secondary"} onPress={() => setKind("expense")} />
            </View>
          </View>
        ) : null}

        {kind === "maintenance" ? (
          <>
            <Dropdown
              label={t("addEvent.art")}
              value={category}
              onChange={setCategory}
              options={CATEGORY_KEYS.map((c) => ({ value: c, label: t(`addEvent.categories.${c}`) }))}
            />

            <View style={styles.rowFields}>
              <View style={styles.flex}>
                <TextField label={t("addEvent.date")} value={date} onChangeText={setDate} placeholder="TT.MM.JJJJ" />
              </View>
              <View style={styles.flex}>
                <TextField label={t("addEvent.mileage")} keyboardType="number-pad" value={mileage} onChangeText={setMileage} />
              </View>
            </View>

            <TextField label={t("addEvent.description")} value={description} onChangeText={setDescription} multiline />
            <TextField label={t("addEvent.cost")} keyboardType="decimal-pad" value={cost} onChangeText={setCost} />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t("addEvent.diy")}</Text>
              <Switch value={diy} onValueChange={setDiy} trackColor={{ true: colors.primary, false: colors.borderStrong }} thumbColor="#fff" />
            </View>
            {!diy ? <TextField label={t("addEvent.workshop")} value={workshop} onChangeText={setWorkshop} /> : null}

            {/* Photos / documents */}
            <View style={styles.photos}>
              {photos.map((uri, i) => (
                <Pressable key={uri + i} onPress={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}>
                  <Image source={{ uri }} style={styles.thumb} />
                </Pressable>
              ))}
            </View>
            <Button variant="secondary" title={t("addEvent.addPhoto")} icon={<PlusIcon size={18} color={colors.text} />} onPress={addPhoto} />
          </>
        ) : (
          <>
            <Dropdown
              label={t("addEvent.category")}
              value={expCategory}
              onChange={setExpCategory}
              options={EXPENSE_CATEGORY_KEYS.map((c) => ({ value: c, label: t(`addEvent.expenseCategories.${c}`) }))}
            />
            <TextField label={t("addEvent.amount")} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            {expCategory === "fuel" ? (
              <TextField label={t("addEvent.liters")} keyboardType="decimal-pad" value={liters} onChangeText={setLiters} />
            ) : null}
            <View style={styles.rowFields}>
              <View style={styles.flex}>
                <TextField label={t("addEvent.date")} value={date} onChangeText={setDate} placeholder="TT.MM.JJJJ" />
              </View>
              <View style={styles.flex}>
                <TextField label={t("addEvent.mileage")} keyboardType="number-pad" value={mileage} onChangeText={setMileage} />
              </View>
            </View>
          </>
        )}

        <Button title={t("common.save")} onPress={() => save.mutate()} loading={save.isPending} disabled={!canSubmit} />

        {isEdit ? (
          <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
            <TrashIcon size={18} color={colors.danger} />
            <Text style={styles.deleteText}>{t("addEvent.delete")}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    form: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    tabs: { flexDirection: "row", gap: spacing.sm },
    tab: { flex: 1 },
    rowFields: { flexDirection: "row", gap: spacing.md },
    flex: { flex: 1 },
    switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs },
    switchLabel: { ...typography.body, color: colors.text },
    photos: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
    deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md },
    deleteText: { ...typography.body, color: colors.danger, fontWeight: "700" },
  });
