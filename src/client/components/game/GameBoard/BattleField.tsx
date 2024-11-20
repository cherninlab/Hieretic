import type { Card, PhaseType, Layer, TargetingMode } from '@shared/types';
import { ReactNode, useCallback } from 'react';
import styles from './BattleField.module.css';
import { FieldSlot } from './FieldSlot';
import { LayerIndicator } from './LayerIndicator';
import { TargetingOverlay } from './TargetingOverlay';

export interface BattleFieldProps {
  playerField: (Card | null)[];
  opponentField: (Card | null)[];
  selectedCard: string | null;
  onCardPlay?: (cardId: string, position: number) => void;
  onAttack?: (attackerId: string, targetId: string) => void;
  onAbilityActivate?: (cardId: string, abilityIndex: number, targets: string[]) => void;
  isMyTurn?: boolean;
  targetingMode?: TargetingMode | null;
  currentPhase?: PhaseType;
  children?: ReactNode;
  currentLayer?: Layer;
}

export function BattleField({
  playerField,
  opponentField,
  onCardPlay,
  onAttack,
  onAbilityActivate,
  targetingMode,
}: BattleFieldProps) {
  const handleSlotClick = useCallback(
    (position: number, _isOpponent: boolean) => {
      if (onCardPlay && targetingMode?.type === 'play') {
        onCardPlay(targetingMode.sourceId, position);
      } else if (onAttack && targetingMode?.type === 'attack') {
        onAttack(
          targetingMode.sourceId,
          playerField[position]?.id || opponentField[position]?.id || '',
        );
      } else if (onAbilityActivate && targetingMode?.type === 'ability') {
        onAbilityActivate(targetingMode.sourceId, targetingMode.abilityIndex || 0, [
          position.toString(),
        ]);
      }
    },
    [onCardPlay, onAttack, onAbilityActivate, targetingMode, playerField, opponentField],
  );

  return (
    <div className={styles.battlefield}>
      <div className={styles.field}>
        {opponentField.map((card, index) => (
          <FieldSlot
            key={`opponent-${index}`}
            card={card}
            position={index}
            isOpponent={true}
            onClick={handleSlotClick}
            isHighlighted={targetingMode?.validTargets.includes(index) ?? false}
          />
        ))}
      </div>
      <div className={styles.field}>
        {playerField.map((card, index) => (
          <FieldSlot
            key={`player-${index}`}
            card={card}
            position={index}
            isOpponent={false}
            onClick={handleSlotClick}
            isHighlighted={targetingMode?.validTargets.includes(index) ?? false}
          />
        ))}
      </div>
      {targetingMode && <TargetingOverlay onClick={() => {}} targets={[]} />}
      <LayerIndicator type={''} position={{ x: 0, y: 0 }} />
    </div>
  );
}
