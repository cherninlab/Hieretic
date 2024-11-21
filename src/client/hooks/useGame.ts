import type { GamePhase, GameState, GameStateResponse, PlayerState } from '@shared/types/game';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { gameAPI } from '../utils/api-client';
import { useProfile } from './useProfile';

interface UseGameReturn {
  // Game state
  gameState: GameState | null;
  isLoading: boolean;
  error: Error | null;

  // Player states
  currentPlayer: PlayerState | null;
  opponent: PlayerState | null;

  // Game actions
  createGame: () => Promise<void>;
  joinGame: (gameCode: string) => Promise<void>;
  startGame: (gameCode: string) => Promise<void>;
  playCard: (cardId: string, position: number) => Promise<void>;
  changePhase: (phase: GamePhase) => Promise<void>;
  endTurn: () => Promise<void>;
  activateAbility: (cardId: string, abilityIndex: number, targets: string[]) => Promise<void>;
  changeLayer: (layer: 'material' | 'mind' | 'void') => Promise<void>;
  surrender: () => Promise<void>;

  // State management
  mutateGameState: () => Promise<void>;
  isMyTurn: boolean;
}

export function useGame(gameCode?: string): UseGameReturn {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch game state with SWR
  const {
    data: gameStateResponse,
    error: gameError,
    mutate: mutateGameStateResponse,
  } = useSWR<GameStateResponse>(
    gameCode ? `/game/state?gameCode=${gameCode}` : null,
    gameCode
      ? async () => {
          const response = await gameAPI.getState(gameCode);
          return response as GameStateResponse;
        }
      : null,
    {
      refreshInterval: 2000,
      refreshWhenHidden: true,
      revalidateOnFocus: true,
    },
  );

  // Convert GameStateResponse to GameState
  const gameState: GameState | null = gameStateResponse
    ? {
        ...gameStateResponse,
        players: Object.keys(gameStateResponse.playerStates).reduce(
          (acc, playerId) => {
            acc[playerId] = {
              ...gameStateResponse.playerStates[playerId],
              resources: gameStateResponse.playerStates[playerId].resources as {
                material: number;
                mind: number;
                void: number;
              },
              id: playerId,
              activeLayer: gameStateResponse.playerStates[playerId].activeLayer || 'material',
            };
            return acc;
          },
          {} as Record<string, PlayerState>,
        ),
      }
    : null;

  // Extract current player and opponent states
  const currentPlayer = gameState && profile ? extractPlayerState(gameState, profile.id) : null;
  const opponent = gameState && profile ? extractOpponentState(gameState, profile.id) : null;

  const isMyTurn = Boolean(gameState && profile && gameState.currentPlayer === profile.id);

  // Game creation
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

  // Game joining
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

  // Game starting
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

  // Game actions
  const playCard = useCallback(
    async (cardId: string, position: number) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.playCard(gameCode, cardId, position);
        await mutateGameStateResponse();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to play card'));
      }
    },
    [gameCode, isMyTurn, mutateGameStateResponse],
  );

  const changePhase = useCallback(
    async (phase: GamePhase) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.changePhase(gameCode, phase);
        await mutateGameStateResponse();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to change phase'));
      }
    },
    [gameCode, isMyTurn, mutateGameStateResponse],
  );

  const endTurn = useCallback(async () => {
    if (!gameCode || !isMyTurn) return;

    try {
      await gameAPI.endTurn(gameCode);
      await mutateGameStateResponse();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to end turn'));
    }
  }, [gameCode, isMyTurn, mutateGameStateResponse]);

  const activateAbility = useCallback(
    async (cardId: string, abilityIndex: number, targets: string[]) => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.activateAbility(gameCode, cardId, abilityIndex, targets);
        await mutateGameStateResponse();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to activate ability'));
      }
    },
    [gameCode, isMyTurn, mutateGameStateResponse],
  );

  const changeLayer = useCallback(
    async (layer: 'material' | 'mind' | 'void') => {
      if (!gameCode || !isMyTurn) return;

      try {
        await gameAPI.changeLayer(gameCode, layer);
        await mutateGameStateResponse();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to change layer'));
      }
    },
    [gameCode, isMyTurn, mutateGameStateResponse],
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
    gameState: gameState || null,
    isLoading,
    error: error || gameError || null,
    currentPlayer,
    opponent,
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
      await mutateGameStateResponse();
    },
    isMyTurn,
  };
}

// Helper functions
function extractPlayerState(gameState: GameState, playerId: string): PlayerState | null {
  const playerState = gameState.players[playerId];
  if (!playerState) return null;

  return {
    ...playerState,
    resources: playerState.resources as {
      material: number;
      mind: number;
      void: number;
    },
    id: playerId,
    activeLayer: playerState.activeLayer,
  };
}

function extractOpponentState(gameState: GameState, playerId: string): PlayerState | null {
  const opponentId = Object.keys(gameState.players).find((id) => id !== playerId);
  if (!opponentId) return null;

  const opponentState = gameState.players[opponentId];
  if (!opponentState) return null;

  return {
    ...opponentState,
    resources: opponentState.resources as {
      material: number;
      mind: number;
      void: number;
    },
    id: opponentId,
    activeLayer: opponentState.activeLayer,
  };
}
