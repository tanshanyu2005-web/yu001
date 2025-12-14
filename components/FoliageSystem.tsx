import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getChaosPosition, getTreePosition } from '../utils/geometry';

interface FoliageSystemProps {
  count: number;
  chaosLevel: number; // 0 (Tree) to 1 (Chaos)
}

// Custom Shader for performance
const vertexShader = `
  uniform float uTime;
  uniform float uChaos;
  uniform float uPixelRatio;

  attribute vec3 aPosTree;
  attribute vec3 aPosChaos;
  attribute float aRandom;

  varying float vAlpha;
  varying float vRandom;

  // Cubic Ease In Out for smoother transitions
  float ease(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    vRandom = aRandom;
    
    // Each particle has a slight offset in transition timing based on randomness
    float localChaos = clamp(uChaos * (1.2 + aRandom * 0.5) - (aRandom * 0.5), 0.0, 1.0);
    float t = ease(localChaos);

    vec3 pos = mix(aPosTree, aPosChaos, t);
    
    // Add subtle drift in chaos mode
    if (uChaos > 0.8) {
      pos.x += sin(uTime * 0.5 + aRandom * 10.0) * 0.2;
      pos.y += cos(uTime * 0.3 + aRandom * 10.0) * 0.2;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (4.0 * uPixelRatio) * (1.0 / -mvPosition.z);
    
    // Fade out slightly in chaos
    vAlpha = 1.0 - (uChaos * 0.3);
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying float vRandom;

  void main() {
    // Circular particle
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    // Gradient color: Deep Emerald to Pine
    vec3 colorA = vec3(0.0, 0.26, 0.15); // Emerald
    vec3 colorB = vec3(0.01, 0.13, 0.08); // Dark Pine
    vec3 colorC = vec3(0.8, 0.7, 0.4); // Subtle Gold Specular

    vec3 finalColor = mix(colorA, colorB, vRandom);
    
    // Add glitter/sparkle
    if (vRandom > 0.95) {
      finalColor = mix(finalColor, colorC, 0.8);
    }

    gl_FragColor = vec4(finalColor, vAlpha);
  }
`;

export const FoliageSystem: React.FC<FoliageSystemProps> = ({ count, chaosLevel }) => {
  const mesh = useRef<THREE.Points>(null);
  const uniforms = useRef({
    uTime: { value: 0 },
    uChaos: { value: 0 },
    uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 }
  });

  const { treePositions, chaosPositions, randoms } = useMemo(() => {
    const tPos = new Float32Array(count * 3);
    const cPos = new Float32Array(count * 3);
    const rands = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const tree = getTreePosition(i, count, 0.5);
      const chaos = getChaosPosition();

      tPos.set(tree, i * 3);
      cPos.set(chaos, i * 3);
      rands[i] = Math.random();
    }

    return { treePositions: tPos, chaosPositions: cPos, randoms: rands };
  }, [count]);

  useFrame((state) => {
    if (mesh.current && mesh.current.material) {
      uniforms.current.uTime.value = state.clock.elapsedTime;
      // Smooth interpolation for the uniforms is handled by the parent state, 
      // but we ensure it's passed here.
      uniforms.current.uChaos.value = chaosLevel;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position" // Used for initial bounding box mostly
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPosTree"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPosChaos"
          count={chaosPositions.length / 3}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};