import type { Card, EffectCard, RitualCard, UnitCard } from '../types/cards';

// Mind Layer Cards
const mindCommonUnits: UnitCard[] = [
  {
    id: 'mind-com-1',
    name: 'Thought Leech',
    type: 'unit',
    layer: 'mind',
    cost: { material: 0, mind: 2 },
    rarity: 'common',
    set: 'core',
    releaseDate: Date.now(),
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
    cost: { material: 0, mind: 3 },
    rarity: 'common',
    set: 'core',
    releaseDate: Date.now(),
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
];

// Mind Effects
const mindEffects: EffectCard[] = [
  {
    id: 'mind-eff-1',
    name: 'Mind Shatter',
    type: 'effect',
    layer: 'mind',
    cost: { material: 0, mind: 2 },
    rarity: 'common',
    set: 'core',
    releaseDate: Date.now(),
    effect: {
      id: 'effect-mind-shatter',
      type: 'control',
      target: 'enemy',
      value: 2,
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
    cost: { material: 0, mind: 4 },
    rarity: 'common',
    set: 'core',
    releaseDate: Date.now(),
    duration: 2,
    effects: [
      {
        id: 'ritual-mass-hypnosis',
        type: 'control',
        target: 'enemy',
        value: 1,
      },
    ],
    layerRequirements: {
      mind: 2,
    },
  },
];

export const mindTestCards: Card[] = [...mindCommonUnits, ...mindEffects, ...mindRituals];
