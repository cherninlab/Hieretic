import { Card } from '@shared/types/cards';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { createSwapy, type Swapy } from 'swapy';
import { CardPreview } from './CardPreview';
import styles from './GameHand.module.css';
import { HandCard } from './HandCard';

export interface GameHandProps {
  cards: Card[];
  playableCards: Set<string>;
  onCardPlay?: (cardId: string) => void;
  onCardHover?: (card: Card | null) => void;
}

export function GameHand({ cards, playableCards, onCardPlay, onCardHover }: GameHandProps) {
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const swapyRef = useRef<Swapy | null>(null);

  // Initialize Swapy
  useEffect(() => {
    if (containerRef.current) {
      const swapy = createSwapy(containerRef.current, {
        animation: 'dynamic',
        continuousMode: true,
        manualSwap: false,
        swapMode: 'drop',
        autoScrollOnDrag: true,
      });

      // Set up card mapping
      const cardMapping = cards.reduce((map, card, index) => {
        map.set(`slot-${index}`, card.id);
        return map;
      }, new Map<string, string>());

      swapy.setData({ map: cardMapping });

      swapy.onSwapEnd((event) => {
        if (event.hasChanged && onCardPlay) {
          // Extract the card ID from the swap event
          const swappedCardId = Array.from(event.data.map.values()).find(
            (id) => id !== null,
          ) as string;
          if (swappedCardId && playableCards.has(swappedCardId)) {
            onCardPlay(swappedCardId);
          }
        }
      });

      swapyRef.current = swapy;

      return () => {
        swapy.destroy();
        swapyRef.current = null;
      };
    }
  }, [cards, playableCards, onCardPlay]);

  const handleCardHover = (card: Card | null) => {
    setHoveredCard(card);
    onCardHover?.(card);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={clsx(styles.previewArea, hoveredCard && styles.visible)}>
        {hoveredCard && <CardPreview card={hoveredCard} />}
      </div>

      <div className={styles.handArea}>
        <div className={styles.cardContainer} style={{ width: cards.length * 100 + 'px' }}>
          {cards.map((card, index) => (
            <div key={card.id} className={styles.cardSlot} data-slot-id={`slot-${index}`}>
              <HandCard
                card={card}
                isPlayable={playableCards.has(card.id as string)}
                onHover={handleCardHover}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
