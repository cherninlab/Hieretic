import { GameAction, GameState } from '@shared/types/game';
import { GameActionTypes } from '@worker/game/actions/types';

export const actionValidators = {
  [GameActionTypes.PLAY_CARD]: (state: GameState, action: GameAction): boolean => {
    const player = state.players[action.playerId];
    if (!player) return false;
    if (state.phase !== 'main') return false;

    const { cardId, position } = action.data;
    if (position < 0 || position >= 4) return false;
    if (player.field[position] !== null) return false;

    const card = player.hand.find((c) => c.id === cardId);
    if (!card) return false;

    return player.resources[player.activeLayer] >= card.cost[player.activeLayer];
  },

  [GameActionTypes.CHANGE_PHASE]: (state: GameState, action: GameAction): boolean => {
    if (state.currentPlayer !== action.playerId) return false;
    const { phase } = action.data;
    const validPhases = ['draw', 'main', 'combat', 'end'];
    return validPhases.includes(phase);
  },

  // Add other validators as needed
};

export function validateAction(state: GameState, action: GameAction): boolean {
  // Common validations
  if (state.status !== 'active') return false;
  if (state.currentPlayer !== action.playerId) return false;

  // Action-specific validation
  const validator = actionValidators[action.type as keyof typeof actionValidators];
  return validator ? validator(state, action) : false;
}
