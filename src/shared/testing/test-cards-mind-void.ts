import type { Card, EffectCard, RitualCard, UnitCard } from '../types/cards';

// Mind Layer Cards

// Common Units - Pure Mental
const mindCommonUnits: UnitCard[] = [
  {
    id: 'mind-com-1',
    name: 'Thought Leech',
    type: 'unit',
    layer: 'mind',
    cost: { material: 0, mind: 2, void: 0 },
    rarity: 'common',
    attack: 1,
    defense: 3,
    abilities: [
      {
        id: 'ability-thought-drain',
        type: 'control',
        target: 'enemy',
        value: 1,
      },
    ],
  },
  {
    id: 'mind-com-2',
    name: 'Memory Feeder',
    type: 'unit',
    layer: 'mind',
    cost: { material: 0, mind: 3, void: 0 },
    rarity: 'common',
    attack: 2,
    defense: 2,
    abilities: [
      {
        id: 'ability-memory-feed',
        type: 'draw',
        target: 'self',
        value: 1,
      },
    ],
  },
  {
    id: 'mind-com-3',
    name: 'Dream Walker',
    type: 'unit',
    layer: 'mind',
    cost: { material: 0, mind: 1, void: 0 },
    rarity: 'common',
    attack: 1,
    defense: 1,
    abilities: [
      {
        id: 'ability-dream-walk',
        type: 'control',
        target: 'unit',
        value: 1,
      },
    ],
  },
];

// Uncommon Units - Mind + Void hints
const mindUncommonUnits: UnitCard[] = [
  {
    id: 'mind-unc-1',
    name: 'Void Psychic',
    type: 'unit',
    layer: 'mind',
    cost: { material: 0, mind: 2, void: 1 },
    rarity: 'uncommon',
    attack: 2,
    defense: 3,
    abilities: [
      {
        id: 'ability-void-sight',
        type: 'transform',
        target: 'enemy',
        value: 2,
      },
    ],
  },
  {
    id: 'mind-unc-2',
    name: 'Reality Seer',
    type: 'unit',
    layer: 'mind',
    cost: { material: 0, mind: 3, void: 1 },
    rarity: 'uncommon',
    attack: 1,
    defense: 4,
    abilities: [
      {
        id: 'ability-reality-glimpse',
        type: 'draw',
        target: 'self',
        value: 2,
      },
    ],
  },
];

// Mind Effects
const mindEffects: EffectCard[] = [
  {
    id: 'mind-eff-1',
    name: 'Mind Shatter',
    type: 'effect',
    layer: 'mind',
    cost: { material: 0, mind: 2, void: 0 },
    rarity: 'common',
    effect: {
      id: 'effect-mind-shatter',
      type: 'control',
      target: 'unit',
      value: 2,
    },
  },
  {
    id: 'mind-eff-2',
    name: 'Psychic Drain',
    type: 'effect',
    layer: 'mind',
    cost: { material: 0, mind: 3, void: 0 },
    rarity: 'common',
    effect: {
      id: 'effect-psychic-drain',
      type: 'damage',
      target: 'unit',
      value: 3,
    },
  },
];

// Mind Rituals
const mindRituals: RitualCard[] = [
  {
    id: 'mind-rit-1',
    name: 'Mass Hypnosis',
    type: 'ritual',
    layer: 'mind',
    cost: { material: 0, mind: 4, void: 0 },
    rarity: 'common',
    duration: 2,
    effects: [
      {
        id: 'ritual-mass-hypnosis',
        type: 'control',
        target: 'all',
        value: 1,
      },
    ],
    layerRequirements: {
      mind: 2,
    },
  },
];

// Void Layer Cards

