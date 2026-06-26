import { Suspense } from "react";
import { View } from "react-native";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import { useTheme } from "../theme/ThemeProvider";
import type { Car3DProps } from "./Car3D";

// A real WebGL 3D car, built from primitives so it needs no external model asset. Glossy
// car-paint material + studio lighting + contact shadow; drag to orbit, gentle auto-rotate.
function CarModel({ paint, glass }: { paint: string; glass: string }) {
  const wheelPositions: [number, number][] = [
    [1.18, 0.82],
    [1.18, -0.82],
    [-1.18, 0.82],
    [-1.18, -0.82],
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* lower body */}
      <RoundedBox args={[3.9, 0.6, 1.75]} radius={0.22} smoothness={6} position={[0, 0.52, 0]} castShadow>
        <meshPhysicalMaterial color={paint} metalness={0.7} roughness={0.28} clearcoat={1} clearcoatRoughness={0.14} />
      </RoundedBox>
      {/* hood / boot deck wedge */}
      <RoundedBox args={[3.5, 0.42, 1.6]} radius={0.2} smoothness={6} position={[0, 0.86, 0]} castShadow>
        <meshPhysicalMaterial color={paint} metalness={0.7} roughness={0.3} clearcoat={1} clearcoatRoughness={0.16} />
      </RoundedBox>
      {/* greenhouse / cabin */}
      <RoundedBox args={[1.95, 0.6, 1.45]} radius={0.26} smoothness={6} position={[-0.15, 1.2, 0]} castShadow>
        <meshPhysicalMaterial color={glass} metalness={0.5} roughness={0.06} clearcoat={1} clearcoatRoughness={0.05} />
      </RoundedBox>
      {/* headlights */}
      <mesh position={[1.95, 0.6, 0.55]}>
        <boxGeometry args={[0.08, 0.16, 0.32]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <mesh position={[1.95, 0.6, -0.55]}>
        <boxGeometry args={[0.08, 0.16, 0.32]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {/* tail lights (accent) */}
      <mesh position={[-1.97, 0.62, 0]}>
        <boxGeometry args={[0.06, 0.14, 1.2]} />
        <meshStandardMaterial color={paint} emissive={paint} emissiveIntensity={1.3} toneMapped={false} />
      </mesh>

      {wheelPositions.map(([x, z], i) => (
        <group key={i} position={[x, 0.42, z]} rotation={[Math.PI / 2, 0, 0]}>
          {/* tyre */}
          <mesh castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.34, 32]} />
            <meshStandardMaterial color="#0c0d10" roughness={0.85} metalness={0.1} />
          </mesh>
          {/* rim */}
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.05, 24]} />
            <meshStandardMaterial color="#cfd4da" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Car3D({ paint, glass, height = 240, autoRotate = true }: Car3DProps) {
  const { colors } = useTheme();
  const bodyColor = paint ?? colors.carPaint;
  const glassColor = glass ?? colors.carGlass;

  return (
    <View style={{ width: "100%", height }}>
      <Canvas
        camera={{ position: [4.4, 2.3, 5.2], fov: 34 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow />
        <directionalLight position={[-6, 4, -4]} intensity={0.5} color={bodyColor} />
        <spotLight position={[0, 8, 0]} angle={0.5} penumbra={1} intensity={0.6} />
        <Suspense fallback={null}>
          <CarModel paint={bodyColor} glass={glassColor} />
          <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={11} blur={2.6} far={4.5} resolution={512} />
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[7, 3, 1]} color="#ffffff" />
            <Lightformer form="rect" intensity={1.2} position={[-5, 2, -3]} scale={[5, 2, 1]} color={bodyColor} />
            <Lightformer form="rect" intensity={1} position={[5, 3, -2]} scale={[4, 2, 1]} color="#9fb4ff" />
          </Environment>
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1.1}
          target={[0, 0.6, 0]}
          minPolarAngle={0.7}
          maxPolarAngle={1.45}
        />
      </Canvas>
    </View>
  );
}
