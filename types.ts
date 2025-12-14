import { Vector3, Color } from 'three';

export enum InteractionState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface ParticleSystemProps {
  count: number;
  interactionState: InteractionState;
  chaosFactor: number; // 0 to 1
}

export interface OrnamentData {
  id: number;
  positionTree: [number, number, number];
  positionChaos: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  type: 'gift' | 'ball' | 'light' | 'polaroid';
  weight: number; // Determines speed of interpolation
}

export const THEME = {
  colors: {
    primaryGreen: '#004225', // Deep Emerald
    accentGold: '#FFD700', // High Gloss Gold
    champagne: '#F7E7CE',
    darkPine: '#012115',
    ivory: '#FFFFF0'
  }
};