// Basic type definitions
export type CardType = 'unit' | 'effect' | 'ritual';
export type Layer = 'material' | 'mind' | 'void';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic';
export type CardSet = 'core' | 'expansion1';

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

// Base card properties interface
export interface BaseCardProperties {
  id: string;
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
  artworkUrl?: string;
}

// Specific card type interfaces
export interface UnitCard extends BaseCardProperties {
  type: 'unit';
  attack: number;
  defense: number;
  abilities: Effect[];
}

export interface EffectCard extends BaseCardProperties {
  type: 'effect';
  effect: Effect;
}

export interface RitualCard extends BaseCardProperties {
  type: 'ritual';
  duration: number;
  effects: Effect[];
  layerRequirements: Partial<Record<Layer, number>>;
}

// Union type for all card types
export type Card = UnitCard | EffectCard | RitualCard;

// Card definition type (for database/storage and editing)
export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  layer: Layer;
  cost: {
    material: number;
    mind: number;
    void: number;
  };
  rarity: Rarity;
  set: CardSet;
  artist?: string;
  releaseDate: number;
  flavorText?: string;
  artworkUrl?: string;

  // Properties that depend on card type
  attack?: number;
  defense?: number;
  abilities?: Effect[];
  effect?: Effect;
  duration?: number;
  effects?: Effect[];
  layerRequirements?: Partial<Record<Layer, number>>;
}

// Helper types
export type NewCard = Omit<CardDefinition, 'id'>;

// Type guard functions
export function isUnitCard(card: Card | CardDefinition): card is UnitCard {
  return card.type === 'unit';
}

export function isEffectCard(card: Card | CardDefinition): card is EffectCard {
  return card.type === 'effect';
}

export function isRitualCard(card: Card | CardDefinition): card is RitualCard {
  return card.type === 'ritual';
}

// Helper function to convert CardDefinition to Card
export function cardDefinitionToCard(def: CardDefinition): Card {
  switch (def.type) {
    case 'unit':
      return {
        ...def,
        type: 'unit',
        attack: def.attack || 0,
        defense: def.defense || 0,
        abilities: def.abilities || [],
      } as UnitCard;
    case 'effect':
      if (!def.effect) throw new Error('Effect card requires effect property');
      return {
        ...def,
        type: 'effect',
        effect: def.effect,
      } as EffectCard;
    case 'ritual':
      if (!def.duration || !def.effects)
        throw new Error('Ritual card requires duration and effects');
      return {
        ...def,
        type: 'ritual',
        duration: def.duration,
        effects: def.effects,
        layerRequirements: def.layerRequirements || {},
      } as RitualCard;
  }
}

// Helper function to create initial card definition
export function createInitialCardDefinition(type: CardType): CardDefinition {
  return {
    id: `card-${Date.now()}`,
    name: '',
    type,
    layer: 'material',
    cost: { material: 0, mind: 0, void: 0 },
    rarity: 'common',
    set: 'core',
    releaseDate: Date.now(),
    ...(type === 'unit' ? { attack: 0, defense: 0, abilities: [] } : {}),
    ...(type === 'effect'
      ? {
          effect: {
            id: `effect-${Date.now()}`,
            type: 'damage',
            target: 'unit',
            value: 0,
          },
        }
      : {}),
    ...(type === 'ritual'
      ? {
          duration: 3,
          effects: [],
          layerRequirements: {},
        }
      : {}),
  };
}
