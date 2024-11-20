import type { Card, CardType, Layer, Rarity } from '@shared/types/cards';
import styles from './CardEditor.module.css';

interface CardEditorBasicInfoProps {
  card: Card;
  onChange: (card: Card) => void;
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
            <option value="material">Material</option>
            <option value="mind">Mind</option>
            <option value="void">Void</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Rarity</label>
          <select
            className={styles.select}
            value={card.rarity}
            onChange={(e) => onChange({ ...card, rarity: e.target.value as Rarity })}
          >
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="mythic">Mythic</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Material Cost</label>
          <input
            type="number"
            className={styles.input}
            value={card.cost.material}
            onChange={(e) => updateCost('material', parseInt(e.target.value))}
            min="0"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Mind Cost</label>
          <input
            type="number"
            className={styles.input}
            value={card.cost.mind}
            onChange={(e) => updateCost('mind', parseInt(e.target.value))}
            min="0"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Void Cost</label>
          <input
            type="number"
            className={styles.input}
            value={card.cost.void}
            onChange={(e) => updateCost('void', parseInt(e.target.value))}
            min="0"
          />
        </div>
      </div>
    </div>
  );
}
