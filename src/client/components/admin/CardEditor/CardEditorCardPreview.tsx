import type { CardDefinition } from '@shared/types';
import styles from './CardEditor.module.css';

interface CardEditorCardPreviewProps {
  card: CardDefinition;
}

export function CardEditorCardPreview({ card }: CardEditorCardPreviewProps) {
  return (
    <div className={styles.cardPreview}>
      {card.artworkUrl ? (
        <img
          src={`/api/assets/cards/${card.artworkUrl}`}
          alt={card.name}
          className={styles.cardImage}
        />
      ) : (
        <div className={styles.noPreview}>No artwork uploaded</div>
      )}
    </div>
  );
}
