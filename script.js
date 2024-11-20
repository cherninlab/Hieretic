import fs from 'fs';
import { allTestCards } from './src/shared/testing/test-cards';

const cardsForKV = allTestCards.map((card) => ({
  key: `card:${card.id}`,
  value: JSON.stringify(card),
}));

fs.writeFileSync('cards.json', JSON.stringify(cardsForKV, null, 2));
