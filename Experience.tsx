import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeState } from '../types';
import Foliage from './Foliage';
import Ornaments from './Ornaments';

interface ExperienceProps {
  treeState: TreeState;
}

const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  const [progress, setProgress] = useState(0);

  // Animation Loop for state transition
  useFrame((state, delta) => {
    const target = treeState === 'FORMED' ? 1 : 0;
    // Smooth dampening towards target state
    // Using a simple lerp logic with delta for frame independence
    const speed = 1.5;
    const newProgress = THREE.MathUtils.damp(progress, target, speed, delta);
    setProgress(newProgress);
  });

  return (
    <>
      {/* Cinematic Camera Controls */}
      <OrbitControls 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
        enablePan={false}
        maxDistance={35}
        minDistance={10}
        autoRotate={treeState === 'FORMED'}
        autoRotateSpeed={0.5}
      />

      {/* Luxury Lighting Setup */}
      <Environment preset="lobby" background={false} />
      
      <ambientLight intensity={0.2} color="#002010" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.25} 
        penumbra={1} 
        intensity={200} 
        color="#FFE5B4" 
        castShadow 
        shadow-bias={-0.0001}
      />
      <pointLight position={[-10, 5, -10]} intensity={50} color="#FFD700" />

      {/* The Tree Content */}
      <group position={[0, -4, 0]}>
        <Foliage progress={progress} />
        <Ornaments progress={progress} />
        
        {/* The Star - Only visible when formed mostly */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={[0, 10.5, 0]} scale={progress}>
            <dodecahedronGeometry args={[1.2, 0]} />
            <meshStandardMaterial 
              color="#FFD700" 
              emissive="#FFD700" 
              emissiveIntensity={2} 
              roughness={0} 
              metalness={1} 
            />
          </mesh>
        </Float>
      </group>

      {/* Floor Reflections */}
      <ContactShadows 
        opacity={0.7} 
        scale={40} 
        blur={2} 
        far={10} 
        resolution={256} 
        color="#000000" 
      />

      {/* Post Processing for the "Trump" Glow */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

export default Experience;
