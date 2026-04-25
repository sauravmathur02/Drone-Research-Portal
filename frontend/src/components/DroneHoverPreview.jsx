import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Clone } from '@react-three/drei';

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

function Model({ url }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
      groupRef.current.scale.lerp(new THREE.Vector3(2.5, 2.5, 2.5), delta * 4);
    }
  });

  return <Clone ref={groupRef} object={scene} scale={0.01} />;
}

export default function DroneHoverPreview({ drone }) {
  if (!drone || !drone.model_url) return null;

  return (
    <div className="w-full h-full pointer-events-none">
      <Canvas camera={{ position: [0, 1.5, 4], fov: 35 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
        <Environment preset="night" />
        <ModelErrorBoundary fallback={null}>
          <React.Suspense fallback={null}>
            <Model url={drone.model_url} />
          </React.Suspense>
        </ModelErrorBoundary>
      </Canvas>
    </div>
  );
}
