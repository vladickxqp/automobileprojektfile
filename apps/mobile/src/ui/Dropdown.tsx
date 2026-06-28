import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../theme/tokens";
import { CheckIcon, ChevronDownIcon } from "./icons";

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Dropdown({ label, value, options, onChange, placeholder }: DropdownProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        style={({ pressed }) => [styles.trigger, (open || pressed) && styles.triggerActive]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder ?? ""}
        </Text>
        <ChevronDownIcon size={20} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
            <ScrollView style={styles.list} bounces={false}>
              {options.map((o) => {
                const sel = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, sel && styles.optionTextActive]}>{o.label}</Text>
                    {sel ? <CheckIcon size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: spacing.xs },
    label: { ...typography.label, color: colors.textMuted, textTransform: "uppercase" },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 52,
    },
    triggerActive: { borderColor: colors.primary },
    value: { ...typography.body, color: colors.text, flex: 1 },
    placeholder: { color: colors.textFaint },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      padding: spacing.lg,
    },
    sheet: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.sm,
      maxHeight: "70%",
    },
    sheetTitle: {
      ...typography.label,
      color: colors.textMuted,
      textTransform: "uppercase",
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    list: { flexGrow: 0 },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    optionPressed: { backgroundColor: colors.primarySoft },
    optionText: { ...typography.body, color: colors.text },
    optionTextActive: { color: colors.primary, fontWeight: "700" },
  });
