import { Card, Deck } from '@shared/types';
import { materialTestCards } from './test-cards-material';
import { mindTestCards } from './test-cards-mind';

export const allTestCards: Card[] = [...materialTestCards, ...mindTestCards];
export const dublicatedTestCards: Card[] = [...allTestCards, ...allTestCards, ...allTestCards];

export function createTestDeck(): Card[] {
  return dublicatedTestCards.slice(0, 30);
}

export function createFormatedTestDeck(): Deck {
  return {
    id: 'test-deck',
    name: 'Test Deck',
    format: 'standard',
    cards: createTestDeck().map((card) => card.id),
  };
}

export function createRandomTestDeck(): Card[] {
  const deck: Card[] = [];
  const allCards = [...dublicatedTestCards];

  while (deck.length < 30 && allCards.length > 0) {
    const randomIndex = Math.floor(Math.random() * allCards.length);
    deck.push(allCards[randomIndex]);
    allCards.splice(randomIndex, 1);
  }

  return deck;
}
