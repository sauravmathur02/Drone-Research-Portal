import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Grid, Html, Center } from '@react-three/drei';

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ─── Shared sub-components ──────────────────────────────────────────────────

function CounterHotspot({ position, title, description, isActive }) {
  const [hovered, setHovered] = React.useState(false);
  if (!isActive) return null;
  return (
    <mesh
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial
        color={hovered ? '#ffffff' : '#ff9933'}
        emissive={hovered ? '#ffffff' : '#ff9933'}
        emissiveIntensity={2}
        transparent
        opacity={0.7}
      />
      {hovered && (
        <Html center position={[0, 0.3, 0]} className="pointer-events-none select-none">
          <div className="bg-black/80 backdrop-blur-md border border-warning/50 px-3 py-2 rounded shadow-[0_0_15px_rgba(255,153,0,0.2)] min-w-[150px]">
            <div className="text-warning font-data text-[10px] uppercase tracking-widest mb-1">{title}</div>
            <div className="text-white font-body text-xs leading-snug">{description}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function AutoCenteredModel({ url }) {
  const { scene } = useGLTF(url);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    if (scene) {
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 3.5;
      setScale(targetSize / (maxDim || 1));

      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.envMapIntensity = 1.2;
          }
        }
      });
    }
  }, [scene]);

  return (
    <group scale={scale}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

// ─── Hologram: Turret / Missile Battery (Laser, Missile, Interceptor) ───────

function TurretHologram({ dataMode, system }) {
  const groupRef = useRef();
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 4);
    }
  });

  const color = '#ff9933'; // orange for defensive systems

  return (
    <group ref={groupRef} scale={0.01}>
      {/* Base Platform */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.5, 16]} />
        <meshStandardMaterial color={color} wireframe opacity={0.4} transparent emissive={color} emissiveIntensity={0.3} />
      </mesh>

      {/* Rotation Ring */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.3, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>

      {/* Turret Body */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.2, 0.8, 0.8]} />
        <meshStandardMaterial color={color} wireframe opacity={0.5} transparent emissive={color} emissiveIntensity={0.4} />
      </mesh>

      <CounterHotspot
        isActive={dataMode}
        position={[0, 0.8, 0]}
        title="Tracking System"
        description={`Effective range: ${system.range_km} km`}
      />

      {/* Barrel Pair */}
      <mesh position={[0.3, 0.2, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1.4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-0.3, 0.2, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1.4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>

      {/* Radar Dish */}
      <mesh position={[0, 1.0, -0.2]} rotation={[0.4, 0, 0]}>
        <sphereGeometry args={[0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} wireframe opacity={0.5} transparent emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <CounterHotspot
        isActive={dataMode}
        position={[0, 1.8, -0.2]}
        title="Radar Array"
        description={`Effectiveness: ${system.effectiveness}`}
      />

      {/* Muzzle glow */}
      <mesh position={[0, 0.2, 1.5]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={3} />
      </mesh>

      {/* Tracks / Wheels */}
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={i} position={[x, -0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 12]} />
          <meshStandardMaterial color={color} opacity={0.3} transparent />
        </mesh>
      ))}
    </group>
  );
}

// ─── Hologram: EW / Jamming Tower ────────────────────────────────────────────

