import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getChaosPosition, getTreePosition } from '../utils/geometry';

interface PolaroidGalleryProps {
  count: number;
  chaosLevel: number;
}

// Simple texture loader simulation by coloring
// In a real app, we would load distinct textures
export const PolaroidGallery: React.FC<PolaroidGalleryProps> = ({ count, chaosLevel }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorRef = useRef<THREE.InstancedMesh>(null); // Inner photo part

  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const treePosRaw = getTreePosition(i, count, 0.1);
      // Push polaroids slightly outside foliage
      const treePos = new THREE.Vector3(treePosRaw[0] * 1.3, treePosRaw[1], treePosRaw[2] * 1.3);
      const chaosPos = new THREE.Vector3(...getChaosPosition());
      
      return {
        treePos,
        chaosPos,
        rotation: new THREE.Euler(0, -Math.atan2(treePos.z, treePos.x) + Math.PI / 2, 0), // Face outwards
        randomRot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        scale: 1.0 + Math.random() * 0.5
      };
    });
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current || !colorRef.current) return;
    const time = state.clock.getElapsedTime();
    const tempObj = new THREE.Object3D();

    data.forEach((d, i) => {
      const t = chaosLevel; // Linear for now
      
      const pos = new THREE.Vector3().copy(d.treePos).lerp(d.chaosPos, t);
      
      // Floating effect
      pos.y += Math.sin(time + i * 10) * 0.1 * t;

      // Rotation interpolation
      // Quaternions are better, but Euler lerp sufficient for this visual style if carefully handled
      // Actually, we switch rotation logic based on state
      if (t > 0.5) {
         // Tumble in chaos
         tempObj.rotation.set(
            d.randomRot.x + time * 0.2,
            d.randomRot.y + time * 0.2,
            d.randomRot.z
         );
      } else {
         // Gentle swing in tree mode
         tempObj.rotation.set(
            d.rotation.x + Math.sin(time * 2 + i) * 0.05,
            d.rotation.y,
            d.rotation.z + Math.cos(time * 1.5 + i) * 0.05
         );
      }

      tempObj.position.copy(pos);
      tempObj.scale.setScalar(d.scale);
      tempObj.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, tempObj.matrix);
      colorRef.current!.setMatrixAt(i, tempObj.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    colorRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* The White Frame */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1.2, 1.5, 0.05]} />
        <meshStandardMaterial color="#fffff0" roughness={0.9} />
      </instancedMesh>
      
      {/* The Inner Photo (Simulated black/glossy for now, or random colors) */}
      <instancedMesh ref={colorRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1.0, 1.0, 0.06]} /> {/* Slightly thicker to z-fight prevention */}
        <meshStandardMaterial 
            color="#222" 
            roughness={0.2} 
            metalness={0.5} 
            emissive="#111"
        /> 
      </instancedMesh>
    </group>
  );
};