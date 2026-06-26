import { Suspense } from "react";
import { View } from "react-native";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import { useTheme } from "../theme/ThemeProvider";
import type { Car3DProps } from "./Car3D";

// A real WebGL 3D car built from primitives (no external model asset, works offline). Shaped like a
// low sports coupé: stepped body, raked greenhouse, wheel wells and spoked rims. Glossy car-paint
// material + studio lighting + contact shadow; drag to orbit, gentle auto-rotate.

function Wheel({ x, z }: { x: number; z: number }) {
  const spokes = [0, 1, 2, 3, 4];
  return (
    <group position={[x, 0.5, z]} rotation={[Math.PI / 2, 0, 0]}>
      {/* tyre */}
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.36, 40]} />
        <meshStandardMaterial color="#0b0c0f" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* rim dish */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.04, 32]} />
        <meshStandardMaterial color="#d7dce2" metalness={0.95} roughness={0.22} />
      </mesh>
      {/* spokes */}
      {spokes.map((i) => (
        <mesh key={i} position={[0, 0.2, 0]} rotation={[0, (i / spokes.length) * Math.PI, 0]}>
          <boxGeometry args={[0.06, 0.05, 0.5]} />
          <meshStandardMaterial color="#b9c0c8" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {/* hub cap */}
      <mesh position={[0, 0.215, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.06, 16]} />
        <meshStandardMaterial color="#5f656d" metalness={0.8} roughness={0.4} />
      </mesh>
    </group>
  );
}

function CarModel({ paint, glass }: { paint: string; glass: string }) {
  const wheels: [number, number][] = [
    [1.4, 0.86],
    [1.4, -0.86],
    [-1.4, 0.86],
    [-1.4, -0.86],
  ];
  const paintMat = (
    <meshPhysicalMaterial color={paint} metalness={0.7} roughness={0.27} clearcoat={1} clearcoatRoughness={0.13} />
  );
  const glassMat = (
    <meshPhysicalMaterial color={glass} metalness={0.5} roughness={0.06} clearcoat={1} clearcoatRoughness={0.04} />
  );

  return (
    <group position={[0, 0, 0]}>
      {/* lower body */}
      <RoundedBox args={[4.3, 0.5, 1.85]} radius={0.26} smoothness={6} position={[0, 0.5, 0]} castShadow>
        {paintMat}
      </RoundedBox>
      {/* shoulder line (slightly narrower upper) */}
      <RoundedBox args={[4.05, 0.42, 1.72]} radius={0.26} smoothness={6} position={[0, 0.8, 0]} castShadow>
        {paintMat}
      </RoundedBox>
      {/* hood — sloped down toward the nose */}
      <RoundedBox args={[1.3, 0.3, 1.66]} radius={0.14} smoothness={6} position={[1.4, 0.86, 0]} rotation={[0, 0, -0.09]} castShadow>
        {paintMat}
      </RoundedBox>
      {/* rear deck */}
      <RoundedBox args={[1.05, 0.32, 1.66]} radius={0.14} smoothness={6} position={[-1.55, 0.88, 0]} castShadow>
        {paintMat}
      </RoundedBox>
      {/* greenhouse / cabin */}
      <RoundedBox args={[2.0, 0.5, 1.4]} radius={0.3} smoothness={6} position={[-0.15, 1.12, 0]} castShadow>
        {glassMat}
      </RoundedBox>
      {/* raked windshield */}
      <RoundedBox args={[0.7, 0.5, 1.36]} radius={0.08} smoothness={5} position={[0.82, 1.02, 0]} rotation={[0, 0, 0.55]}>
        {glassMat}
      </RoundedBox>
      {/* rear glass */}
      <RoundedBox args={[0.7, 0.46, 1.36]} radius={0.08} smoothness={5} position={[-1.08, 1.04, 0]} rotation={[0, 0, -0.62]}>
        {glassMat}
      </RoundedBox>

      {/* headlights */}
      {[0.62, -0.62].map((z) => (
        <mesh key={z} position={[2.0, 0.62, z]}>
          <boxGeometry args={[0.08, 0.16, 0.34]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.7} toneMapped={false} />
        </mesh>
      ))}
      {/* full-width tail light bar */}
      <mesh position={[-2.04, 0.66, 0]}>
        <boxGeometry args={[0.06, 0.14, 1.32]} />
        <meshStandardMaterial color={paint} emissive={paint} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* front splitter + rear diffuser */}
      <mesh position={[2.0, 0.28, 0]}>
        <boxGeometry args={[0.4, 0.08, 1.7]} />
        <meshStandardMaterial color="#141414" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[-2.05, 0.3, 0]}>
        <boxGeometry args={[0.3, 0.12, 1.6]} />
        <meshStandardMaterial color="#141414" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* wheel wells (dark recess behind each wheel) + wheels */}
      {wheels.map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, 0.5, z * 0.82]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.62, 0.62, 0.34, 32]} />
            <meshStandardMaterial color="#08090a" roughness={1} metalness={0} />
          </mesh>
          <Wheel x={x} z={z} />
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
        camera={{ position: [4.9, 2.3, 5.7], fov: 32 }}
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
          <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={12} blur={2.6} far={5} resolution={512} />
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[8, 3, 1]} color="#ffffff" />
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
