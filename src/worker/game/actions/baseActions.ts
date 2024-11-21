import type { GameAction, GameState } from '@shared/types/game';
import { Errors } from '@worker/utils/errors';

export function createGameAction(type: string, playerId: string, data: any): GameAction {
  return {
    type,
    playerId,
    timestamp: Date.now(),
    data,
  };
}

export const baseActionValidators = {
  validateTurn: (state: GameState, playerId: string): boolean => {
    return state.currentPlayer === playerId;
  },

  validatePhase: (state: GameState, expectedPhase: string): boolean => {
    return state.phase === expectedPhase;
  },

  validateResources: (
    state: GameState,
    playerId: string,
    costs: Record<string, number>,
  ): boolean => {
    const player = state.players[playerId];
    if (!player) {
      throw Errors.NOT_FOUND('Player not found');
    }

    return Object.entries(costs).every(
      ([resource, cost]) => player.resources[resource as keyof typeof player.resources] >= cost,
    );
  },
};

export const baseActionHandlers = {
  deductResources: (
    state: GameState,
    playerId: string,
    costs: Record<string, number>,
  ): GameState => {
    const player = state.players[playerId];
    if (!player) {
      throw Errors.NOT_FOUND('Player not found');
    }

    Object.entries(costs).forEach(([resource, cost]) => {
      player.resources[resource as keyof typeof player.resources] -= cost;
    });

    return state;
  },

  addToHistory: (state: GameState, action: GameAction): GameState => {
    state.history.push(action);
    return state;
  },
};
