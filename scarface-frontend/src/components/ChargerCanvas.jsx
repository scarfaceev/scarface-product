import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function Concept() {
  const cable = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.45, -0.55, 0.27), new THREE.Vector3(0.75, -0.85, 0.5), new THREE.Vector3(0.55, -1.25, 0.65), new THREE.Vector3(0.1, -1.4, 0.55)]), 48, 0.035, 8), []);
  return (
    <group>
      <RoundedBox args={[1.2, 2, 0.5]} radius={0.16} smoothness={6}><meshPhysicalMaterial color="#f2f5f4" roughness={0.35} clearcoat={1} clearcoatRoughness={0.15} /></RoundedBox>
      <RoundedBox args={[0.92, 0.78, 0.05]} radius={0.07} smoothness={4} position={[0, 0.45, 0.26]}><meshStandardMaterial color="#0b1117" roughness={0.2} metalness={0.4} /></RoundedBox>
      <mesh position={[0, 0.45, 0.29]}><planeGeometry args={[0.46, 0.28]} /><meshBasicMaterial color="#19B5A5" /></mesh>
      <mesh position={[0, -0.15, 0.262]}><boxGeometry args={[0.7, 0.04, 0.02]} /><meshStandardMaterial color="#19B5A5" emissive="#19B5A5" emissiveIntensity={1.2} /></mesh>
      <RoundedBox args={[0.34, 0.3, 0.2]} radius={0.05} position={[0.45, -0.55, 0.3]}><meshStandardMaterial color="#1a252d" roughness={0.5} /></RoundedBox>
      <mesh geometry={cable}><meshStandardMaterial color="#10161b" roughness={0.6} /></mesh>
      <RoundedBox args={[0.18, 0.3, 0.14]} radius={0.04} position={[0.1, -1.4, 0.55]}><meshStandardMaterial color="#1a252d" roughness={0.4} metalness={0.3} /></RoundedBox>
    </group>
  );
}
function Model({ url }) { const { scene } = useGLTF(url); return <primitive object={scene} />; }
function Rig({ ctl, children }) {
  const g = useRef();
  useFrame((_, dt) => {
    if (ctl.auto) ctl.rot += dt * 18;
    const k = Math.min(1, dt * 8), t = (ctl.rot * Math.PI) / 180;
    g.current.rotation.y += (t - g.current.rotation.y) * k;
    g.current.scale.setScalar(g.current.scale.x + (ctl.zoom - g.current.scale.x) * k);
  });
  return <group ref={g}>{children}</group>;
}
export default function ChargerCanvas({ ctl, modelUrl }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.2, 5], fov: 35 }}>
      <color attach="background" args={["#0b1117"]} />
      <ambientLight intensity={0.35} /><directionalLight position={[3, 4, 4]} intensity={1.6} /><pointLight position={[-3, 1, -2]} intensity={8} color="#19B5A5" />
      <Environment resolution={256}><Lightformer form="rect" intensity={2} position={[0, 3, 3]} scale={[6, 2, 1]} /><Lightformer form="rect" intensity={1.2} position={[-4, 0, 2]} scale={[2, 5, 1]} /></Environment>
      <Rig ctl={ctl}><Suspense fallback={null}>{modelUrl ? <Model url={modelUrl} /> : <Concept />}</Suspense></Rig>
      <ContactShadows position={[0, -1.55, 0]} opacity={0.6} scale={8} blur={2.5} far={3} />
    </Canvas>
  );
}
