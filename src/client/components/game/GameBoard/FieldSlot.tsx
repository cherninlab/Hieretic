import { CardPreview } from '@components/game/CardPreview/CardPreview';
import type { Card } from '@shared/types';
import clsx from 'clsx';
import styles from './BattleField.module.css';

interface FieldSlotProps {
  card: Card | null;
  position: number;
  isOpponent: boolean;
  onClick: (position: number, isOpponent: boolean) => void;
  isHighlighted: boolean;
}

export function FieldSlot({ card, position, isOpponent, onClick, isHighlighted }: FieldSlotProps) {
  return (
    <div
      className={clsx(styles.slot, isHighlighted && styles.highlighted)}
      onClick={() => onClick(position, isOpponent)}
    >
      {card ? (
        <CardPreview card={card} size="medium" />
      ) : (
        <div className={styles.emptySlot}>Empty</div>
      )}
    </div>
  );
}
