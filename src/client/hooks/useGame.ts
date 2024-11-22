import type { GamePhase, GameState } from '@shared/types/game';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { gameAPI } from '../utils/api-client';
import { useProfile } from './useProfile';

export function useGame(gameCode?: string) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: gameState,
    error: gameError,
    mutate: mutateGameState,
  } = useSWR<GameState>(
    gameCode ? `/game/state?gameCode=${gameCode}` : null,
    gameCode ? () => gameAPI.getState(gameCode) : null,
    {
      refreshInterval: 2000,
      refreshWhenHidden: true,
      revalidateOnFocus: true,
    },
  );

  // Extract current player and opponent states
  const currentPlayer = gameState && profile ? gameState.players[profile.id] || null : null;

  const opponent =
    gameState && profile
      ? Object.values(gameState.players).find((p) => p.id !== profile.id) || null
      : null;

  const isMyTurn = Boolean(gameState && profile && gameState.currentPlayer === profile.id);

  const createGame = useCallback(async () => {
    if (!profile) return;

    try {
      setIsLoading(true);
      setError(null);
      const { gameCode } = await gameAPI.create();
      navigate(`/lobby/${gameCode}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create game'));
    } finally {
      setIsLoading(false);
    }
  }, [navigate, profile]);

  const joinGame = useCallback(
    async (gameCode: string) => {
      if (!profile) return;

      try {
        setIsLoading(true);
        setError(null);
        await gameAPI.join(gameCode);
        navigate(`/lobby/${gameCode}`);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to join game'));
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, profile],
  );

  const startGame = useCallback(
    async (gameCode: string) => {
      try {
        setIsLoading(true);
        setError(null);
        await gameAPI.start(gameCode);
        navigate(`/game/${gameCode}`);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to start game'));
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  const playCard = useCallback(
    async (cardId: string, position: number) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.playCard(gameCode, cardId, position);
        await mutateGameState();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to play card'));
      }
    },
    [gameCode, isMyTurn, mutateGameState],
  );

  const changePhase = useCallback(
    async (phase: GamePhase) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.changePhase(gameCode, phase);
        await mutateGameState();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to change phase'));
      }
    },
    [gameCode, isMyTurn, mutateGameState],
  );

  const endTurn = useCallback(async () => {
    if (!gameCode || !isMyTurn) return;

    try {
      await gameAPI.endTurn(gameCode);
      await mutateGameState();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to end turn'));
    }
  }, [gameCode, isMyTurn, mutateGameState]);

  const activateAbility = useCallback(
    async (cardId: string, abilityIndex: number, targets: string[]) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.activateAbility(gameCode, cardId, abilityIndex, targets);
        await mutateGameState();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to activate ability'));
      }
    },
    [gameCode, isMyTurn, mutateGameState],
  );

  const changeLayer = useCallback(
    async (layer: 'material' | 'mind' | 'void') => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.changeLayer(gameCode, layer);
        await mutateGameState();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to change layer'));
      }
    },
    [gameCode, isMyTurn, mutateGameState],
  );

  const surrender = useCallback(async () => {
    if (!gameCode) return;

    try {
      await gameAPI.surrender(gameCode);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to surrender'));
    }
  }, [gameCode, navigate]);

  return {
    gameState,
    currentPlayer,
    opponent,
    isLoading,
    error: error || gameError,
    createGame,
    joinGame,
    startGame,
    playCard,
    changePhase,
    endTurn,
    activateAbility,
    changeLayer,
    surrender,
    mutateGameState: async () => {
      await mutateGameState();
    },
    isMyTurn,
  };
}
