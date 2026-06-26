import Svg, { Line, Path, Rect } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";

// CarDNA mark — a stylised DNA double-helix (the car's "life record") in a rounded accent badge.
export function LogoMark({ size = 56, color, bg }: { size?: number; color?: string; bg?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.onPrimary;
  const b = bg ?? colors.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x={0} y={0} width={48} height={48} rx={13} fill={b} />
      <Path d="M17 11 C 31 19, 17 29, 31 37" stroke={c} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <Path d="M31 11 C 17 19, 31 29, 17 37" stroke={c} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <Line x1={19.5} y1={15} x2={28.5} y2={15} stroke={c} strokeWidth={2} strokeLinecap="round" />
      <Line x1={20} y1={24} x2={28} y2={24} stroke={c} strokeWidth={2} strokeLinecap="round" />
      <Line x1={19.5} y1={33} x2={28.5} y2={33} stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
