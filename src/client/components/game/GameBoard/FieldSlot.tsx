import type { Card } from '@shared/types';
import clsx from 'clsx';
import { useCallback } from 'react';
import styles from './BattleField.module.css';

interface FieldSlotProps {
  card: Card | null;
  position: number;
  isOpponent: boolean;
  onClick: (position: number, isOpponent: boolean) => void;
  isHighlighted: boolean;
}

export function FieldSlot({ card, position, isOpponent, onClick, isHighlighted }: FieldSlotProps) {
  const handleClick = useCallback(() => {
    onClick(position, isOpponent);
  }, [onClick, position, isOpponent]);

  return (
    <div className={clsx(styles.slot, isHighlighted && styles.highlighted)} onClick={handleClick}>
      {card ? (
        <div className={styles.card}>
          <h3>{card.name}</h3>
          <div className={styles.stats}>
            {card.type === 'unit' && (
              <>
                <span>ATK: {card.attack}</span>
                <span>DEF: {card.defense}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.emptySlot}>Empty</div>
      )}
    </div>
  );
}
