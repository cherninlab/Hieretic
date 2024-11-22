import { GameLayout } from '@components/game/GameLayout';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import type { Layer } from '@shared/types/cards';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import styles from './GamePage.module.css';

export default function GamePage() {
  const navigate = useNavigate();
  const { gameCode } = useParams<{ gameCode: string }>();
  const {
    gameState,
    currentPlayer,
    opponent,
    isLoading,
    error,
    playCard,
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
  const [targetingMode, setTargetingMode] = useState<{
    type: 'ability' | 'attack';
    sourceId: string;
  } | null>(null);
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
      const isWinner = gameState.winner === currentPlayer?.id;
      navigate('/game-over', { state: { result: isWinner ? 'You won!' : 'You lost!' } });
    }
  }, [gameState?.status, currentPlayer?.id, navigate, gameState?.winner]);

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
        if (targetingMode) {
          if (targetingMode.type === 'ability' && selectedAbility) {
            await activateAbility(targetingMode.sourceId, selectedAbility.abilityIndex, [
              slotId.toString(),
            ]);
            setTargetingMode(null);
            setSelectedAbility(null);
          }
          return;
        }

        if (selectedCard) {
          await playCard(selectedCard, slotId);
          setSelectedCard(null);
        }
      } catch (error) {
        console.error('Error handling slot selection:', error);
      }
    },
    [isMyTurn, gameCode, targetingMode, selectedCard, selectedAbility, activateAbility, playCard],
  );

  if (isLoading || !gameState || !currentPlayer || !opponent) {
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
        <Button onClick={() => navigate('/')} className={styles.returnButton}>
          Return to Main Menu
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameLayout
        currentPhase={gameState.phase}
        onPhaseChange={changePhase}
        playerState={{
          ...currentPlayer,
          activeLayer: currentLayer,
          activeEffects: gameState.activeEffects.filter(
            (effect) =>
              effect.target === currentPlayer.id ||
              currentPlayer.field.some((card) => card?.id === effect.target),
          ),
        }}
        opponentState={{
          ...opponent,
          activeLayer: currentLayer,
          activeEffects: gameState.activeEffects.filter(
            (effect) =>
              effect.target === opponent.id ||
              opponent.field.some((card) => card?.id === effect.target),
          ),
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
