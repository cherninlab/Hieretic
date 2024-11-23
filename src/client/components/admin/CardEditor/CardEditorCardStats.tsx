import type { CardDefinition, Layer } from '@shared/types';
import styles from './CardEditor.module.css';

interface CardEditorCardStatsProps {
  card: CardDefinition;
  onChange: (card: CardDefinition) => void;
}

export function CardEditorCardStats({ card, onChange }: CardEditorCardStatsProps) {
  if (card.type === 'unit') {
    return (
      <div className={styles.section}>
        <h4>Unit Stats</h4>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Attack</label>
            <input
              type="number"
              className={styles.input}
              value={card.attack ?? 0}
              onChange={(e) =>
                onChange({
                  ...card,
                  attack: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              min="0"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Defense</label>
            <input
              type="number"
              className={styles.input}
              value={card.defense ?? 0}
              onChange={(e) =>
                onChange({
                  ...card,
                  defense: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              min="0"
            />
          </div>
        </div>
      </div>
    );
  }

  if (card.type === 'ritual') {
    const layers: Layer[] = ['material', 'mind'];
    return (
      <div className={styles.section}>
        <h4>Ritual Properties</h4>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Duration (turns)</label>
            <input
              type="number"
              className={styles.input}
              value={card.duration ?? 1}
              onChange={(e) =>
                onChange({
                  ...card,
                  duration: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
              min="1"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Layer Requirements</label>
            {layers.map((layer) => (
              <div key={layer} className={styles.layerRequirement}>
                <label className={styles.label}>
                  {layer.charAt(0).toUpperCase() + layer.slice(1)}
                </label>
                <input
                  type="number"
                  className={styles.input}
                  value={card.layerRequirements?.[layer] ?? 0}
                  onChange={(e) =>
                    onChange({
                      ...card,
                      layerRequirements: {
                        ...card.layerRequirements,
                        [layer]: Math.max(0, parseInt(e.target.value) || 0),
                      },
                    })
                  }
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
