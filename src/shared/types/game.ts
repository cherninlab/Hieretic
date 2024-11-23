import type { Card, Effect, Layer, Resource } from './cards';
import type { UserProfile } from './user';

// Core game phases and states
export type GamePhase = 'init' | 'draw' | 'main' | 'combat' | 'end';
export type GameStateStatus = 'waiting' | 'active' | 'finished';

// Resource management
export interface ResourceState {
  material: number;
  mind: number;
}

export type PartialResourceState = Partial<ResourceState>;

// Game effects
export interface GameEffect {
  id: string;
  sourceCardId: string;
  sourceName: string;
  type: Effect['type'];
  target: string;
  value: number;
  remainingDuration: number;
  affectedCardIds: string[];
}

// Player state
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

// Core game state
export interface GameState {
  id: string;
  status: GameStateStatus;
  turn: number;
  phase: GamePhase;
  currentPlayer: string;
  players: Record<string, PlayerState>;
  activeEffects: GameEffect[];
  history: GameAction[];
  winner?: string;
  playerProfiles: Record<string, UserProfile>;
  createdBy?: string;
  created?: number;
  startedAt?: number;
  finishedAt?: number;
}

// Targeting system
export interface TargetingMode {
  type: 'ability' | 'attack' | 'play';
  sourceId: string;
  validTargets: number[];
  abilityIndex?: number;
}

// Game actions and history
export interface GameAction {
  type: string;
  playerId: string;
  timestamp: number;
  data: Record<string, any>;
  processed?: boolean;
}

export interface GameSyncState {
  gameState: GameState | null;
  isLoading: boolean;
  error: Error | null;
  currentPlayerId: string | null;
  opponentId: string | null;
  isMyTurn: boolean;
  currentPhase: GamePhase;
  currentLayer: Layer;
}

export interface GameSyncActions {
  refreshState: () => Promise<void>;
  playCard: (cardId: string, position: number) => Promise<void>;
  activateAbility: (cardId: string, abilityIndex: number, targets: string[]) => Promise<void>;
  changePhase: (phase: GamePhase) => Promise<void>;
  changeLayer: (layer: Layer) => Promise<void>;
  endTurn: () => Promise<void>;
}

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

// Resource management types
export interface ResourceRequirement {
  material: number;
  mind: number;
}

export interface ResourceGeneration {
  current: ResourceState;
  basePerTurn: ResourceState;
  bonuses: ResourceState;
}

export interface ResourceManager {
  // Current state
  currentResources: ResourceState;
  pendingCosts: ResourceState;
  generation: ResourceGeneration;

  // Core functionality
  canPlayCard: (card: Card) => boolean;
  getResourceRequirement: (card: Card) => ResourceRequirement;

  // Resource manipulation
  spendResources: (costs: PartialResourceState) => Promise<void>;
  addResources: (gained: PartialResourceState) => void;
  calculateResourceUsage: (cards: Card[]) => ResourceState;
}

// Hook interfaces for cleaner state management
export interface GameStatusInfo {
  gameState: GameState | null;
  currentPlayer: string | null;
  opponent: string | null;
  isMyTurn: boolean;
  currentPhase: GamePhase;
  isLoading: boolean;
  error: Error | null;
}

export interface GameControls {
  selectedCard: string | null;
  targetingMode: TargetingMode | null;
  playerField: (Card | null)[];
  opponentField: (Card | null)[];
  currentLayer: Layer;
  resources: ResourceState;
  canEndTurn: boolean;
  playableCards: Set<string>;
}

export interface GameActions {
  // Game setup
  createGame: () => Promise<void>;
  joinGame: (gameCode: string) => Promise<void>;
  startGame: (gameCode: string) => Promise<void>;
  surrender: () => Promise<void>;

  // Core game actions
  playCard: (cardId: string, position: number) => Promise<void>;
  activateAbility: (cardId: string, abilityIndex: number, targets: string[]) => Promise<void>;
  declareAttack: (attackerId: string, targetId: string) => Promise<void>;
  changePhase: (phase: GamePhase) => Promise<void>;
  endTurn: () => Promise<void>;

  // Board management
  selectCard: (cardId: string | null) => void;
  initiateAttack: (cardId: string) => void;
  initiateAbility: (cardId: string, abilityIndex: number) => void;
  cancelAction: () => void;

  // Layer management
  changeLayer: (layer: Layer) => Promise<void>;
  handleFieldSlotClick: (position: number, isOpponent: boolean) => Promise<void>;
}

// Utility types for cards with abilities
export type CardWithAbilities = Card & {
  abilities?: Effect[];
};

// Game event system
export interface GameEvent {
  type: string;
  timestamp: number;
  data: Record<string, any>;
  source?: string;
  target?: string[];
}

export interface GameEventHandler {
  type: string;
  handle: (state: GameState, event: GameEvent) => GameState;
}

// Game queue and matchmaking
export interface MatchmakingState {
  status: 'searching' | 'found' | 'error';
  searchStarted: number;
  foundMatch?: string;
  error?: string;
}

// Game statistics
export interface GameStats {
  playerStats: Record<
    string,
    {
      cardsPlayed: number;
      damageDealt: number;
      resourcesGained: number;
      effectsTriggered: number;
    }
  >;
  turnCount: number;
  gameStartTime: number;
  gameEndTime?: number;
}

export function validateResources(
  available: ResourceState,
  required: Partial<ResourceState>,
): boolean {
  return Object.entries(required).every(([resource, cost]) => {
    const availableAmount = available[resource as Resource] || 0;
    return availableAmount >= (cost || 0);
  });
}
