import { gameAPI } from '@client/utils/api-client';
import type { PhaseType, GameState, GameSyncActions, GameSyncState, Layer } from '@shared/types';
import { useCallback, useState } from 'react';
import useSWR from 'swr';

const gameFetcher = async (gameCode: string): Promise<GameState> => {
  if (!gameCode) throw new Error('Game code is required');
  return gameAPI.getState(gameCode);
};

export function useGameSync(
  gameCode: string | undefined,
  profile: { id: string } | null,
): GameSyncState & GameSyncActions {
  const [error, setError] = useState<Error | null>(null);
  const [currentLayer, setCurrentLayer] = useState<Layer>('material');

  // SWR configuration for game state polling
  const {
    data: gameState,
    error: fetchError,
    mutate: refreshGameState,
  } = useSWR<GameState>(
    gameCode ? `/api/game/state?gameCode=${gameCode}` : null,
    ([_, code]) => gameFetcher(code),
    {
      refreshInterval: 2000,
      refreshWhenHidden: true,
      revalidateOnFocus: true,
      onError: (err) => setError(err),
    },
  );

  // Derive current player and opponent IDs
  const currentPlayerId = profile?.id ?? null;
  const opponentId =
    gameState && currentPlayerId
      ? (Object.keys(gameState.players).find((id) => id !== currentPlayerId) ?? null)
      : null;

  // Check if it's current player's turn
  const isMyTurn = Boolean(
    gameState &&
      currentPlayerId &&
      gameState.status === 'active' &&
      gameState.currentPlayer === currentPlayerId,
  );

  // Game actions
  const playCard = useCallback(
    async (cardId: string, position: number) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.playCard(gameCode, cardId, position);
        await refreshGameState();
      } catch (error) {
        console.error('Failed to play card:', error);
        setError(error instanceof Error ? error : new Error('Failed to play card'));
      }
    },
    [gameCode, isMyTurn, refreshGameState],
  );

  const activateAbility = useCallback(
    async (cardId: string, abilityIndex: number, targets: string[]) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.activateAbility(gameCode, cardId, abilityIndex, targets);
        await refreshGameState();
      } catch (error) {
        console.error('Failed to activate ability:', error);
        setError(error instanceof Error ? error : new Error('Failed to activate ability'));
      }
    },
    [gameCode, isMyTurn, refreshGameState],
  );

  const changePhase = useCallback(
    async (phase: PhaseType) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.changePhase(gameCode, phase);
        await refreshGameState();
      } catch (error) {
        console.error('Failed to change phase:', error);
        setError(error instanceof Error ? error : new Error('Failed to change phase'));
      }
    },
    [gameCode, isMyTurn, refreshGameState],
  );

  const changeLayer = useCallback(
    async (layer: Layer) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.changeLayer(gameCode, layer);
        setCurrentLayer(layer);
        await refreshGameState();
      } catch (error) {
        console.error('Failed to change layer:', error);
        setError(error instanceof Error ? error : new Error('Failed to change layer'));
      }
    },
    [gameCode, isMyTurn, refreshGameState],
  );

  const endTurn = useCallback(async () => {
    if (!gameCode || !isMyTurn) return;

    try {
      await gameAPI.endTurn(gameCode);
      await refreshGameState();
    } catch (error) {
      console.error('Failed to end turn:', error);
      setError(error instanceof Error ? error : new Error('Failed to end turn'));
    }
  }, [gameCode, isMyTurn, refreshGameState]);

  // Manual refresh function
  const refreshState = useCallback(async () => {
    try {
      await refreshGameState();
    } catch (error) {
      console.error('Failed to refresh game state:', error);
      setError(error instanceof Error ? error : new Error('Failed to refresh game state'));
    }
  }, [refreshGameState]);

  return {
    gameState: gameState || null,
    isLoading: !gameState && !error && gameCode !== undefined,
    error: error || fetchError,
    currentPlayerId,
    opponentId,
    isMyTurn,
    currentPhase: gameState?.phase || 'init',
    currentLayer,
    refreshState,
    playCard,
    activateAbility,
    changePhase,
    changeLayer,
    endTurn,
  };
}
