import { Button } from '@components/ui/Button';
import styles from './GameControls.module.css';

export interface ActionPanelProps {
  actions: string[];
  onAction: (action: string) => void;
  canEndTurn: boolean;
  onEndTurn: () => void;
}

export function ActionPanel({ actions, onAction, canEndTurn, onEndTurn }: ActionPanelProps) {
  return (
    <div className={styles.actionPanel}>
      {actions.map((action) => (
        <Button key={action} className={styles.actionButton} onClick={() => onAction(action)}>
          {action.charAt(0).toUpperCase() + action.slice(1)}
        </Button>
      ))}
      <Button className={styles.actionButton} onClick={onEndTurn} disabled={!canEndTurn}>
        End Turn
      </Button>
    </div>
  );
}
