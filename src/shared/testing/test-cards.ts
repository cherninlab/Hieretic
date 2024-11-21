import { Card } from '../types/cards';
import { materialTestCards } from './test-cards-material';
import { mindTestCards, voidTestCards } from './test-cards-mind-void';

export const allTestCards: Card[] = [...materialTestCards, ...mindTestCards, ...voidTestCards];

// Create a full test deck with appropriate card ratios
export function createTestDeck(): Card[] {
  // Select cards maintaining layer balance
  const deck: Card[] = [];

  // Add more physical cards (foundation)
  deck.push(...materialTestCards.slice(0, 12));

  // Add mind cards (control elements)
  deck.push(...mindTestCards.slice(0, 8));

  // Add void cards (power plays)
  deck.push(...voidTestCards.slice(0, 10));

  return deck;
}

// Create a random test deck
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