// Common Void Units
const voidCommonUnits: UnitCard[] = [
  {
    id: 'void-com-1',
    name: 'Reality Ripper',
    type: 'unit',
    layer: 'void',
    cost: { material: 0, mind: 0, void: 3 },
    rarity: 'common',
    attack: 3,
    defense: 1,
    abilities: [
      {
        id: 'ability-reality-rip',
        type: 'transform',
        target: 'unit',
        value: 2,
      },
    ],
  },
  {
    id: 'void-com-2',
    name: 'Null Walker',
    type: 'unit',
    layer: 'void',
    cost: { material: 0, mind: 0, void: 2 },
    rarity: 'common',
    attack: 2,
    defense: 2,
    abilities: [
      {
        id: 'ability-null-walk',
        type: 'transform',
        target: 'self',
        value: 1,
      },
    ],
  },
  {
    id: 'void-com-3',
    name: 'Entropy Weaver',
    type: 'unit',
    layer: 'void',
    cost: { material: 0, mind: 0, void: 4 },
    rarity: 'common',
    attack: 4,
    defense: 4,
    abilities: [
      {
        id: 'ability-entropy-weave',
        type: 'transform',
        target: 'all',
        value: 1,
      },
    ],
  },
];

// Uncommon Void Units
const voidUncommonUnits: UnitCard[] = [
  {
    id: 'void-unc-1',
    name: 'Law Breaker',
    type: 'unit',
    layer: 'void',
    cost: { material: 0, mind: 1, void: 3 },
    rarity: 'uncommon',
    attack: 3,
    defense: 3,
    abilities: [
      {
        id: 'ability-law-break',
        type: 'transform',
        target: 'all',
        value: 2,
      },
    ],
  },
  {
    id: 'void-unc-2',
    name: 'Reality Shaper',
    type: 'unit',
    layer: 'void',
    cost: { material: 1, mind: 0, void: 3 },
    rarity: 'uncommon',
    attack: 2,
    defense: 4,
    abilities: [
      {
        id: 'ability-reality-shape',
        type: 'transform',
        target: 'unit',
        value: 3,
      },
    ],
  },
];

// Void Effects
const voidEffects: EffectCard[] = [
  {
    id: 'void-eff-1',
    name: 'Reality Fracture',
    type: 'effect',
    layer: 'void',
    cost: { material: 0, mind: 0, void: 3 },
    rarity: 'common',
    effect: {
      id: 'effect-reality-fracture',
      type: 'transform',
      target: 'all',
      value: 2,
    },
  },
  {
    id: 'void-eff-2',
    name: 'Null Zone',
    type: 'effect',
    layer: 'void',
    cost: { material: 0, mind: 0, void: 2 },
    rarity: 'common',
    effect: {
      id: 'effect-null-zone',
      type: 'control',
      target: 'unit',
      value: 2,
    },
  },
  {
    id: 'void-eff-3',
    name: 'Law Corruption',
    type: 'effect',
    layer: 'void',
    cost: { material: 0, mind: 1, void: 3 },
    rarity: 'uncommon',
    effect: {
      id: 'effect-law-corruption',
      type: 'transform',
      target: 'all',
      value: 3,
    },
  },
];

// Void Rituals
const voidRituals: RitualCard[] = [
  {
    id: 'void-rit-1',
    name: 'Reality Storm',
    type: 'ritual',
    layer: 'void',
    cost: { material: 0, mind: 0, void: 5 },
    rarity: 'common',
    duration: 3,
    effects: [
      {
        id: 'ritual-reality-storm',
        type: 'transform',
        target: 'all',
        value: 2,
      },
    ],
    layerRequirements: {
      void: 3,
    },
  },
  {
    id: 'void-rit-2',
    name: 'Law Rewrite',
    type: 'ritual',
    layer: 'void',
    cost: { material: 0, mind: 1, void: 4 },
    rarity: 'uncommon',
    duration: 2,
    effects: [
      {
        id: 'ritual-law-rewrite',
        type: 'transform',
        target: 'all',
        value: 3,
      },
    ],
    layerRequirements: {
      mind: 1,
      void: 2,
    },
  },
];

// Export combined mind cards
export const mindTestCards: Card[] = [
  ...mindCommonUnits,
  ...mindUncommonUnits,
  ...mindEffects,
  ...mindRituals,
];

// Export combined void cards
export const voidTestCards: Card[] = [
  ...voidCommonUnits,
  ...voidUncommonUnits,
  ...voidEffects,
  ...voidRituals,
];
