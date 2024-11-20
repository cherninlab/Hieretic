// Basic type definitions
export type CardType = 'unit' | 'effect' | 'ritual';
export type Layer = 'material' | 'mind' | 'void';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic';

// Effect-related types
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

export type TargetType = 'self' | 'ally' | 'enemy' | 'all' | 'unit' | 'player';

export type TriggerType = 'onPlay' | 'onDeath' | 'startOfTurn' | 'endOfTurn';

// Effect interface
export interface Effect {
  id: string;
  type: EffectType;
  target: TargetType;
  value: number;
  duration?: number;
  trigger?: TriggerType;
}

// Base card interface
export interface BaseCard {
  id?: string;
  name: string;
  type: CardType;
  layer: Layer;
  cost: {
    material: number;
    mind: number;
    void: number;
  };
  rarity: Rarity;
  flavorText?: string;
}

// Specific card type interfaces
export interface UnitCard extends BaseCard {
  type: 'unit';
  attack: number;
  defense: number;
  abilities: Effect[];
  artworkUrl?: string;
}

export interface EffectCard extends BaseCard {
  type: 'effect';
  effect: Effect;
}

export interface RitualCard extends BaseCard {
  type: 'ritual';
  duration: number;
  effects: Effect[];
  layerRequirements: Partial<Record<Layer, number>>;
}

// Union type for all card types
export type Card = UnitCard | EffectCard | RitualCard;

// Helper type for card creation
export type NewCard = Omit<Card, 'id'>;

// Card set related types
export type CardSet = 'core' | 'expansion1';

// Card definition (for database/storage)
export interface CardDefinition extends Card {
  set: CardSet;
  artist?: string;
  releaseDate: number;
}
