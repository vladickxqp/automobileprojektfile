import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../theme/tokens";

export interface BarPoint {
  label: string;
  value: number;
}

interface Props {
  data: BarPoint[];
  height?: number;
  format?: (v: number) => string;
}

// Minimal SVG bar chart (no chart dependency — react-native-svg is already used). Bars scale to the
// max value; the value sits above each bar and the label below.
export function BarChart({ data, height = 170, format = (v) => String(Math.round(v)) }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = 100 / data.length; // percent width per bar slot
  const chartH = height - 22; // leave room for the value label on top

  return (
    <View style={{ gap: spacing.xs }}>
      <Svg width="100%" height={height}>
        {data.map((d, i) => {
          const h = Math.max(2, (d.value / max) * chartH);
          const x = i * slot + slot * 0.18;
          const w = slot * 0.64;
          return (
            <Rect key={`b${i}`} x={`${x}%`} y={height - h} width={`${w}%`} height={h} rx={4} fill={colors.primary} />
          );
        })}
        {data.map((d, i) => (
          <SvgText
            key={`t${i}`}
            x={`${i * slot + slot / 2}%`}
            y={height - Math.max(2, (d.value / max) * chartH) - 6}
            fontSize={10}
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {format(d.value)}
          </SvgText>
        ))}
      </Svg>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={`l${i}`} style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    labels: { flexDirection: "row" },
    label: { ...typography.caption, color: colors.textFaint, flex: 1, textAlign: "center", fontSize: 10 },
  });
