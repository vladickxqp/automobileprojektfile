import { useEffect, useRef } from "react";
import { Animated, Platform, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius as radii } from "../theme/tokens";

interface SkeletonProps {
  height?: number;
  width?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

// Gently pulsing placeholder block shown while data loads.
export function Skeleton({ height = 56, width = "100%", radius = radii.md, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const useNative = Platform.OS !== "web";
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: useNative }),
        Animated.timing(opacity, { toValue: 0.45, duration: 750, useNativeDriver: useNative }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ height, width, borderRadius: radius, backgroundColor: colors.surfaceAlt, opacity }, style]}
    />
  );
}
