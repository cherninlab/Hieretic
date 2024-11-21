import type { Card, Effect, Layer } from './cards';

export type GamePhase = 'init' | 'draw' | 'main' | 'combat' | 'end';

export interface GameAction {
  type: string;
  playerId: string;
  timestamp: number;
  data: any;
}

export interface GameEffect extends Effect {
  id: string;
  sourceCardId: string;
  sourceName: string;
  remainingDuration: number;
  affectedCardIds: string[];
}

export interface PlayerState {
  id: string;
  health: number;
  deck: string[]; // Card IDs
  hand: Card[];
  field: (Card | null)[];
  resources: {
    material: number;
    mind: number;
    void: number;
  };
  activeLayer: Layer;
  activeEffects?: GameEffect[];
}

export interface GameState {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  turn: number;
  phase: GamePhase;
  currentPlayer: string;
  players: Record<string, PlayerState>;
  activeEffects: GameEffect[];
  history: GameAction[];
  winner?: string;
  playerProfiles?: Record<string, any>;
}

export interface GameStateResponse {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  players: string[];
  currentPlayer: string;
  turn: number;
  phase: GamePhase;
  playerStates: Record<
    string,
    {
      health: number;
      deck: string[];
      hand: Card[];
      field: (Card | null)[];
      resources: {
        material: number;
        mind: number;
        void: number;
      };
      activeLayer: Layer;
    }
  >;
  activeEffects: GameEffect[];
  history: GameAction[];
}

export interface GameBoardProps {
  currentPlayer: string;
  opponentPlayer: string;
  playerField: (Card | null)[];
  opponentField: (Card | null)[];
  selectedCard: string | null;
  onCardPlay?: (cardId: string, position: number) => void;
  onAttack?: (attackerId: string, targetId: string) => void;
  onAbilityActivate?: (cardId: string, abilityIndex: number, targets: string[]) => void;
  isMyTurn: boolean;
  targetingMode: {
    type: 'ability' | 'attack';
    sourceId: string;
  } | null;
  currentPhase: GamePhase;
}

export type ActionValidator = (
  state: GameState,
  playerId: string,
  action: GameAction,
) => boolean | Promise<boolean>;

export type ActionHandler = (
  state: GameState,
  action: GameAction,
) => GameState | Promise<GameState>;
