import { Card } from '@shared/types/cards';
import type { GameAction, GameState } from '@shared/types/game';
import { Errors } from '@worker/utils/errors';
import { GameActionTypes } from './types';

// Helper function to check if player has enough resources
function hasEnoughResources(
  playerResources: Record<string, number>,
  requiredResources: Record<string, number>,
): boolean {
  return Object.entries(requiredResources).every(
    ([resource, cost]) => (playerResources[resource as keyof typeof playerResources] || 0) >= cost,
  );
}

export const actionHandlers = {
  [GameActionTypes.PLAY_CARD]: (state: GameState, action: GameAction): GameState => {
    const { cardId, position } = action.data;
    const player = state.players[action.playerId];
    if (!player) throw Errors.NOT_FOUND('Player not found');

    // Get card from hand
    const cardIndex = player.hand.findIndex((card: Card) => card.id === cardId);
    if (cardIndex === -1) throw Errors.INVALID_INPUT('Card not in hand');
    const card = player.hand[cardIndex];

    // Get required resources based on card layer
    const requiredResources = {
      [player.activeLayer]: card.cost[player.activeLayer],
    };

    // Validate resources
    if (!hasEnoughResources(player.resources, requiredResources)) {
      throw Errors.INVALID_INPUT('Insufficient resources');
    }

    // Update hand and field
    const newHand = [...player.hand];
    newHand.splice(cardIndex, 1);
    const newField = [...player.field];
    newField[position] = card;

    // Update resources
    const newResources = { ...player.resources };
    Object.entries(card.cost).forEach(([resource, cost]) => {
      const typedCost = cost as number; // Explicitly type cost as number
      newResources[resource as keyof typeof newResources] =
        (newResources[resource as keyof typeof newResources] || 0) - typedCost;
    });

    return {
      ...state,
      players: {
        ...state.players,
        [action.playerId]: {
          ...player,
          hand: newHand,
          field: newField,
          resources: newResources,
        },
      },
    };
  },

  [GameActionTypes.CHANGE_PHASE]: (state: GameState, action: GameAction): GameState => {
    const { phase } = action.data;
    if (!['draw', 'main', 'combat', 'end'].includes(phase)) {
      throw Errors.INVALID_INPUT('Invalid phase');
    }
    return { ...state, phase };
  },

  [GameActionTypes.END_TURN]: (state: GameState, action: GameAction): GameState => {
    const player = state.players[action.playerId];
    if (!player) throw Errors.NOT_FOUND('Player not found');

    // Determine the next player
    const players = Object.keys(state.players);
    const currentIndex = players.indexOf(action.playerId);
    const nextPlayerIndex = (currentIndex + 1) % players.length;
    const nextPlayerId = players[nextPlayerIndex];

    return {
      ...state,
      currentPlayer: nextPlayerId,
      phase: 'draw',
    };
  },

  [GameActionTypes.SPEND_RESOURCES]: (state: GameState, action: GameAction): GameState => {
    const { resources } = action.data;
    const player = state.players[action.playerId];
    if (!player) throw Errors.NOT_FOUND('Player not found');

    // Validate resources
    if (!hasEnoughResources(player.resources, resources)) {
      throw Errors.INVALID_INPUT('Insufficient resources');
    }

    // Deduct resources
    const newResources = { ...player.resources };
    Object.entries(resources).forEach(([resource, cost]) => {
      const typedCost = cost as number; // Explicitly type cost as number
      newResources[resource as keyof typeof newResources] =
        (newResources[resource as keyof typeof newResources] || 0) - typedCost;
    });

    return {
      ...state,
      players: {
        ...state.players,
        [action.playerId]: {
          ...player,
          resources: newResources,
        },
      },
      history: [...state.history, action],
    };
  },

  [GameActionTypes.GAIN_RESOURCES]: (state: GameState, action: GameAction): GameState => {
    const { resources } = action.data;
    const player = state.players[action.playerId];
    if (!player) throw Errors.NOT_FOUND('Player not found');

    // Add resources
    const newResources = { ...player.resources };
    Object.entries(resources).forEach(([resource, amount]) => {
      const typedAmount = amount as number; // Explicitly type amount as number
      newResources[resource as keyof typeof newResources] =
        (newResources[resource as keyof typeof newResources] || 0) + typedAmount;
    });

    return {
      ...state,
      players: {
        ...state.players,
        [action.playerId]: {
          ...player,
          resources: newResources,
        },
      },
      history: [...state.history, action],
    };
  },
};

export function handleAction(state: GameState, action: GameAction): GameState {
  const handler = actionHandlers[action.type as keyof typeof actionHandlers];
  if (!handler) throw Errors.INVALID_INPUT(`Unknown action type: ${action.type}`);
  return handler(state, action);
}
