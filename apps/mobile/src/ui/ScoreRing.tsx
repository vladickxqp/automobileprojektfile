import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";
import { typography } from "../theme/tokens";

export function scoreColor(score: number, colors: { success: string; warning: string; danger: string }): string {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.danger;
}

interface ScoreRingProps {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

// Circular AutoScore gauge. The arc fills proportional to the 0–100 score and is colour-coded.
export function ScoreRing({ score, size = 132, strokeWidth = 12, label = "AutoScore" }: ScoreRingProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(), []);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const ring = score == null ? colors.textFaint : scoreColor(score, colors);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color: ring }]}>{score ?? "—"}</Text>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    center: { position: "absolute", alignItems: "center" },
    value: { fontSize: 38, fontWeight: "800", lineHeight: 42 },
    label: { ...typography.label, marginTop: 2 },
  });
