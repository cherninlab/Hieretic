import { Card } from '@shared/types/cards';
import { GamePhase } from '@shared/types/game';
import { useState } from 'react';
import { BattleField } from './BattleField';
import styles from './GameBoard.module.css';
import { LayerSelector } from './LayerSelector';
import { PlayerArea } from './PlayerArea';

export interface GameBoardProps {
  currentPlayer: string;
  opponentPlayer: string;
  playerField: (Card | null)[];
  opponentField: (Card | null)[];
  selectedCard: string | null;
  onCardPlay?: (cardId: string, position: number) => void;
  onAttack?: (attackerId: string, targetId: string) => void;
  onAbilityActivate?: (cardId: string, abilityIndex: number, targets: string[]) => void;
  isMyTurn: boolean;
  targetingMode: {
    type: 'ability' | 'attack';
    sourceId: string;
  } | null;
  currentPhase: GamePhase;
}

export function GameBoard({
  currentPlayer,
  opponentPlayer,
  playerField,
  opponentField,
  selectedCard,
  onCardPlay,
  onAttack,
  onAbilityActivate,
  isMyTurn,
  targetingMode,
  currentPhase,
}: GameBoardProps) {
  const [selectedLayer, setSelectedLayer] = useState<'material' | 'mind' | 'void'>('material');

  return (
    <div className={styles.container}>
      <div className={styles.playerArea}>
        <PlayerArea playerId={opponentPlayer} field={opponentField} isOpponent={true} />
      </div>

      <div className={styles.centerArea}>
        <div className={styles.layerControls}>
          <LayerSelector currentLayer={selectedLayer} onLayerSelect={setSelectedLayer} />
        </div>
        <BattleField
          playerField={playerField}
          opponentField={opponentField}
          selectedCard={selectedCard}
          onCardPlay={onCardPlay}
          onAttack={onAttack}
          onAbilityActivate={onAbilityActivate}
          isMyTurn={isMyTurn}
          targetingMode={targetingMode}
          currentPhase={currentPhase}
        />
      </div>

      <div className={styles.playerArea}>
        <PlayerArea playerId={currentPlayer} field={playerField} isOpponent={false} />
      </div>
    </div>
  );
}
