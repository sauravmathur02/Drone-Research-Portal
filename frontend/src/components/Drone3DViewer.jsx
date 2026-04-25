import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Grid, Html, Clone } from '@react-three/drei';

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

function Hotspot({ position, title, description, isActive }) {
  const [hovered, setHovered] = useState(false);

  // If we're not in Data Mode at all, the hotspot is completely hidden
  if (!isActive) return null;

  return (
    <mesh 
      position={position} 
      onPointerOver={() => setHovered(true)} 
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color={hovered ? "#ffffff" : "#00f3ff"} emissive={hovered ? "#ffffff" : "#00f3ff"} emissiveIntensity={2} transparent opacity={0.6} />
      
      {hovered && (
        <Html center position={[0, 0.3, 0]} className="pointer-events-none select-none">
          <div className="bg-black/80 backdrop-blur-md border border-neon/50 px-3 py-2 rounded shadow-[0_0_15px_rgba(0,243,255,0.2)] min-w-[150px]">
            <div className="text-neon font-data text-[10px] uppercase tracking-widest mb-1">{title}</div>
            <div className="text-white font-body text-xs leading-snug">{description}</div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function Model({ url }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(2, 2, 2), delta * 4);
    }
  });

  return <Clone ref={groupRef} object={scene} scale={0.01} />;
}

// Procedural Hologram for Quadcopters (Tactical, Nano, Swarm)
function QuadcopterHologram({ dataMode, drone }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 4);
    }
  });

  return (
    <group ref={groupRef} scale={0.01}>
      {/* Core Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 0.3, 1]} />
        <meshStandardMaterial color="#00f3ff" wireframe opacity={0.6} transparent emissive="#00f3ff" emissiveIntensity={0.5} />
      </mesh>
      
      <Hotspot isActive={dataMode} position={[0, 0.4, 0]} title="Central Payload Bay" description={`Capacity: ${drone.specs?.payload_kg || 0} kg`} />

      {/* Arms */}
      <mesh position={[0.7, 0, 0.7]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.5]} />
        <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.7, 0, -0.7]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.5]} />
        <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.7, 0, -0.7]} rotation={[0, -Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.5]} />
        <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.7, 0, 0.7]} rotation={[0, -Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.5]} />
        <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.8} />
      </mesh>

      {/* Rotors */}
      {[
        [1.2, 0.1, 1.2],
        [-1.2, 0.1, -1.2],
        [1.2, 0.1, -1.2],
        [-1.2, 0.1, 1.2]
      ].map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.4, 0.4, 0.05, 16]} />
          <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
        </mesh>
      ))}
      <Hotspot isActive={dataMode} position={[1.2, 0.4, 1.2]} title="Propulsion Sys" description={`Speed: ${drone.specs?.speed_kmh || 0} km/h`} />
    </group>
  );
}

// Procedural Hologram for Fixed Wing (MALE, HALE, Loitering)
function FixedWingHologram({ dataMode, drone }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 4);
    }
  });

  return (
    <group ref={groupRef} scale={0.01}>
      {/* Fuselage */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 3, 16]} />
        <meshStandardMaterial color="#00f3ff" wireframe opacity={0.6} transparent emissive="#00f3ff" emissiveIntensity={0.5} />
      </mesh>
      
      <Hotspot isActive={dataMode} position={[0, 0.4, 0.5]} title="Internal Bay" description={`Payload: ${drone.specs?.payload_kg || 0} kg`} />

      {/* Main Wings */}
      <mesh position={[0, 0.1, 0.2]}>
        <boxGeometry args={[4, 0.05, 0.8]} />
        <meshStandardMaterial color="#00f3ff" opacity={0.4} transparent emissive="#00f3ff" emissiveIntensity={0.4} />
      </mesh>
      
      <Hotspot isActive={dataMode} position={[1.8, 0.3, 0.2]} title="Aerodynamics" description={`Range: ${drone.specs?.range_km || 0} km max flyout`} />

      {/* V-Tail */}
      <mesh position={[-0.4, 0.3, -1.3]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1, 0.05, 0.4]} />
        <meshStandardMaterial color="#00f3ff" opacity={0.4} transparent emissive="#00f3ff" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.4, 0.3, -1.3]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[1, 0.05, 0.4]} />
        <meshStandardMaterial color="#00f3ff" opacity={0.4} transparent emissive="#00f3ff" emissiveIntensity={0.4} />
      </mesh>
      
      <Hotspot isActive={dataMode} position={[0, 0.6, -1.3]} title="V-Tail Assembly" description="Provides pitch & yaw stability" />

      {/* Sensor Pod */}
      <mesh position={[0, -0.3, 1.2]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#00ff66" emissive="#00ff66" emissiveIntensity={1} opacity={0.8} transparent />
      </mesh>

      {/* Engine glow */}
      <mesh position={[0, 0, -1.6]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function RangeIndicator({ rangeKm, isActive }) {
  const ringRef = useRef();
  
  // Normalize the range visual: 100km = ~1 unit radius, capped between 4 and 18 so it fits on screen nicely
  const normalizedRadius = Math.min(Math.max((rangeKm || 0) / 100, 4), 18);

  useFrame((state, delta) => {
    if (ringRef.current && isActive) {
      ringRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 2);
      ringRef.current.rotation.z -= delta * 0.1;
    } else if (ringRef.current && !isActive) {
      ringRef.current.scale.lerp(new THREE.Vector3(0.01, 0.01, 0.01), delta * 4);
    }
  });

  return (
    <mesh ref={ringRef} position={[0, -1.9, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.01}>
      <ringGeometry args={[normalizedRadius - 0.1, normalizedRadius, 64]} />
      <meshBasicMaterial color="#ff0055" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Drone3DViewer({ drone, dataMode }) {
  if (!drone) return null;

  const isQuadcopter = ['Tactical', 'Nano', 'Swarm'].includes(drone.type);

  return (
    <Canvas camera={{ position: [5, 4, 5], fov: 50 }}>
      {/* Background ambient color */}
      <color attach="background" args={['#030712']} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#00f3ff" />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} color="#0033ff" />

      {/* Futuristic floor grid */}
      <Grid 
        position={[0, -2, 0]} 
        args={[30, 30]} 
        cellSize={0.5} 
        cellThickness={1} 
        cellColor="#004466" 
        sectionSize={2.5} 
        sectionThickness={1.5} 
        sectionColor="#00f3ff" 
        fadeDistance={25} 
      />

      {/* Operational Range Ring Indicator */}
      <RangeIndicator rangeKm={drone.specs?.range_km} isActive={dataMode} />

      <Environment preset="city" />

      {drone.model_url ? (
        <ModelErrorBoundary fallback={
          isQuadcopter ? <QuadcopterHologram dataMode={dataMode} drone={drone} /> : <FixedWingHologram dataMode={dataMode} drone={drone} />
        }>
          <React.Suspense fallback={null}>
            <Model url={drone.model_url} />
          </React.Suspense>
        </ModelErrorBoundary>
      ) : (
        isQuadcopter ? <QuadcopterHologram dataMode={dataMode} drone={drone} /> : <FixedWingHologram dataMode={dataMode} drone={drone} />
      )}

      {/* Enable pan when users might want to look around, but limit distance */}
      <OrbitControls autoRotate={!dataMode} autoRotateSpeed={0.5} enablePan={true} maxPolarAngle={Math.PI / 2 + 0.1} maxDistance={15} minDistance={2} />
    </Canvas>
  );
}
