import type { GamePhase } from '@shared/types';
import styles from './GameControls.module.css';

export interface PhaseIndicatorProps {
  currentPhase: GamePhase;
  onPhaseSelect: (phase: GamePhase) => void;
  isPlayerTurn: boolean;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const phases: GamePhase[] = ['draw', 'main', 'combat', 'end'];

  return (
    <div className={styles.phaseControls}>
      {phases.map((phase) => (
        <div
          key={phase}
          className={`${styles.phase} ${phase === currentPhase ? styles.activePhase : ''}`}
        >
          {phase.charAt(0).toUpperCase() + phase.slice(1)}
        </div>
      ))}
    </div>
  );
}
