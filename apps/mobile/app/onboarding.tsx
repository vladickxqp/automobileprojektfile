import { Stack, useRouter } from "expo-router";
import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { setOnboarded } from "../src/onboarding/store";
import { useTheme } from "../src/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../src/theme/tokens";
import { Button } from "../src/ui/Button";
import { LogoMark } from "../src/ui/Logo";
import { Screen } from "../src/ui/Screen";
import { ActivityIcon, FileIcon, GaugeIcon, SparkleIcon } from "../src/ui/icons";

interface Slide {
  icon: (color: string) => ReactNode;
  title: string;
  text: string;
}

const SLIDES: Slide[] = [
  {
    icon: () => <LogoMark size={92} />,
    title: "Dein Auto. Seine Geschichte.",
    text: "Jedes Fahrzeug bekommt eine vollständige digitale Lebensakte — von der Anschaffung bis zum Verkauf.",
  },
  {
    icon: (c) => <ActivityIcon size={52} color={c} />,
    title: "KI-gestützte Diagnose.",
    text: "Beschreibe Symptome, lies Fehlercodes aus und verstehe Probleme sofort — mit klaren Handlungsempfehlungen.",
  },
  {
    icon: (c) => <FileIcon size={52} color={c} />,
    title: "Digitaler Fahrzeugpass.",
    text: "Wartung, Dokumente und Kosten an einem Ort — übertragbar an den nächsten Besitzer beim Verkauf.",
  },
  {
    icon: (c) => <GaugeIcon size={52} color={c} />,
    title: "Schlauer warten. Geld sparen.",
    text: "Der AutoScore zeigt den Zustand, Erinnerungen verhindern teure Schäden, bevor sie entstehen.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const slideWidth = Math.min(width, 520);
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const finish = () => {
    setOnboarded();
    router.replace("/sign-in");
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (index >= SLIDES.length - 1) return finish();
    scroller.current?.scrollTo({ x: (index + 1) * slideWidth, animated: true });
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <Screen flush>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.top}>
        <Text style={styles.brand}>CarDNA</Text>
        <Pressable onPress={finish} hitSlop={10}>
          <Text style={styles.skip}>Überspringen</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.flex}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width: slideWidth }]}>
            <View style={styles.iconWrap}>{s.icon(colors.primary)}</View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.text}>{s.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button size="lg" title={isLast ? "Konto erstellen" : "Weiter"} onPress={next} />
        {isLast ? <Button variant="ghost" title="Ich habe schon ein Konto" onPress={finish} /> : null}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    top: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    brand: { ...typography.label, color: colors.primary },
    skip: { ...typography.caption, color: colors.textMuted },
    slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, gap: spacing.lg },
    iconWrap: {
      width: 120,
      height: 120,
      borderRadius: 30,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    title: { ...typography.h1, color: colors.text, textAlign: "center" },
    text: { ...typography.body, color: colors.textMuted, textAlign: "center", maxWidth: 360 },
    dots: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.lg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderStrong },
    dotActive: { backgroundColor: colors.primary, width: 22 },
    actions: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xs },
  });
