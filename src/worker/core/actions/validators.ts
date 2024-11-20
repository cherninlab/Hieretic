import type { GameAction, GameState, Layer, PhaseType, UnitCard } from '@shared/types';
import {
  areTargetsValid,
  findCardInHand,
  findCardOnField,
  hasEnoughResources,
  isCorrectLayer,
  isCorrectPhase,
  isGameActive,
  isPlayersTurn,
  isValidAttackTarget,
  isValidFieldPosition,
  isValidLayer,
  isValidPhaseTransition,
} from '@worker/utils/actionUtils';

/**
 * Primary validation function for all actions
 */
export function validateAction(state: GameState, action: GameAction): boolean {
  // Basic state validations
  if (!isGameActive(state)) return false;
  if (!isPlayersTurn(state, action.playerId)) return false;

  // Get validator for action type
  const validator = actionValidators[action.type];
  if (!validator) return false;

  try {
    return validator(state, action);
  } catch (error) {
    console.error(`Validation error for ${action.type}:`, error);
    return false;
  }
}

/**
 * Individual action validators
 */
const actionValidators: Record<string, (state: GameState, action: GameAction) => boolean> = {
  /**
   * Validate PLAY_CARD action
   */
  PLAY_CARD: (state: GameState, action: GameAction): boolean => {
    const { cardId, position } = action.data;
    const player = state.players[action.playerId];

    // Phase validation
    if (!isCorrectPhase(state, 'main')) return false;

    // Card validation
    const card = findCardInHand(player, cardId);
    if (!card) return false;

    // Position validation
    if (!isValidFieldPosition(player, position)) return false;

    // Layer validation
    if (!isCorrectLayer(player, card)) return false;

    // Resource validation
    if (!hasEnoughResources(player, card.cost)) return false;

    return true;
  },

  /**
   * Validate ACTIVATE_ABILITY action
   */
  ACTIVATE_ABILITY: (state: GameState, action: GameAction): boolean => {
    const { cardId, abilityIndex, targets } = action.data;
    const player = state.players[action.playerId];

    // Find card and ability
    const card = findCardOnField(player.field, cardId);
    if (!card || card.type !== 'unit') return false;

    const unitCard = card as UnitCard;
    const ability = unitCard.abilities?.[abilityIndex];
    if (!ability) return false;

    // Phase validation if ability is phase-restricted
    if (ability.phase && !isCorrectPhase(state, ability.phase)) return false;

    // Resource validation if ability has cost
    if (ability.cost && !hasEnoughResources(player, ability.cost)) return false;

    // Target validation
    if (!areTargetsValid(state, player, ability, targets)) return false;

    return true;
  },

  /**
   * Validate CHANGE_PHASE action
   */
  CHANGE_PHASE: (state: GameState, action: GameAction): boolean => {
    const { phase } = action.data as { phase: PhaseType };

    // Validate phase order
    return isValidPhaseTransition(state.phase, phase);
  },

  /**
   * Validate CHANGE_LAYER action
   */
  CHANGE_LAYER: (state: GameState, action: GameAction): boolean => {
    const { layer } = action.data as { layer: Layer };

    // Can only change layer during main phase
    if (!isCorrectPhase(state, 'main')) return false;

    return isValidLayer(layer);
  },

  /**
   * Validate END_TURN action
   */
  END_TURN: (state: GameState, _action: GameAction): boolean => {
    // Can only end turn during end phase
    return isCorrectPhase(state, 'end');
  },

  /**
   * Validate DECLARE_ATTACK action
   */
  DECLARE_ATTACK: (state: GameState, action: GameAction): boolean => {
    const { attackerId, targetId } = action.data;
    const player = state.players[action.playerId];

    // Phase validation
    if (!isCorrectPhase(state, 'combat')) return false;

    // Attacker validation
    const attackingCard = findCardOnField(player.field, attackerId);
    if (!attackingCard || attackingCard.type !== 'unit') return false;

    // Target validation
    if (!isValidAttackTarget(state, action.playerId, targetId)) return false;

    return true;
  },

  /**
   * Validate SURRENDER action
   */
  SURRENDER: (state: GameState, _action: GameAction): boolean => {
    // Can surrender at any time during an active game
    return isGameActive(state);
  },
};
