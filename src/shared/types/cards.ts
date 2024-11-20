export interface ResourceState {
  material: number;
  mind: number;
}

export interface CardCost extends ResourceState {
  // to ensure compatibility
}

export type PhaseType = 'init' | 'draw' | 'main' | 'combat' | 'end';
export type CardType = 'unit' | 'effect' | 'ritual';
export type Layer = 'material' | 'mind';
export type Resource = 'material' | 'mind';
export type Rarity = 'common' | 'uncommon' | 'rare';
export type EffectType =
  | 'damage'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'control'
  | 'draw'
  | 'discard'
  | 'transform'
  | 'summon';
export type TargetType = 'self' | 'ally' | 'enemy' | 'all' | 'player';
export type TriggerType = 'onEnter' | 'onDeath' | 'onPhase';

export interface Effect {
  id: string;
  type: EffectType;
  target: TargetType;
  value: number;
  duration?: number;
  canTargetOtherLayer?: boolean;
  phase?: PhaseType;
  targetCount?: number;
  trigger?: TriggerType;
  cost?: CardCost;
}

export interface Ability extends Effect {
  // to ensure compatibility
}

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  layer: Layer;
  cost: CardCost;
  rarity: Rarity;
  set: string;
  releaseDate: number;
  attack?: number;
  defense?: number;
  abilities?: Ability[];
  effect?: Effect;
  effects?: Effect[];
  duration?: number;
  layerRequirements?: Partial<Record<Layer, number>>;
  flavorText?: string;
  artworkUrl?: string;
}

export interface UnitCard extends Omit<CardDefinition, 'type' | 'effect' | 'effects' | 'duration'> {
  type: 'unit';
  attack: number;
  defense: number;
  maxDefense?: number;
  controlled?: {
    by: string;
    duration: number;
  };
  abilities: Ability[];
}

export interface EffectCard
  extends Omit<
    CardDefinition,
    'type' | 'attack' | 'defense' | 'abilities' | 'effects' | 'duration'
  > {
  type: 'effect';
  effect: Effect;
}

export interface RitualCard
  extends Omit<CardDefinition, 'type' | 'attack' | 'defense' | 'abilities' | 'effect'> {
  type: 'ritual';
  duration: number;
  effects: Effect[];
  layerRequirements: Partial<Record<Layer, number>>;
}

export type Card = UnitCard | EffectCard | RitualCard;

// Type guards
export function isUnitCard(card: Card): card is UnitCard {
  return card.type === 'unit';
}

export function isEffectCard(card: Card): card is EffectCard {
  return card.type === 'effect';
}

export function isRitualCard(card: Card): card is RitualCard {
  return card.type === 'ritual';
}

// Utility types
export type LayerResources = Record<Layer, number>;
