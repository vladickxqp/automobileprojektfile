import { Image, StyleSheet, View, type DimensionValue } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { radius as radii } from "../theme/tokens";
import { CarSilhouette } from "./CarSilhouette";

interface CarPhotoProps {
  uri?: string | null;
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

// Shows the vehicle photo, or a clean silhouette placeholder when none was uploaded.
export function CarPhoto({ uri, width = "100%", height = 200, radius = radii.lg }: CarPhotoProps) {
  const { colors } = useTheme();
  const box = { width, height, borderRadius: radius, backgroundColor: colors.surfaceAlt, overflow: "hidden" as const };

  if (uri) {
    return <Image source={{ uri }} style={box} resizeMode="cover" />;
  }
  const silW = typeof width === "number" ? Math.max(60, Math.min(width - 16, 260)) : 260;
  return (
    <View style={[box, styles.center]}>
      <CarSilhouette width={silW} height={Math.max(36, height - 28)} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
