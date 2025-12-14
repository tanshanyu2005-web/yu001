import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getChaosPosition, getTreePosition } from '../utils/geometry';
import { THEME } from '../types';

interface InstancedOrnamentsProps {
  count: number;
  chaosLevel: number;
  type: 'ball' | 'gift' | 'light';
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const tempVec3 = new THREE.Vector3();
const tempVec3B = new THREE.Vector3();

export const InstancedOrnaments: React.FC<InstancedOrnamentsProps> = ({ count, chaosLevel, type }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Configuration based on type
  const config = useMemo(() => {
    switch (type) {
      case 'gift':
        return { 
          geo: new THREE.BoxGeometry(0.8, 0.8, 0.8),
          color: THEME.colors.accentGold,
          roughness: 0.2,
          metalness: 1.0,
          scaleBase: 1,
          weight: 0.05 // Heavy, slow
        };
      case 'light':
        return {
          geo: new THREE.SphereGeometry(0.15, 8, 8),
          color: THEME.colors.champagne,
          roughness: 0.0,
          metalness: 0.0,
          emissive: THEME.colors.champagne,
          emissiveIntensity: 2,
          scaleBase: 0.5,
          weight: 0.15 // Very light, fast
        };
      case 'ball':
      default:
        return {
          geo: new THREE.SphereGeometry(0.5, 32, 32),
          color: '#800020', // Deep Red variant for balls
          roughness: 0.1,
          metalness: 0.9,
          scaleBase: 1,
          weight: 0.08 // Medium
        };
    }
  }, [type]);

  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const treePos = getTreePosition(i, count, 0.2);
      const chaosPos = getChaosPosition();
      // Offset lights to be on the surface mostly
      if (type === 'light') {
         treePos[0] *= 1.1;
         treePos[2] *= 1.1;
      }
      return {
        treePos: new THREE.Vector3(...treePos),
        chaosPos: new THREE.Vector3(...chaosPos),
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        scale: Math.random() * 0.5 + 0.5
      };
    });
  }, [count, type]);

  useLayoutEffect(() => {
    if(meshRef.current) {
        // Initial set to avoid T-pose flicker
         data.forEach((d, i) => {
            tempObject.position.copy(d.treePos);
            tempObject.rotation.copy(d.rotation);
            tempObject.scale.setScalar(d.scale * config.scaleBase);
            tempObject.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObject.matrix);
            
            // Randomize colors slightly for visual richness
            if (type === 'ball') {
               const c = Math.random() > 0.5 ? THEME.colors.accentGold : '#800020';
               meshRef.current!.setColorAt(i, tempColor.set(c));
            } else {
               meshRef.current!.setColorAt(i, tempColor.set(config.color));
            }
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [data, config, type]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // We simulate weight by lagging the chaos level based on type weight
    // A heavier object reacts slower to the state change
    const time = state.clock.getElapsedTime();
    
    // Calculate an eased "current state" for this layer
    // Simple linear interpolation of the chaos factor towards the target, speed defined by weight
    // Note: In a real physics engine we'd use forces, but for this visual lerp is cleaner
    
    // We actually want deterministic position based on chaosLevel, but "dragged"
    // So we apply a curve to chaosLevel based on weight
    let activeChaos = chaosLevel;
    
    // Add "Weight" feel: Heavy objects linger in formed state longer, light objects fly away fast
    if (type === 'gift') {
       activeChaos = THREE.MathUtils.smoothstep(chaosLevel, 0.2, 0.8);
    } else if (type === 'light') {
       activeChaos = Math.pow(chaosLevel, 0.5); // Fly out immediately
    }

    data.forEach((d, i) => {
      // Lerp Position
      tempVec3.copy(d.treePos).lerp(d.chaosPos, activeChaos);

      // Add floating noise when in Chaos
      if (activeChaos > 0.1) {
         const floatSpeed = type === 'light' ? 2 : 0.5;
         tempVec3.y += Math.sin(time * floatSpeed + i) * 0.1 * activeChaos;
         tempVec3.x += Math.cos(time * 0.5 + i) * 0.1 * activeChaos;
         
         // Rotate objects in chaos
         tempObject.rotation.x = d.rotation.x + time * activeChaos * 0.5;
         tempObject.rotation.y = d.rotation.y + time * activeChaos * 0.5;
      } else {
         tempObject.rotation.copy(d.rotation);
      }

      tempObject.position.copy(tempVec3);
      tempObject.scale.setScalar(d.scale * config.scaleBase);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[config.geo, undefined, count]} castShadow receiveShadow>
      <meshStandardMaterial 
        color={config.color} 
        roughness={config.roughness}
        metalness={config.metalness}
        emissive={config.emissive || new THREE.Color(0,0,0)}
        emissiveIntensity={config.emissiveIntensity || 0}
        envMapIntensity={2.0}
      />
    </instancedMesh>
  );
};