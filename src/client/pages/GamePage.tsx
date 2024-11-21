import { GameLayout } from '@components/game/GameLayout';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import type { Layer } from '@shared/types/cards';
import type { GamePhase, PlayerState } from '@shared/types/game';
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

  // Local UI state
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

  // Clear selections when turn changes
  useEffect(() => {
    if (!isMyTurn) {
      setSelectedCard(null);
      setSelectedAbility(null);
      setTargetingMode(null);
    }
  }, [isMyTurn]);

  // Game over condition
  useEffect(() => {
    if (gameState?.status === 'finished' && gameState.winner) {
      const isWinner = gameState.winner === currentPlayer?.id;
      navigate('/game-over', { state: { result: isWinner ? 'You won!' : 'You lost!' } });
    }
  }, [gameState?.status, currentPlayer?.id, navigate, gameState?.winner]);

  // Card selection handler
  const handleCardSelect = useCallback(
    (cardId: string) => {
      if (!isMyTurn) return;
      if (targetingMode) return;
      setSelectedCard(cardId === selectedCard ? null : cardId);
    },
    [isMyTurn, selectedCard, targetingMode],
  );

  // Slot selection handler
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

  const handlePhaseChange = useCallback(
    async (newPhase: GamePhase) => {
      if (!isMyTurn || !gameCode) return;
      await changePhase(newPhase);
    },
    [isMyTurn, gameCode, changePhase],
  );

  const handleLayerChange = useCallback(
    async (layer: Layer) => {
      if (!isMyTurn || !gameCode) return;
      setCurrentLayer(layer);
      await changeLayer(layer);
    },
    [isMyTurn, gameCode, changeLayer],
  );

  const handleEndTurn = useCallback(async () => {
    if (!isMyTurn || !gameCode) return;
    await endTurn();
  }, [isMyTurn, gameCode, endTurn]);

  const handleSurrender = useCallback(async () => {
    if (!gameCode) return;
    await surrender();
    setShowSurrenderModal(false);
  }, [gameCode, surrender]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>Entering the ethereal plane...</span>
      </div>
    );
  }

  if (error || !gameState) {
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

  if (!currentPlayer || !opponent) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>Synchronizing with the void...</span>
      </div>
    );
  }

  // Convert current player and opponent to PlayerState
  const playerState: PlayerState = {
    ...currentPlayer,
    activeLayer: currentLayer,
    activeEffects: gameState.activeEffects.filter(
      (effect) =>
        effect.target === currentPlayer.id ||
        currentPlayer.field.some((card) => card?.id === effect.target),
    ),
  };

  const opponentState: PlayerState = {
    ...opponent,
    activeLayer: currentLayer,
    activeEffects: gameState.activeEffects.filter(
      (effect) =>
        effect.target === opponent.id || opponent.field.some((card) => card?.id === effect.target),
    ),
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundOverlay} />

      <GameLayout
        currentPhase={gameState.phase}
        onPhaseChange={handlePhaseChange}
        playerState={playerState}
        opponentState={opponentState}
        onCardSelect={handleCardSelect}
        onSlotSelect={handleSlotSelect}
        selectedCard={selectedCard}
        onAbilityActivate={activateAbility}
        onLayerChange={handleLayerChange}
        onEndTurn={handleEndTurn}
        onSurrender={() => setShowSurrenderModal(true)}
        isMyTurn={isMyTurn}
        targetingMode={targetingMode}
        turn={gameState.turn}
      />

      {showSurrenderModal && (
        <Modal title="Confirm Surrender" onClose={() => setShowSurrenderModal(false)}>
          <div className={styles.surrenderModal}>
            <p>Are you sure you want to surrender this game?</p>
            <div className={styles.modalButtons}>
              <Button onClick={handleSurrender} className={styles.surrenderButton}>
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
