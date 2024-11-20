import type { Card } from '@shared/types';
import styles from './CardPreview.module.css';

interface CardPreviewProps {
  card: Card;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function CardPreview({ card, size = 'medium', className = '' }: CardPreviewProps) {
  return (
    <div className={`${styles.cardPreview} ${styles[size]} ${className}`}>
      {card.artworkUrl ? (
        <img
          src={`/assets/cards/${card.artworkUrl}`}
          alt={card.name}
          className={styles.cardImage}
        />
      ) : (
        <div className={styles.noPreview}>No Preview</div>
      )}
    </div>
  );
}
