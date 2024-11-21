import type { Card, EffectCard, RitualCard, UnitCard } from '../types/cards';

// Common Units - Pure Physical
const materialCommonUnits: UnitCard[] = [
  {
    id: 'mat-com-1',
    name: 'Flesh Golem',
    type: 'unit',
    layer: 'material',
    cost: { material: 2, mind: 0, void: 0 },
    rarity: 'common',
    attack: 2,
    defense: 3,
    abilities: [], // Basic stats unit
  },
  {
    id: 'mat-com-2',
    name: 'Blood Hunter',
    type: 'unit',
    layer: 'material',
    cost: { material: 1, mind: 0, void: 0 },
    rarity: 'common',
    attack: 2,
    defense: 1,
    abilities: [
      {
        id: 'ability-blood-hunt',
        type: 'damage',
        target: 'enemy',
        value: 1,
      },
    ],
  },
  {
    id: 'mat-com-3',
    name: 'Bone Warrior',
    type: 'unit',
    layer: 'material',
    cost: { material: 3, mind: 0, void: 0 },
    rarity: 'common',
    attack: 3,
    defense: 3,
    abilities: [], // Solid stats unit
  },
  {
    id: 'mat-com-4',
    name: 'Flesh Weaver',
    type: 'unit',
    layer: 'material',
    cost: { material: 2, mind: 0, void: 0 },
    rarity: 'common',
    attack: 1,
    defense: 2,
    abilities: [
      {
        id: 'ability-flesh-weave',
        type: 'heal',
        target: 'ally',
        value: 2,
      },
    ],
  },
  {
    id: 'mat-com-5',
    name: 'Stone Guardian',
    type: 'unit',
    layer: 'material',
    cost: { material: 4, mind: 0, void: 0 },
    rarity: 'common',
    attack: 2,
    defense: 5,
    abilities: [], // Defensive wall
  },
];

// Uncommon Units - Physical + Mind hints
const materialUncommonUnits: UnitCard[] = [
  {
    id: 'mat-unc-1',
    name: 'Blood Priest',
    type: 'unit',
    layer: 'material',
    cost: { material: 2, mind: 1, void: 0 },
    rarity: 'uncommon',
    attack: 2,
    defense: 2,
    abilities: [
      {
        id: 'ability-blood-ritual',
        type: 'transform',
        target: 'self',
        value: 2,
      },
    ],
  },
  {
    id: 'mat-unc-2',
    name: 'Bone Sculptor',
    type: 'unit',
    layer: 'material',
    cost: { material: 3, mind: 1, void: 0 },
    rarity: 'uncommon',
    attack: 2,
    defense: 3,
    abilities: [
      {
        id: 'ability-bone-sculpt',
        type: 'transform',
        target: 'ally',
        value: 1,
      },
    ],
  },
];

// Uncommon Units - Physical + Void hints
const materialVoidUnits: UnitCard[] = [
  {
    id: 'mat-void-1',
    name: 'Flesh Abomination',
    type: 'unit',
    layer: 'material',
    cost: { material: 3, mind: 0, void: 1 },
    rarity: 'uncommon',
    attack: 4,
    defense: 4,
    abilities: [
      {
        id: 'ability-consume',
        type: 'damage',
        target: 'self',
        value: 1,
      },
    ],
  },
];

// Common Effects - Pure Physical
const materialCommonEffects: EffectCard[] = [
  {
    id: 'mat-eff-1',
    name: 'Blood Strike',
    type: 'effect',
    layer: 'material',
    cost: { material: 1, mind: 0, void: 0 },
    rarity: 'common',
    effect: {
      id: 'effect-blood-strike',
      type: 'damage',
      target: 'unit',
      value: 2,
    },
  },
  {
    id: 'mat-eff-2',
    name: 'Bone Shield',
    type: 'effect',
    layer: 'material',
    cost: { material: 2, mind: 0, void: 0 },
    rarity: 'common',
    effect: {
      id: 'effect-bone-shield',
      type: 'buff',
      target: 'ally',
      value: 2,
    },
  },
  {
    id: 'mat-eff-3',
    name: 'Flesh Knitting',
    type: 'effect',
    layer: 'material',
    cost: { material: 2, mind: 0, void: 0 },
    rarity: 'common',
    effect: {
      id: 'effect-flesh-knit',
      type: 'heal',
      target: 'ally',
      value: 3,
    },
  },
];

// Uncommon Effects - Physical + Mind/Void
const materialUncommonEffects: EffectCard[] = [
  {
    id: 'mat-eff-unc-1',
    name: 'Blood Ritual',
    type: 'effect',
    layer: 'material',
    cost: { material: 2, mind: 1, void: 0 },
    rarity: 'uncommon',
    effect: {
      id: 'effect-blood-ritual',
      type: 'transform',
      target: 'all',
      value: 1,
    },
  },
  {
    id: 'mat-eff-unc-2',
    name: 'Flesh Corruption',
    type: 'effect',
    layer: 'material',
    cost: { material: 2, mind: 0, void: 1 },
    rarity: 'uncommon',
    effect: {
      id: 'effect-flesh-corrupt',
      type: 'debuff',
      target: 'enemy',
      value: 2,
    },
  },
];

// Rituals
const materialRituals: RitualCard[] = [
  {
    id: 'mat-rit-1',
    name: 'Blood Circle',
    type: 'ritual',
    layer: 'material',
    cost: { material: 3, mind: 0, void: 0 },
    rarity: 'common',
    duration: 3,
    effects: [
      {
        id: 'ritual-blood-circle',
        type: 'buff',
        target: 'ally',
        value: 1,
      },
    ],
    layerRequirements: {
      material: 2,
    },
  },
  {
    id: 'mat-rit-2',
    name: 'Bone Harvest',
    type: 'ritual',
    layer: 'material',
    cost: { material: 4, mind: 1, void: 0 },
    rarity: 'uncommon',
    duration: 2,
    effects: [
      {
        id: 'ritual-bone-harvest',
        type: 'damage',
        target: 'enemy',
        value: 2,
      },
    ],
    layerRequirements: {
      material: 2,
      mind: 1,
    },
  },
];

// Combine all material cards
export const materialTestCards: Card[] = [
  ...materialCommonUnits,
  ...materialUncommonUnits,
  ...materialVoidUnits,
  ...materialCommonEffects,
  ...materialUncommonEffects,
  ...materialRituals,
];
