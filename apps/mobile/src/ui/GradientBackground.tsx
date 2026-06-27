import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";

// Full-bleed aurora gradient backdrop. Starts at the base background (so it blends with the header),
// glows violet in the upper third, then darkens toward the bottom. Falls back to a solid colour if
// the gradient can't render.
export function GradientBackground() {
  const { colors } = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="auroraBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.background} />
            <Stop offset="35%" stopColor={colors.heroTop} />
            <Stop offset="100%" stopColor={colors.heroBottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#auroraBg)" />
      </Svg>
    </View>
  );
}
