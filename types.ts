export type TreeState = 'CHAOS' | 'FORMED';

export interface DualPosition {
  chaos: [number, number, number];
  target: [number, number, number];
}

export interface OrnamentData {
  id: number;
  position: DualPosition;
  scale: number;
  color: string;
  speed: number; // For weight simulation
  type: 'box' | 'ball' | 'light';
}
