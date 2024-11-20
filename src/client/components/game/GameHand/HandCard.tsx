import { CardPreview } from '@components/game/CardPreview/CardPreview';
import type { Card } from '@shared/types';
import clsx from 'clsx';
import styles from './GameHand.module.css';

export interface HandCardProps {
  card: Card;
  isPlayable: boolean;
  onClick: () => void;
}

export function HandCard({ card, isPlayable, onClick }: HandCardProps) {
  return (
    <div
      className={clsx(styles.card, isPlayable ? styles.playable : styles.unplayable)}
      onClick={onClick}
    >
      <CardPreview card={card} size="small" />
    </div>
  );
}
