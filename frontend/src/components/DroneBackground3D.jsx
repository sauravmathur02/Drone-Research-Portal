import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Clone } from '@react-three/drei';
import * as THREE from 'three';

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

/**
 * DroneBackground3D
 * Renders the actual mech_drone GLB on the LEFT side of the screen.
 * Since the model uses KHR_materials_pbrSpecularGlossiness (deprecated in Three.js r152+),
 * we apply custom metallic materials that give it a cinematic tactical appearance.
 */

const MODEL_PATH = '/models/mech_drone (1).glb';

function DroneMesh() {
  const groupRef = useRef();
  const { scene } = useGLTF(MODEL_PATH);
  const { viewport } = useThree();

  // Clone the scene and apply custom materials
  const processedScene = useMemo(() => {
    const clone = scene.clone(true);
    
    clone.traverse((child) => {
      if (child.isMesh) {
        const oldMat = child.material;
        
        // Grab whatever textures survived the load
        const diffuseMap = oldMat.map || oldMat.diffuseMap || null;
        
        child.material = new THREE.MeshPhysicalMaterial({
          // Use diffuse texture if available, else a neutral drone color
          map: diffuseMap,
          color: diffuseMap ? new THREE.Color('#ffffff') : new THREE.Color('#556677'),
          metalness: 0.7,
          roughness: 0.3,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2,
          transparent: true,
          opacity: 0.92,
          emissive: new THREE.Color('#003344'),
          emissiveIntensity: 0.3,
          envMapIntensity: 1.2,
        });
      }
    });
    
    return clone;
  }, [scene]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
      groupRef.current.position.y = -0.3 + Math.sin(Date.now() * 0.0004) * 0.1;
    }
  });

  // Position on the left side
  const xPos = -(viewport.width / 2) * 0.42;

  return (
    <group ref={groupRef} position={[xPos, -0.3, 0]} rotation={[0.2, 0.7, 0.05]}>
      <primitive object={processedScene} scale={0.018} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);

export default function DroneBackground3D() {
  const [hasError, setHasError] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const fn = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, []);

  if (hasError) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 25% 50%, rgba(0,229,255,0.05) 0%, transparent 50%)',
        }}
      />
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.4,
        }}
      >
        {isTabVisible && (
          <Canvas
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              failIfMajorPerformanceCaveat: false,
            }}
            camera={{ position: [0, 1.5, 8], fov: 45 }}
            style={{ width: '100%', height: '100%' }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 2.2;
              gl.domElement.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                setHasError(true);
              });
            }}
          >
            {/* Strong lighting for the drone to be clearly visible */}
            <ambientLight intensity={3} color="#ddeeff" />
            <directionalLight position={[5, 8, 5]} intensity={4} color="#ffffff" />
            <directionalLight position={[-8, 3, -3]} intensity={2.5} color="#00bbdd" />
            <pointLight position={[-6, 0, 5]} intensity={5} color="#00ddff" distance={25} />
            <pointLight position={[0, -3, 0]} intensity={2} color="#aaccdd" distance={20} />
            <ModelErrorBoundary fallback={null}>
              <Suspense fallback={null}>
                <DroneMesh />
              </Suspense>
            </ModelErrorBoundary>
          </Canvas>
        )}
      </div>

      {/* Gradient overlay — left side visible, fades to dark towards center/right */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'linear-gradient(to right, transparent 0%, transparent 25%, rgba(5,9,20,0.4) 45%, rgba(5,9,20,0.85) 65%), ' +
            'radial-gradient(ellipse at 50% 50%, transparent 15%, rgba(5,9,20,0.6) 60%)',
        }}
      />
    </>
  );
}
