import Svg, { Circle, Line, Path } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Blueprint-style side silhouette of a car — the app's signature "instrument" graphic.
 * Line-art (stroke only) so it reads as a clean technical drawing, with the orange accent on the
 * roofline and brake discs. (A full interactive 3D model via react-three-fiber is a separate step.)
 */
export function CarSilhouette({ width = 240, height = 104 }: { width?: number; height?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={width} height={height} viewBox="0 0 280 120" fill="none">
      <Line x1="30" y1="96" x2="262" y2="96" stroke={colors.border} strokeWidth={2} />
      {/* body + roofline */}
      <Path
        d="M20,86 C16,73 28,68 44,66 L102,40 C118,31 146,28 174,30 L212,37 C240,42 258,56 264,82"
        stroke={colors.primary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="44" y1="86" x2="262" y2="86" stroke={colors.textMuted} strokeWidth={2} opacity={0.6} />
      {/* greenhouse / windows */}
      <Path
        d="M80,48 L106,34 L152,33 L160,50"
        stroke={colors.textMuted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="128" y1="33" x2="130" y2="50" stroke={colors.textMuted} strokeWidth={1.5} opacity={0.7} />
      {/* wheels with brake-disc accent */}
      <Circle cx="86" cy="92" r="19" stroke={colors.text} strokeWidth={3} />
      <Circle cx="86" cy="92" r="7" stroke={colors.primary} strokeWidth={2.5} />
      <Circle cx="208" cy="92" r="19" stroke={colors.text} strokeWidth={3} />
      <Circle cx="208" cy="92" r="7" stroke={colors.primary} strokeWidth={2.5} />
    </Svg>
  );
}
