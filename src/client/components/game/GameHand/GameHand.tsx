import type { Card } from '@shared/types';
import styles from './GameHand.module.css';
import { HandCard } from './HandCard';

export interface GameHandProps {
  cards: Card[];
  playableCards: Set<string>;
  onCardPlay?: (cardId: string) => void;
  onCardHover?: (card: Card | null) => void;
}

export function GameHand({ cards, playableCards, onCardPlay }: GameHandProps) {
  const handleCardClick = (cardId: string) => {
    if (playableCards.has(cardId)) {
      onCardPlay?.(cardId);
    }
  };

  return (
    <div className={styles.container}>
      {cards.map((card) => (
        <div key={card.id} className={styles.cardSlot}>
          <HandCard
            card={card}
            isPlayable={playableCards.has(card.id)}
            onClick={() => handleCardClick(card.id)}
          />
        </div>
      ))}
    </div>
  );
}
