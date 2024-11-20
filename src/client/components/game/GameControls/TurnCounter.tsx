import styles from './GameControls.module.css';

export interface TurnCounterProps {
  turn: number;
  isPlayerTurn: boolean;
}

export function TurnCounter({ turn, isPlayerTurn }: TurnCounterProps) {
  return (
    <div className={styles.turnCounter}>
      <span>Turn {turn}</span>
      <span>•</span>
      <span>{isPlayerTurn ? 'Your Turn' : 'Enemy Turn'}</span>
    </div>
  );
}
