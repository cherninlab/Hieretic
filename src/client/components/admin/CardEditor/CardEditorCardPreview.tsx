import type { Card, Effect } from '@shared/types/cards';
import styles from './CardEditor.module.css';

interface CardEditorCardPreviewProps {
  card: Card;
}

const getEffectsForCard = (card: Card): Effect[] => {
  switch (card.type) {
    case 'unit':
      return card.abilities || [];
    case 'ritual':
      return card.effects || [];
    case 'effect':
      return card.effect ? [card.effect] : [];
    default:
      return [];
  }
};

export function CardEditorCardPreview({ card }: CardEditorCardPreviewProps) {
  const effects = getEffectsForCard(card);

  return (
    <div className={styles.cardPreview}>
      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <h3 className={styles.previewName}>{card.name || 'New Card'}</h3>
          <span className={styles.previewType}>{card.type}</span>
        </div>

        <div className={styles.costs}>
          {card.cost.material > 0 && <div className={styles.costItem}>{card.cost.material}●</div>}
          {card.cost.mind > 0 && <div className={styles.costItem}>{card.cost.mind}○</div>}
          {card.cost.void > 0 && <div className={styles.costItem}>{card.cost.void}◊</div>}
        </div>

        <div className={styles.artworkPreview} />

        {card.type === 'unit' && (
          <div className={styles.previewStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>ATK</span>
              <span className={styles.statValue}>{(card as UnitCard).attack}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>DEF</span>
              <span className={styles.statValue}>{(card as UnitCard).defense}</span>
            </div>
          </div>
        )}

        {card.type === 'ritual' && (
          <div className={styles.previewStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Duration</span>
              <span className={styles.statValue}>{(card as RitualCard).duration}</span>
            </div>
          </div>
        )}

        <div className={styles.effects}>
          {effects.map((effect, index) => (
            <div key={effect.id || index} className={styles.effectItem}>
              {effect.type} - {effect.target} ({effect.value})
              {effect.duration && ` for ${effect.duration} turns`}
            </div>
          ))}
        </div>

        {card.flavorText && <div className={styles.flavorText}>{card.flavorText}</div>}
      </div>
    </div>
  );
}
