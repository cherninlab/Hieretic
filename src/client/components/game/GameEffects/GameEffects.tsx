import type { Effect, GameEffect } from '@shared/types';
import styles from './GameEffects.module.css';

interface GameEffectsProps {
  playerEffects: GameEffect[];
  opponentEffects: GameEffect[];
}

export function GameEffects({ playerEffects, opponentEffects }: GameEffectsProps) {
  return (
    <div className={styles.container}>
      {/* Player Effects */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Your Active Effects</h3>
        <div className={styles.effectsList}>
          {playerEffects.length === 0 ? (
            <div className={styles.emptyState}>No active effects</div>
          ) : (
            playerEffects.map((effect) => (
              <EffectCard key={effect.id} effect={effect} isPlayerEffect={true} />
            ))
          )}
        </div>
      </div>

      {/* Opponent Effects */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Opponent's Effects</h3>
        <div className={styles.effectsList}>
          {opponentEffects.length === 0 ? (
            <div className={styles.emptyState}>No active effects</div>
          ) : (
            opponentEffects.map((effect) => (
              <EffectCard key={effect.id} effect={effect} isPlayerEffect={false} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface EffectCardProps {
  effect: GameEffect;
  isPlayerEffect: boolean;
}

function EffectCard({ effect }: EffectCardProps) {
  const getEffectTypeIcon = (type: Effect['type']) => {
    switch (type) {
      case 'damage':
        return '🗡️';
      case 'heal':
        return '💚';
      case 'buff':
        return '⬆️';
      case 'debuff':
        return '⬇️';
      case 'control':
        return '🎯';
      case 'draw':
        return '📤';
      case 'discard':
        return '📥';
      case 'transform':
        return '🔄';
      case 'summon':
        return '✨';
      default:
        return '❓';
    }
  };

  return (
    <div className={`${styles.effectCard} ${styles[effect.type]}`}>
      <div className={styles.effectHeader}>
        <span className={styles.effectIcon}>{getEffectTypeIcon(effect.type)}</span>
        <span className={styles.effectSource}>{effect.sourceName}</span>
        <span className={styles.effectDuration}>{effect.remainingDuration} turns</span>
      </div>

      <div className={styles.effectDetails}>
        <div className={styles.effectType}>
          {effect.type.charAt(0).toUpperCase() + effect.type.slice(1)}
        </div>
        <div className={styles.effectValue}>Value: {effect.value}</div>
        <div className={styles.effectTarget}>Target: {effect.target}</div>
      </div>

      {effect.affectedCardIds.length > 0 && (
        <div className={styles.affectedCards}>
          Affecting {effect.affectedCardIds.length} card(s)
        </div>
      )}
    </div>
  );
}
