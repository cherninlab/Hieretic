import type { PhaseType } from '@shared/types';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../utils/api-client';
import { useGameBoard } from './game/useGameBoard';
import { useGameLayer } from './game/useGameLayer';
import { useGameResources } from './game/useGameResources';
import { useGameSync } from './game/useGameSync';
import { useProfile } from './useProfile';

export function useGame(gameCode?: string) {
  const navigate = useNavigate();
  const { profile } = useProfile();

  // Initialize specialized hooks
  const { gameState, currentPlayerId, opponentId, isMyTurn, refreshState, isLoading, error } =
    useGameSync(gameCode, profile);

  const { currentLayer, cardsInLayer, playableCards, changeLayer } = useGameLayer(
    gameState,
    currentPlayerId,
    isMyTurn,
  );

  const {
    selectedCard,
    targetingMode,
    validPlayPositions,
    highlightedPositions,
    playerField,
    opponentField,
    selectCard,
    playCard,
    initiateAttack,
    initiateAbility,
    handleFieldSlotClick,
    cancelTargeting,
  } = useGameBoard(gameState, currentPlayerId, currentLayer, isMyTurn);

  const { currentResources, generation, canPlayCard, getResourceRequirement } = useGameResources(
    gameCode || '',
    currentPlayerId || '',
    gameState?.phase || 'init',
    isMyTurn,
  );

  // Game setup actions
  const createGame = useCallback(async () => {
    if (!profile) {
      console.error('No profile found');
      return;
    }

    try {
      const response = await gameAPI.create();

      // Validate the response has the expected structure
      if (!response?.gameCode) {
        throw new Error('Invalid response from game creation');
      }

      navigate(`/lobby/${response.gameCode}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  }, [profile, navigate]);

  const joinGame = useCallback(
    async (gameCode: string) => {
      if (!profile) {
        console.error('No profile found');
        return;
      }

      try {
        await gameAPI.join(gameCode);
        navigate(`/lobby/${gameCode}`);
      } catch (error) {
        console.error('Failed to join game:', error);
        throw error;
      }
    },
    [profile, navigate],
  );

  const startGame = useCallback(
    async (gameCode: string) => {
      try {
        await gameAPI.start(gameCode);
        navigate(`/game/${gameCode}`);
      } catch (error) {
        console.error('Failed to start game:', error);
        throw error;
      }
    },
    [navigate],
  );

  const leaveGame = useCallback(
    async (gameCode: string) => {
      if (!profile) return;

      try {
        await gameAPI.leave(gameCode);
        navigate('/');
      } catch (error) {
        console.error('Failed to leave game:', error);
        throw error;
      }
    },
    [profile, navigate],
  );

  const surrender = useCallback(async () => {
    if (!gameCode) return;

    try {
      await gameAPI.surrender(gameCode);
      navigate('/');
    } catch (error) {
      console.error('Failed to surrender:', error);
      throw error;
    }
  }, [gameCode, navigate]);

  // Game phase management
  const changePhase = useCallback(
    async (phase: PhaseType) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.changePhase(gameCode, phase);
        await refreshState();
      } catch (error) {
        console.error('Failed to change phase:', error);
        throw error;
      }
    },
    [gameCode, isMyTurn, refreshState],
  );

  const endTurn = useCallback(async () => {
    if (!gameCode || !isMyTurn) return;

    try {
      await gameAPI.endTurn(gameCode);
      await refreshState();
    } catch (error) {
      console.error('Failed to end turn:', error);
      throw error;
    }
  }, [gameCode, isMyTurn, refreshState]);

  // Card ability activation
  const activateAbility = useCallback(
    async (cardId: string, abilityIndex: number, targets: string[]) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.activateAbility(gameCode, cardId, abilityIndex, targets);
        await refreshState();
        cancelTargeting();
      } catch (error) {
        console.error('Failed to activate ability:', error);
        throw error;
      }
    },
    [gameCode, isMyTurn, refreshState, cancelTargeting],
  );

  // Game state validation
  const canEndTurn = useMemo(() => {
    if (!isMyTurn || !gameState) return false;
    return gameState.phase === 'end';
  }, [isMyTurn, gameState]);

  return {
    // Game state
    gameState,
    currentPlayerId,
    opponentId,
    isMyTurn,
    currentPhase: gameState?.phase || 'init',
    isLoading,
    error,

    // Board state
    selectedCard,
    targetingMode,
    playerField,
    opponentField,
    validPlayPositions,
    highlightedPositions,

    // Layer state
    currentLayer,
    cardsInLayer,

    // Resources
    resources: currentResources,
    resourceGeneration: generation,

    // Derived states
    canEndTurn,
    playableCards,
    validTargets: highlightedPositions,

    // Actions
    createGame,
    joinGame,
    startGame,
    leaveGame,
    surrender,
    playCard,
    activateAbility,
    changePhase,
    endTurn,
    selectCard,
    initiateAttack,
    initiateAbility,
    cancelAction: cancelTargeting,
    changeLayer,
    refreshState,

    // Utility functions
    canPlayCard,
    getResourceRequirement,
    handleFieldSlotClick,
  };
}
