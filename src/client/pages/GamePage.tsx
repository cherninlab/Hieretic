import { GameLayout } from '@components/game/GameLayout';
import { Button, ReturnToMainButton } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import type { Layer, TargetingMode } from '@shared/types';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import styles from './GamePage.module.css';

export default function GamePage() {
  const navigate = useNavigate();
  const { gameCode } = useParams<{ gameCode: string }>();
  const {
    gameState,
    currentPlayerId,
    opponentId,
    isLoading,
    error,
    handleFieldSlotClick,
    changePhase,
    endTurn,
    activateAbility,
    changeLayer,
    surrender,
    isMyTurn,
  } = useGame(gameCode);

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<{
    cardId: string;
    abilityIndex: number;
  } | null>(null);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const [targetingMode, setTargetingMode] = useState<TargetingMode | null>(null);
  const [currentLayer, setCurrentLayer] = useState<Layer>('material');

  useEffect(() => {
    if (!isMyTurn) {
      setSelectedCard(null);
      setSelectedAbility(null);
      setTargetingMode(null);
    }
  }, [isMyTurn]);

  useEffect(() => {
    if (gameState?.status === 'finished' && gameState.winner) {
      const isWinner = gameState.winner === currentPlayerId;
      navigate('/game-over', { state: { result: isWinner ? 'You won!' : 'You lost!' } });
    }
  }, [gameState?.status, currentPlayerId, navigate, gameState?.winner]);

  const handleCardSelect = useCallback(
    (cardId: string) => {
      if (!isMyTurn || targetingMode) return;
      setSelectedCard(cardId === selectedCard ? null : cardId);
    },
    [isMyTurn, selectedCard, targetingMode],
  );

  const handleSlotSelect = useCallback(
    async (slotId: number) => {
      if (!isMyTurn || !gameCode) return;

      try {
        if (targetingMode && selectedAbility) {
          await activateAbility(selectedAbility.cardId, selectedAbility.abilityIndex, [
            slotId.toString(),
          ]);
          setSelectedAbility(null);
          setTargetingMode(null);
          return;
        }

        await handleFieldSlotClick(slotId, false);
      } catch (error) {
        console.error('Error handling slot selection:', error);
      }
    },
    [isMyTurn, gameCode, targetingMode, selectedAbility, activateAbility, handleFieldSlotClick],
  );

  if (isLoading || !gameState || !currentPlayerId || !opponentId) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>Synchronizing with the void...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span className={styles.errorText}>
          {error?.message || 'Failed to connect to the ethereal plane'}
        </span>
        <ReturnToMainButton />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameLayout
        currentPhase={gameState.phase}
        onPhaseChange={changePhase}
        playerState={{
          ...gameState.players[currentPlayerId],
          activeLayer: currentLayer,
        }}
        opponentState={{
          ...gameState.players[opponentId],
          activeLayer: currentLayer,
        }}
        onCardSelect={handleCardSelect}
        onSlotSelect={handleSlotSelect}
        onAbilityActivate={activateAbility}
        onLayerChange={(layer: Layer) => {
          setCurrentLayer(layer);
          changeLayer(layer);
        }}
        onEndTurn={endTurn}
        onSurrender={() => setShowSurrenderModal(true)}
        selectedCard={selectedCard}
        isMyTurn={isMyTurn}
        targetingMode={targetingMode}
        turn={gameState.turn}
      />

      {showSurrenderModal && (
        <Modal title="Confirm Surrender" onClose={() => setShowSurrenderModal(false)}>
          <div className={styles.surrenderModal}>
            <p>Are you sure you want to surrender this game?</p>
            <div className={styles.modalButtons}>
              <Button onClick={surrender} className={styles.surrenderButton}>
                Surrender
              </Button>
              <Button onClick={() => setShowSurrenderModal(false)} className={styles.cancelButton}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
