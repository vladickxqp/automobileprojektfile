import { View } from "react-native";
import { CarSilhouette } from "./CarSilhouette";
import type { Car3DProps } from "./Car3D";

// Native fallback: the WebGL canvas is web-only, so on devices we show the blueprint silhouette.
// (A native expo-gl 3D path can replace this later.)
export function Car3D({ height = 200 }: Car3DProps) {
  return (
    <View style={{ width: "100%", height, alignItems: "center", justifyContent: "center" }}>
      <CarSilhouette width={280} height={120} />
    </View>
  );
}
