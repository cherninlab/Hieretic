import type { Card, Effect, Layer, ResourceState, PhaseType } from './cards';
import type { UserProfile } from './user';

// Game Status and Phases
export type GameStatus = 'waiting' | 'active' | 'finished';

// Player State
export interface PlayerState {
  id: string;
  health: number;
  deck: string[];
  hand: Card[];
  field: (Card | null)[];
  resources: ResourceState;
  activeLayer: Layer;
  activeEffects: GameEffect[];
}

// Game Effect
export interface GameEffect extends Effect {
  sourceId: string;
  sourceName: string;
  remainingDuration: number;
  affectedCardIds: string[];
}

// Game Action
export interface GameAction {
  type: string;
  playerId: string;
  timestamp: number;
  data: Record<string, any>;
}

// Core Game State
export interface GameState {
  id: string;
  status: GameStatus;
  turn: number;
  phase: PhaseType;
  currentPlayer: string;
  players: Record<string, PlayerState>;
  playerProfiles: Record<string, UserProfile>;
  activeEffects: GameEffect[];
  history: GameAction[];
  createdBy: string;
  created: number;
  startedAt?: number;
  finishedAt?: number;
  winner?: string;
  lastAccessed?: number;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Game Events
export interface GameEvent {
  type: string;
  playerId?: string;
  targetId?: string;
  cardId?: string;
  sourceId?: string;
  timestamp: number;
  data?: Record<string, any>;
  resources?: ResourceState;
  controllerId?: string;
  duration?: number;
  value?: number;
}

// Targeting System
export interface TargetingMode {
  type: 'ability' | 'attack' | 'play';
  sourceId: string;
  validTargets: number[];
  abilityIndex?: number;
}

// Resource Management
export interface ResourceRequirement {
  material: number;
  mind: number;
}

export interface ResourceGeneration {
  current: ResourceState;
  basePerTurn: ResourceState;
  bonuses: ResourceState;
}

// Game Statistics
export interface GameStats {
  playerStats: Record<string, PlayerStats>;
  turnCount: number;
  gameStartTime: number;
  gameEndTime?: number;
}

export interface PlayerStats {
  cardsPlayed: number;
  damageDealt: number;
  resourcesGained: number;
  effectsTriggered: number;
}

// Add these interfaces to game.ts

export interface BoardState {
  selectedCard: string | null;
  targetingMode: TargetingMode | null;
  validPlayPositions: number[];
  highlightedPositions: number[];
  playerField: (Card | null)[];
  opponentField: (Card | null)[];
}

export interface BoardActions {
  selectCard: (cardId: string | null) => void;
  playCard: (position: number) => Promise<void>;
  initiateAttack: (attackerId: string) => void;
  initiateAbility: (cardId: string, abilityIndex: number) => void;
  handleFieldSlotClick: (position: number, isOpponent: boolean) => Promise<void>;
  cancelTargeting: () => void;
}

export interface ResourceManager {
  currentResources: ResourceState;
  pendingCosts: ResourceState;
  generation: ResourceGeneration;
  canPlayCard: (card: Card) => boolean;
  getResourceRequirement: (card: Card) => ResourceRequirement;
  spendResources: (costs: Partial<ResourceState>) => Promise<void>;
  addResources: (gained: Partial<ResourceState>) => void;
  calculateResourceUsage: (cards: Card[]) => ResourceState;
}

export interface GameSyncState {
  gameState: GameState | null;
  isLoading: boolean;
  error: Error | null;
  currentPlayerId: string | null;
  opponentId: string | null;
  isMyTurn: boolean;
  currentPhase: PhaseType;
  currentLayer: Layer;
}

export interface GameSyncActions {
  refreshState: () => Promise<void>;
  playCard: (cardId: string, position: number) => Promise<void>;
  activateAbility: (cardId: string, abilityIndex: number, targets: string[]) => Promise<void>;
  changePhase: (phase: PhaseType) => Promise<void>;
  changeLayer: (layer: Layer) => Promise<void>;
  endTurn: () => Promise<void>;
}

export type CardWithAbilities = Omit<Card, 'type'> & {
  type: 'unit';
  attack: number;
  defense: number;
  abilities: Effect[];
};
// Utility Functions
export function validateResources(
  available: ResourceState,
  required: Partial<ResourceState>,
): boolean {
  return Object.entries(required).every(([resource, cost]) => {
    const availableAmount = available[resource as keyof ResourceState] || 0;
    return availableAmount >= (cost || 0);
  });
}

// Constants
export const INITIAL_HAND_SIZE = 5;
export const INITIAL_HEALTH = 20;
export const INITIAL_RESOURCES: ResourceState = {
  material: 3,
  mind: 3,
};
export const FIELD_SIZE = 4;
