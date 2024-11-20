import type { Card } from '@shared/types';
import styles from './GameHand.module.css';

export interface CardPreviewProps {
  card: Card;
}

export function CardPreview({ card }: CardPreviewProps) {
  return (
    <div className={styles.preview}>
      <div className={styles.previewCard}>
        {/* Enhanced card preview */}
        <h2>{card.name}</h2>
        <div className={styles.cardType}>{card.type}</div>
        <div className={styles.cardLayer}>{card.layer}</div>

        {/* Show stats for unit cards */}
        {card.type === 'unit' && (
          <div className={styles.stats}>
            <span>ATK: {(card as any).attack}</span>
            <span>DEF: {(card as any).defense}</span>
          </div>
        )}

        {/* Show effects */}
        <div className={styles.effects}>{/* Render effects based on card type */}</div>
      </div>
    </div>
  );
}
