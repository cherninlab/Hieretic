export type Layer = 'material' | 'void' | 'deep';

export interface Card {
  id: string;
  name: string;
  cost: {
    material: number;
    void: number;
  };
  layer: Layer;
  power: number;
  effects: Effect[];
}

export interface Effect {
  type: 'immediate' | 'echo' | 'manifest';
  power: number;
  description: string;
}

export interface GameState {
  id: string;
  players: Record<string, PlayerState>;
  currentPlayer: string;
  turn: number;
  phase: 'main' | 'combat' | 'end';
  layers: Record<Layer, LayerState>;
}

export interface PlayerState {
  hand: Card[];
  deck: string[]; // Card IDs
  resources: {
    material: number;
    void: number;
    deep: number;
  };
  health: number;
}

export interface LayerState {
  resources: number;
  activeEffects?: Effect[];
}