function JammingHologram({ dataMode, system }) {
  const groupRef = useRef();
  const antennaRef = useRef();
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 4);
    }
    if (antennaRef.current) {
      antennaRef.current.rotation.y -= delta * 2; // counter-spin the dish
    }
  });

  const color = '#ff9933';

  return (
    <group ref={groupRef} scale={0.01}>
      {/* Base */}
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[1.5, 0.4, 1.5]} />
        <meshStandardMaterial color={color} wireframe opacity={0.4} transparent emissive={color} emissiveIntensity={0.3} />
      </mesh>

      {/* Central Tower */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 3, 12]} />
        <meshStandardMaterial color={color} wireframe opacity={0.5} transparent emissive={color} emissiveIntensity={0.4} />
      </mesh>

      {/* Emitter Ring 1 */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.0, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>
      {/* Emitter Ring 2 */}
      <mesh position={[0, 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} side={THREE.DoubleSide} transparent opacity={0.35} />
      </mesh>

      <CounterHotspot
        isActive={dataMode}
        position={[0, 2.2, 0]}
        title="EW Jamming Dish"
        description={`Range: ${system.range_km} km signal disruption`}
      />

      {/* Spinning Parabolic Dish */}
      <group ref={antennaRef} position={[0, 2.0, 0]}>
        <mesh>
          <sphereGeometry args={[0.6, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} wireframe opacity={0.6} transparent emissive={color} emissiveIntensity={0.6} />
        </mesh>
        {/* Dish glow core */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={4} />
        </mesh>
      </group>

      {/* Side Antenna Pair */}
      {[-0.9, 0.9].map((x, i) => (
        <group key={i} position={[x, 0.5, 0]}>
          <mesh rotation={[0, 0, i === 0 ? -0.3 : 0.3]}>
            <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
          <CounterHotspot
            isActive={dataMode}
            position={[0, 1.1, 0]}
            title="Phased Array"
            description={`Effectiveness: ${system.effectiveness}`}
          />
        </group>
      ))}
    </group>
  );
}

// ─── Range Indicator (defensive envelope ring) ───────────────────────────────

function DefenseEnvelope({ rangeKm, isActive }) {
  const ringRef = useRef();
  const normalizedRadius = Math.min(Math.max((rangeKm || 0) / 2, 5), 20);

  useFrame((state, delta) => {
    if (ringRef.current && isActive) {
      ringRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 2);
      ringRef.current.rotation.z += delta * 0.05;
    } else if (ringRef.current && !isActive) {
      ringRef.current.scale.lerp(new THREE.Vector3(0.01, 0.01, 0.01), delta * 4);
    }
  });

  return (
    <mesh ref={ringRef} position={[0, -1.9, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.01}>
      <ringGeometry args={[normalizedRadius - 0.15, normalizedRadius, 64]} />
      <meshBasicMaterial color="#ff9933" transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Main Viewer ─────────────────────────────────────────────────────────────

export default function Counter3DViewer({ system, dataMode, mini = false }) {
  if (!system) return null;

  const isJammer = system.type === 'Jamming';

  return (
    <Canvas camera={{ position: mini ? [4, 3, 4] : [5, 4, 5], fov: 50 }} shadows>
      {!mini && <color attach="background" args={['#030712']} />}

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ff9933" />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} color="#ff6600" />

      {!mini && (
        <Grid
          position={[0, -2, 0]}
          args={[30, 30]}
          cellSize={0.5}
          cellThickness={1}
          cellColor="#442200"
          sectionSize={2.5}
          sectionThickness={1.5}
          sectionColor="#ff9933"
          fadeDistance={25}
        />
      )}

      {!mini && <DefenseEnvelope rangeKm={system.range_km} isActive={dataMode} />}

      <Environment preset="city" environmentIntensity={0.8} />

      {system.model_url ? (
        <ModelErrorBoundary fallback={
          isJammer ? <JammingHologram dataMode={dataMode} system={system} /> : <TurretHologram dataMode={dataMode} system={system} />
        }>
          <React.Suspense fallback={null}>
            <AutoCenteredModel url={system.model_url} />
          </React.Suspense>
        </ModelErrorBoundary>
      ) : isJammer ? (
        <JammingHologram dataMode={dataMode} system={system} />
      ) : (
        <TurretHologram dataMode={dataMode} system={system} />
      )}

      {/* Dynamic spot check for high-detail areas */}
      <spotLight position={[5, 10, 5]} angle={0.25} penumbra={1} intensity={2} color="#ff9933" castShadow />

      <OrbitControls
        autoRotate={!dataMode}
        autoRotateSpeed={mini ? 1.5 : 0.5}
        enablePan={!mini}
        enableZoom={!mini}
        maxPolarAngle={Math.PI / 2 + 0.1}
        maxDistance={mini ? 10 : 15}
        minDistance={2}
      />
    </Canvas>
  );
}
