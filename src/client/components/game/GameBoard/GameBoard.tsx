import type { Card, Layer, PhaseType, TargetingMode } from '@shared/types';
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
  targetingMode: TargetingMode | null;
  currentPhase: PhaseType;
  onLayerChange?: (layer: Layer) => void;
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
  onLayerChange,
}: GameBoardProps) {
  const [selectedLayer, setSelectedLayer] = useState<Layer>('material');

  const handleLayerSelect = (layer: Layer) => {
    setSelectedLayer(layer);
    onLayerChange?.(layer);
  };

  const completeTargetingMode = targetingMode
    ? {
        ...targetingMode,
        validTargets: targetingMode.validTargets || [],
      }
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.playerArea}>
        <PlayerArea
          playerId={opponentPlayer}
          field={opponentField}
          isOpponent={true}
          layer={selectedLayer}
        />
      </div>

      <div className={styles.centerArea}>
        <div className={styles.layerControls}>
          <LayerSelector
            currentLayer={selectedLayer}
            onLayerSelect={handleLayerSelect}
            disabled={!isMyTurn || Boolean(targetingMode)}
          />
        </div>

        <BattleField
          playerField={playerField}
          opponentField={opponentField}
          selectedCard={selectedCard}
          onCardPlay={onCardPlay}
          onAttack={onAttack}
          onAbilityActivate={onAbilityActivate}
          isMyTurn={isMyTurn}
          targetingMode={completeTargetingMode}
          currentPhase={currentPhase}
          currentLayer={selectedLayer}
        />
      </div>

      <div className={styles.playerArea}>
        <PlayerArea
          playerId={currentPlayer}
          field={playerField}
          isOpponent={false}
          layer={selectedLayer}
        />
      </div>

      {/* Phase Indicator */}
      <div className={styles.phaseIndicator}>
        <span className={styles.phaseText}>
          {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
        </span>
        {isMyTurn && <span className={styles.turnIndicator}>Your Turn</span>}
      </div>
    </div>
  );
}
