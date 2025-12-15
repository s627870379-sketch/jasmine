import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom Shader for the Foliage to handle 10k+ particles efficiently
const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColorHigh: { value: new THREE.Color('#2ea85e') }, // Christmas Green
    uColorLow: { value: new THREE.Color('#0a3d1d') }, // Deep Green
    uAccent: { value: new THREE.Color('#D6001C') }, // Red Sparkles
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    uniform vec3 uColorHigh;
    uniform vec3 uColorLow;
    uniform vec3 uAccent;
    
    attribute vec3 aTarget;
    attribute vec3 aChaos;
    attribute float aRandom;
    
    varying vec3 vColor;
    varying float vAlpha;

    // Cubic easing for smoother transition
    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }

    void main() {
      float t = easeInOutCubic(uProgress);
      
      // Interpolate position
      vec3 pos = mix(aChaos, aTarget, t);
      
      // Add a subtle "breathing" wind effect when formed
      float wind = sin(uTime * 2.0 + pos.y * 0.5) * 0.1 * t;
      pos.x += wind;
      
      // Particle size logic
      float size = mix(1.5, 3.0, aRandom); // Random size
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (30.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;

      // Color logic based on height and randomness
      // Occasional Red specs (Ornaments/Berries/Magic)
      if (aRandom > 0.92) {
        vColor = uAccent; 
      } else {
        // Gradient from low green to high green
        vColor = mix(uColorLow, uColorHigh, aTarget.y / 15.0 + 0.5);
      }
      
      // Fade in/out slightly during chaos
      vAlpha = 0.6 + 0.4 * sin(uTime * aRandom * 5.0);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Circular particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      if(length(coord) > 0.5) discard;
      
      // Soft edge
      float strength = 1.0 - (length(coord) * 2.0);
      strength = pow(strength, 1.5);

      gl_FragColor = vec4(vColor, strength * vAlpha);
    }
  `
};

interface FoliageProps {
  count?: number;
  progress: number;
}

const Foliage: React.FC<FoliageProps> = ({ count = 15000, progress }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { attributes } = useMemo(() => {
    const chaosPositions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    const radius = 6;
    const height = 16;

    for (let i = 0; i < count; i++) {
      // Chaos: Random sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = Math.cbrt(Math.random()) * 25; // Large explosion radius
      
      const cx = r * Math.sin(phi) * Math.cos(theta);
      const cy = r * Math.sin(phi) * Math.sin(theta);
      const cz = r * Math.cos(phi);

      chaosPositions[i * 3] = cx;
      chaosPositions[i * 3 + 1] = cy;
      chaosPositions[i * 3 + 2] = cz;

      // Target: Cone (Tree) distribution
      // Dense at bottom, thin at top
      const y = Math.random() * height; // 0 to height
      const coneRadius = (1 - y / height) * radius;
      // Spiral distribution for better coverage
      const angle = i * 0.1 + Math.random(); 
      const rDist = Math.sqrt(Math.random()) * coneRadius;
      
      const tx = Math.cos(angle) * rDist;
      const ty = y - (height / 2) + 2; // Center vertically somewhat
      const tz = Math.sin(angle) * rDist;

      targetPositions[i * 3] = tx;
      targetPositions[i * 3 + 1] = ty;
      targetPositions[i * 3 + 2] = tz;

      randoms[i] = Math.random();
    }

    return {
      attributes: {
        aChaos: new THREE.BufferAttribute(chaosPositions, 3),
        aTarget: new THREE.BufferAttribute(targetPositions, 3),
        aRandom: new THREE.BufferAttribute(randoms, 1),
      }
    };
  }, [count]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Smoothly interpolate uniform update could happen here, but we pass it directly
      materialRef.current.uniforms.uProgress.value = progress;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-aChaos" {...attributes.aChaos} />
        <bufferAttribute attach="attributes-aTarget" {...attributes.aTarget} />
        <bufferAttribute attach="attributes-aRandom" {...attributes.aRandom} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        attach="material"
        args={[FoliageMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Foliage;
