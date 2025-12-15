import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrnamentData } from '../types';

interface OrnamentGroupProps {
  progress: number;
}

// Reusable geometry and material
const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

// Luxury Materials - Neutral Base for coloring
const shinyMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff', // White base to allow full tinting
  metalness: 0.9,
  roughness: 0.1,
  envMapIntensity: 2
});

const matteMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff', // White base
  metalness: 0.3,
  roughness: 0.6,
  envMapIntensity: 0.5
});

const lightMaterial = new THREE.MeshStandardMaterial({
  color: '#FFFFE0',
  emissive: '#FFD700',
  emissiveIntensity: 3,
  toneMapped: false
});

const Ornaments: React.FC<OrnamentGroupProps> = ({ progress }) => {
  // We separate instances by type to use different geometries/materials
  const ballsRef = useRef<THREE.InstancedMesh>(null);
  const boxesRef = useRef<THREE.InstancedMesh>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);

  // Generate data once
  const { balls, boxes, lights } = useMemo(() => {
    const _balls: OrnamentData[] = [];
    const _boxes: OrnamentData[] = [];
    const _lights: OrnamentData[] = [];

    const generatePos = (type: 'ball' | 'box' | 'light', i: number): OrnamentData => {
      // Chaos position
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 15 + Math.random() * 15;
      const chaos = [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ] as [number, number, number];

      // Target position
      const height = 16;
      const treeRadius = 6;
      let y = Math.random() * height * 0.9; // Avoid very top
      if (type === 'box') y = Math.random() * 4; // Boxes at bottom mostly
      
      const coneR = (1 - y / height) * treeRadius;
      const angle = Math.random() * Math.PI * 2;
      
      // Ornaments sit ON the surface, lights slightly inside
      const offset = type === 'light' ? 0.8 : 1.0; 
      const tx = Math.cos(angle) * coneR * offset;
      const tz = Math.sin(angle) * coneR * offset;
      const ty = y - (height / 2) + 2;

      // Scale
      let s = 1;
      let speed = 1;
      
      if (type === 'box') {
        s = 0.5 + Math.random() * 0.5;
        speed = 1.0; // Heavy, moves slow (simulated by logic below)
      } else if (type === 'ball') {
        s = 0.3 + Math.random() * 0.3;
        speed = 2.0; // Medium
      } else {
        s = 0.15;
        speed = 3.0; // Light, moves fast
      }

      return {
        id: i,
        position: { chaos, target: [tx, ty, tz] },
        scale: s,
        color: '', // handled by material/instance color
        speed,
        type
      };
    };

    for (let i = 0; i < 150; i++) _balls.push(generatePos('ball', i));
    for (let i = 0; i < 50; i++) _boxes.push(generatePos('box', i));
    for (let i = 0; i < 300; i++) _lights.push(generatePos('light', i));

    return { balls: _balls, boxes: _boxes, lights: _lights };
  }, []);

  const tempObj = new THREE.Object3D();

  useFrame((state) => {
    // Easing function
    const ease = (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const targetProgress = ease(progress);

    const updateMesh = (ref: React.RefObject<THREE.InstancedMesh>, data: OrnamentData[]) => {
      if (!ref.current) return;
      
      data.forEach((item, i) => {
        // Individual speed lag logic
        // If progress is 1, everyone arrives eventually. 
        // We modify the effective 't' based on item weight/speed.
        const t = targetProgress; 
        
        const cx = item.position.chaos[0];
        const cy = item.position.chaos[1];
        const cz = item.position.chaos[2];

        const tx = item.position.target[0];
        const ty = item.position.target[1];
        const tz = item.position.target[2];

        // Lerp
        tempObj.position.set(
          THREE.MathUtils.lerp(cx, tx, t),
          THREE.MathUtils.lerp(cy, ty, t),
          THREE.MathUtils.lerp(cz, tz, t)
        );

        // Rotation: Spin wildly in chaos, stabilize in target
        const spin = (1 - t) * 5 * state.clock.elapsedTime;
        tempObj.rotation.set(spin + i, spin + i, spin);
        
        // Scale: pop in/out slightly
        const scalePhase = t * item.scale; 
        tempObj.scale.set(scalePhase, scalePhase, scalePhase);

        tempObj.updateMatrix();
        ref.current!.setMatrixAt(i, tempObj.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    };

    updateMesh(ballsRef, balls);
    updateMesh(boxesRef, boxes);
    updateMesh(lightsRef, lights);
  });

  // Set colors initially
  useLayoutEffect(() => {
    const color = new THREE.Color();
    // Balls: Shiny Red and Green
    balls.forEach((item, i) => {
      if (Math.random() > 0.4) color.set('#D6001C'); // Vibrant Christmas Red
      else color.set('#008f39'); // Rich Christmas Green
      ballsRef.current!.setColorAt(i, color);
    });
    ballsRef.current!.instanceColor!.needsUpdate = true;

    // Boxes: Matte Green and Red
    boxes.forEach((item, i) => {
      if (Math.random() > 0.5) color.set('#2F5A39'); // Darker Pine Green
      else color.set('#8B0000'); // Dark Red
      boxesRef.current!.setColorAt(i, color);
    });
    boxesRef.current!.instanceColor!.needsUpdate = true;
    
    // Lights are all warm white (handled by material emissive, but base color too)
    lights.forEach((item, i) => {
        color.set('#FFFFE0');
        lightsRef.current!.setColorAt(i, color);
    })
    lightsRef.current!.instanceColor!.needsUpdate = true;

  }, [balls, boxes, lights]);

  return (
    <group>
      <instancedMesh ref={ballsRef} args={[sphereGeo, shinyMaterial, balls.length]} castShadow receiveShadow />
      <instancedMesh ref={boxesRef} args={[boxGeo, matteMaterial, boxes.length]} castShadow receiveShadow />
      <instancedMesh ref={lightsRef} args={[sphereGeo, lightMaterial, lights.length]} />
    </group>
  );
};

export default Ornaments;
