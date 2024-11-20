import type { PhaseType } from '@shared/types';
import { useEffect, useState } from 'react';
import { ActionPanel } from './ActionPanel';
import styles from './GameControls.module.css';
import { TurnCounter } from './TurnCounter';

export interface GameControlsProps {
  currentPhase: PhaseType;
  currentTurn: number;
  isPlayerTurn: boolean;
  onPhaseChange: (phase: PhaseType) => void;
  onEndTurn: () => void;
  onAction: (action: string) => void;
  canEndTurn: boolean;
  onSurrender?: () => void; // Made optional
}

export function GameControls({
  currentPhase,
  currentTurn,
  isPlayerTurn,
  // onPhaseChange,
  onEndTurn,
  onAction,
  canEndTurn,
}: GameControlsProps) {
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  // Update available actions when phase changes
  useEffect(() => {
    const actions = [];
    switch (currentPhase) {
      case 'main':
        actions.push('play', 'activate');
        break;
      case 'combat':
        actions.push('attack', 'defend');
        break;
    }
    setAvailableActions(actions);
  }, [currentPhase]); // Only depend on currentPhase

  return (
    <div className={styles.container}>
      <TurnCounter turn={currentTurn} isPlayerTurn={isPlayerTurn} />

      <div className={styles.phaseControls}>
        {/* <PhaseIndicator
          currentPhase={currentPhase}
          onPhaseSelect={onPhaseChange}
          isPlayerTurn={isPlayerTurn}
        /> */}
      </div>

      <ActionPanel
        actions={availableActions}
        onAction={onAction}
        canEndTurn={canEndTurn}
        onEndTurn={onEndTurn}
      />
    </div>
  );
}
