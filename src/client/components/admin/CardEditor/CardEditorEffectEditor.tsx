import type { CardDefinition, Effect, EffectType, TargetType } from '@shared/types';
import styles from './CardEditor.module.css';

interface CardEditorEffectEditorProps {
  card: CardDefinition;
  onChange: (card: CardDefinition) => void;
}

const effectTypes: EffectType[] = [
  'damage',
  'heal',
  'buff',
  'debuff',
  'control',
  'draw',
  'discard',
  'transform',
  'summon',
];

const targetTypes: TargetType[] = ['self', 'ally', 'enemy', 'all', 'player'];

export function CardEditorEffectEditor({ card, onChange }: CardEditorEffectEditorProps) {
  const generateEffectId = () => `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addEffect = () => {
    const newEffect: Effect = {
      id: generateEffectId(),
      type: 'damage',
      target: 'enemy',
      value: 0,
    };

    switch (card.type) {
      case 'unit':
        onChange({
          ...card,
          abilities: [...(card.abilities || []), newEffect],
        });
        break;
      case 'ritual':
        onChange({
          ...card,
          effects: [...(card.effects || []), newEffect],
        });
        break;
      case 'effect':
        onChange({
          ...card,
          effect: newEffect,
        });
        break;
    }
  };

  const updateEffect = (effectId: string, updates: Partial<Effect>) => {
    switch (card.type) {
      case 'unit':
        onChange({
          ...card,
          abilities: (card.abilities || []).map((effect) =>
            effect.id === effectId ? { ...effect, ...updates } : effect,
          ),
        });
        break;
      case 'ritual':
        onChange({
          ...card,
          effects: (card.effects || []).map((effect) =>
            effect.id === effectId ? { ...effect, ...updates } : effect,
          ),
        });
        break;
      case 'effect':
        if (card.effect && card.effect.id === effectId) {
          onChange({
            ...card,
            effect: { ...card.effect, ...updates },
          });
        }
        break;
    }
  };

  const removeEffect = (effectId: string) => {
    switch (card.type) {
      case 'unit':
        onChange({
          ...card,
          abilities: (card.abilities || []).filter((effect) => effect.id !== effectId),
        });
        break;
      case 'ritual':
        onChange({
          ...card,
          effects: (card.effects || []).filter((effect) => effect.id !== effectId),
        });
        break;
    }
  };

  const effects: Effect[] = (() => {
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
  })();

  return (
    <div className={styles.section}>
      <h4>Effects</h4>
      <div className={styles.effectEditor}>
        {effects.map((effect) => (
          <div key={effect.id} className={styles.effectControls}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Type</label>
              <select
                className={styles.select}
                value={effect.type}
                onChange={(e) =>
                  updateEffect(effect.id, {
                    type: e.target.value as EffectType,
                  })
                }
              >
                {effectTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Target</label>
              <select
                className={styles.select}
                value={effect.target}
                onChange={(e) =>
                  updateEffect(effect.id, {
                    target: e.target.value as TargetType,
                  })
                }
              >
                {targetTypes.map((target) => (
                  <option key={target} value={target}>
                    {target.charAt(0).toUpperCase() + target.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Value</label>
              <input
                type="number"
                className={styles.input}
                value={effect.value}
                onChange={(e) =>
                  updateEffect(effect.id, {
                    value: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            {card.type !== 'effect' && (
              <button className={styles.removeButton} onClick={() => removeEffect(effect.id)}>
                Remove
              </button>
            )}
          </div>
        ))}

        {card.type !== 'effect' && (
          <button className={styles.addButton} onClick={addEffect}>
            Add Effect
          </button>
        )}
      </div>
    </div>
  );
}
