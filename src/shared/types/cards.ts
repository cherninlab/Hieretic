import { Card } from './core';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'mythic';
export type CardSet = 'core' | 'expansion1';

export interface CardDefinition extends Card {
  rarity: CardRarity;
  set: CardSet;
  artist?: string;
  flavorText?: string;
  releaseDate: number;
}
