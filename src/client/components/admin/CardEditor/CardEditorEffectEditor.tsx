import type { Card, Effect, EffectType, TargetType } from '@shared/types/cards';
import styles from './CardEditor.module.css';

interface CardEditorEffectEditorProps {
  card: Card;
  onChange: (card: Card) => void;
}

export function CardEditorEffectEditor({ card, onChange }: CardEditorEffectEditorProps) {
  const generateEffectId = () => `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addEffect = () => {
    const newEffect: Effect = {
      id: generateEffectId(),
      type: 'damage',
      target: 'unit',
      value: 0,
    };

    switch (card.type) {
      case 'unit':
        onChange({
          ...card,
          abilities: [...card.abilities, newEffect],
        });
        break;
      case 'ritual':
        onChange({
          ...card,
          effects: [...card.effects, newEffect],
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
          abilities: card.abilities.map((effect) =>
            effect.id === effectId ? { ...effect, ...updates } : effect,
          ),
        });
        break;
      case 'ritual':
        onChange({
          ...card,
          effects: card.effects.map((effect) =>
            effect.id === effectId ? { ...effect, ...updates } : effect,
          ),
        });
        break;
      case 'effect':
        if (card.effect.id === effectId) {
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
          abilities: card.abilities.filter((effect) => effect.id !== effectId),
        });
        break;
      case 'ritual':
        onChange({
          ...card,
          effects: card.effects.filter((effect) => effect.id !== effectId),
        });
        break;
    }
  };

  const effects =
    card.type === 'unit'
      ? card.abilities
      : card.type === 'ritual'
        ? card.effects
        : card.type === 'effect'
          ? [card.effect]
          : [];

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
                <option value="damage">Damage</option>
                <option value="heal">Heal</option>
                <option value="buff">Buff</option>
                <option value="debuff">Debuff</option>
                <option value="control">Control</option>
                <option value="draw">Draw</option>
                <option value="discard">Discard</option>
                <option value="transform">Transform</option>
                <option value="summon">Summon</option>
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
                <option value="self">Self</option>
                <option value="ally">Ally</option>
                <option value="enemy">Enemy</option>
                <option value="all">All</option>
                <option value="unit">Unit</option>
                <option value="player">Player</option>
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
