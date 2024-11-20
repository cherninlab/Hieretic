import { Card } from '../types/cards';
import { materialTestCards } from './test-cards-material';
import { mindTestCards } from './test-cards-mind';

export const allTestCards: Card[] = [...materialTestCards, ...mindTestCards];

export function createTestDeck(): Card[] {
  // Select cards maintaining layer balance
  const deck: Card[] = [];

  // Add more physical cards (foundation)
  deck.push(...materialTestCards.slice(0, 12));

  // Add mind cards (control elements)
  deck.push(...mindTestCards.slice(0, 8));

  return deck;
}

export function createRandomTestDeck(): Card[] {
  const deck: Card[] = [];
  const allCards = [...allTestCards];

  while (deck.length < 30 && allCards.length > 0) {
    const randomIndex = Math.floor(Math.random() * allCards.length);
    deck.push(allCards[randomIndex]);
    allCards.splice(randomIndex, 1);
  }

  return deck;
}
