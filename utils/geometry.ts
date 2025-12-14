import * as THREE from 'three';

// Constants for Tree Shape
const TREE_HEIGHT = 16;
const TREE_RADIUS_BASE = 7;
const CHAOS_RADIUS = 25;

/**
 * Generates a random point inside a sphere (Chaos State)
 */
export const getChaosPosition = (): [number, number, number] => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  const r = Math.cbrt(Math.random()) * CHAOS_RADIUS;

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta) + 5; // Offset slightly up
  const z = r * Math.cos(phi);

  return [x, y, z];
};

/**
 * Generates a point on a conical spiral (Tree State)
 */
export const getTreePosition = (index: number, total: number, jitter: number = 0): [number, number, number] => {
  const y = (index / total) * TREE_HEIGHT;
  const radiusAtHeight = (1 - (y / TREE_HEIGHT)) * TREE_RADIUS_BASE;
  
  // Golden angle for organic spiral distribution
  const angle = index * 2.39996323; 
  
  const r = radiusAtHeight + (Math.random() - 0.5) * jitter;
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  
  // Center the tree vertically
  return [x, y - (TREE_HEIGHT / 2) + 2, z];
};

export const lerp3 = (v1: number[], v2: number[], alpha: number): [number, number, number] => {
  return [
    v1[0] + (v2[0] - v1[0]) * alpha,
    v1[1] + (v2[1] - v1[1]) * alpha,
    v1[2] + (v2[2] - v1[2]) * alpha
  ];
};