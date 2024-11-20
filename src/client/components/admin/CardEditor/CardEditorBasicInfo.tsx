import type { Card, CardType, Layer } from '@shared/types';
import styles from './CardEditor.module.css';

interface CardEditorBasicInfoProps {
  card: Card;
  onChange: (card: Partial<Card>) => void;
  onTypeChange: (type: CardType) => void;
}

export function CardEditorBasicInfo({ card, onChange, onTypeChange }: CardEditorBasicInfoProps) {
  const updateCost = (resource: keyof Card['cost'], value: number) => {
    onChange({
      ...card,
      cost: {
        ...card.cost,
        [resource]: Math.max(0, value),
      },
    });
  };

  const layers: Layer[] = ['material', 'mind'];
  const rarities = ['common', 'uncommon', 'rare'] as const;

  return (
    <div className={styles.section}>
      <h4>Basic Information</h4>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Card Type</label>
          <select
            className={styles.select}
            value={card.type}
            onChange={(e) => onTypeChange(e.target.value as CardType)}
          >
            <option value="unit">Unit</option>
            <option value="effect">Effect</option>
            <option value="ritual">Ritual</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input
            type="text"
            className={styles.input}
            value={card.name}
            onChange={(e) => onChange({ ...card, name: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Layer</label>
          <select
            className={styles.select}
            value={card.layer}
            onChange={(e) => onChange({ ...card, layer: e.target.value as Layer })}
          >
            {layers.map((layer) => (
              <option key={layer} value={layer}>
                {layer.charAt(0).toUpperCase() + layer.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Rarity</label>
          <select
            className={styles.select}
            value={card.rarity}
            onChange={(e) =>
              onChange({ ...card, rarity: e.target.value as (typeof rarities)[number] })
            }
          >
            {rarities.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        {Object.keys(card.cost).map((resource) => (
          <div key={resource} className={styles.formGroup}>
            <label className={styles.label}>
              {resource.charAt(0).toUpperCase() + resource.slice(1)} Cost
            </label>
            <input
              type="number"
              className={styles.input}
              value={card.cost[resource as keyof typeof card.cost]}
              onChange={(e) =>
                updateCost(resource as keyof typeof card.cost, parseInt(e.target.value))
              }
              min="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
