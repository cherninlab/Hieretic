import type { GameAction, GameState, Layer, PhaseType } from '@shared/types';
import {
  applyEffect,
  findCardOnField,
  findDefender,
  hasEnoughResources,
  isUnitCard,
  phases,
  resolveCombat,
  spendResources,
  validateTargets,
} from '@worker/utils/actionUtils';
import { HTTPException } from 'hono/http-exception';

/**
 * Main action handler
 */
export function handleAction(state: GameState, action: GameAction): GameState {
  if (state.status !== 'active') {
    throw new HTTPException(400, { message: 'Game is not active' });
  }

  if (state.currentPlayer !== action.playerId) {
    throw new HTTPException(400, { message: 'Not your turn' });
  }

  const handler = actionHandlers[action.type];
  if (!handler) {
    throw new HTTPException(400, { message: 'Invalid action type' });
  }

  try {
    return handler(state, action);
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Action handler failed' });
  }
}

/**
 * Action handler implementations
 */
const actionHandlers: Record<string, (state: GameState, action: GameAction) => GameState> = {
  /**
   * Play a card from hand to field
   */
  PLAY_CARD: (state: GameState, action: GameAction) => {
    const { cardId, position } = action.data;
    const player = state.players[action.playerId];

    // Verify it's main phase
    if (state.phase !== 'main') {
      throw new HTTPException(400, { message: 'Can only play cards during main phase' });
    }

    // Find card in hand
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new HTTPException(400, { message: 'Card not in hand' });
    }

    const card = player.hand[cardIndex];

    // Verify position is valid
    if (position < 0 || position >= player.field.length) {
      throw new HTTPException(400, { message: 'Invalid position' });
    }
    if (player.field[position] !== null) {
      throw new HTTPException(400, { message: 'Position already occupied' });
    }

    // Verify layer matches
    if (card.layer !== player.activeLayer) {
      throw new HTTPException(400, { message: 'Card layer does not match active layer' });
    }

    // Verify resources
    if (!hasEnoughResources(player, card.cost)) {
      throw new HTTPException(400, { message: 'Not enough resources' });
    }

    // Update state
    const newPlayer = {
      ...player,
      hand: [...player.hand],
      field: [...player.field],
      resources: spendResources(player.resources, card.cost),
    };

    newPlayer.hand.splice(cardIndex, 1);
    newPlayer.field[position] = card;

    return {
      ...state,
      players: {
        ...state.players,
        [action.playerId]: newPlayer,
      },
    };
  },

  /**
   * Activate a card's ability
   */
  ACTIVATE_ABILITY: (state: GameState, action: GameAction) => {
    const { cardId, abilityIndex, targets } = action.data;
    const player = state.players[action.playerId];

    // Find card on field
    const card = findCardOnField(player.field, cardId);

    if (!card) {
      throw new HTTPException(400, { message: 'Card not found on field' });
    }

    if (!isUnitCard(card)) {
      throw new HTTPException(400, { message: 'Card must be a unit to activate abilities' });
    }

    // Verify card has ability
    if (!card.abilities || !card.abilities[abilityIndex]) {
      throw new HTTPException(400, { message: 'Invalid ability' });
    }

    const ability = card.abilities[abilityIndex];

    // Verify ability cost
    if (ability.cost && !hasEnoughResources(player, ability.cost)) {
      throw new HTTPException(400, { message: 'Not enough resources for ability' });
    }

    // Validate targets
    validateTargets(state, player, ability, targets);

    // Apply ability effect
    const newState = applyEffect(state, {
      ...ability,
      sourceId: cardId,
      targetIds: targets,
      playerId: action.playerId,
    });

    // Spend resources if ability has cost
    if (ability.cost) {
      newState.players[action.playerId].resources = spendResources(
        newState.players[action.playerId].resources,
        ability.cost,
      );
    }

    return newState;
  },

  /**
   * Change game phase
   */
  CHANGE_PHASE: (state: GameState, action: GameAction) => {
    const { phase } = action.data as { phase: PhaseType };
    const currentPhaseIndex = phases.indexOf(state.phase);
    const newPhaseIndex = phases.indexOf(phase);

    // Verify phase order
    if (newPhaseIndex <= currentPhaseIndex && phase !== 'end') {
      throw new HTTPException(400, { message: 'Invalid phase transition' });
    }

    return {
      ...state,
      phase,
    };
  },

  /**
   * Change active layer
   */
  CHANGE_LAYER: (state: GameState, action: GameAction) => {
    const { layer } = action.data as { layer: Layer };
    const player = state.players[action.playerId];

    // Only change layer during main phase
    if (state.phase !== 'main') {
      throw new HTTPException(400, { message: 'Can only change layer during main phase' });
    }

    return {
      ...state,
      players: {
        ...state.players,
        [action.playerId]: {
          ...player,
          activeLayer: layer,
        },
      },
    };
  },

  /**
   * End current turn
   */
  END_TURN: (state: GameState, action: GameAction) => {
    // Can only end turn during end phase
    if (state.phase !== 'end') {
      throw new HTTPException(400, { message: 'Can only end turn during end phase' });
    }

    // Find next player
    const players = Object.keys(state.players);
    const currentIndex = players.indexOf(action.playerId);
    const nextPlayer = players[(currentIndex + 1) % players.length];

    return {
      ...state,
      currentPlayer: nextPlayer,
      phase: 'draw',
      turn: state.turn + 1,
    };
  },

  /**
   * Declare attack
   */
  DECLARE_ATTACK: (state: GameState, action: GameAction) => {
    const { attackerId, targetId } = action.data;
    const attacker = state.players[action.playerId];

    // Verify combat phase
    if (state.phase !== 'combat') {
      throw new HTTPException(400, { message: 'Can only attack during combat phase' });
    }

    // Find attacking card
    const attackingCard = findCardOnField(attacker.field, attackerId);
    if (!attackingCard) {
      throw new HTTPException(400, { message: 'Attacking card not found' });
    }

    // Find defending card or player
    const defender = findDefender(state, action.playerId, targetId);
    if (!defender) {
      throw new HTTPException(400, { message: 'Invalid target' });
    }

    // Process combat
    return resolveCombat(state, {
      attackerId,
      targetId,
      attackingPlayerId: action.playerId,
    });
  },

  /**
   * Surrender game
   */
  SURRENDER: (state: GameState, action: GameAction) => {
    const winner = Object.keys(state.players).find((id) => id !== action.playerId);
    if (!winner) {
      throw new HTTPException(400, { message: 'Cannot surrender with no opponent' });
    }

    return {
      ...state,
      status: 'finished',
      winner,
    };
  },
};
