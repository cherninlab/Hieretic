import type {
  Card,
  CardCost,
  Effect,
  GameState,
  Layer,
  PhaseType,
  PlayerState,
  ResourceState,
  UnitCard,
} from '@shared/types';

export function isUnitCard(card: Card): card is UnitCard {
  return card.type === 'unit';
}

export const phases: PhaseType[] = ['draw', 'main', 'combat', 'end'];

export function hasEnoughResources(player: PlayerState, cost: CardCost): boolean {
  return Object.entries(cost).every(
    ([resource, amount]) => player.resources[resource as keyof typeof player.resources] >= amount,
  );
}

export function spendResources(current: ResourceState, cost: CardCost): ResourceState {
  // We need to ensure ResourceState matches the Record type specification
  const result: ResourceState = {
    material: Math.max(0, current.material - (cost.material || 0)),
    mind: Math.max(0, current.mind - (cost.mind || 0)),
  };
  return result;
}

export function findCardOnField(field: (Card | null)[], cardId: string): Card | null {
  return field.find((card) => card?.id === cardId) || null;
}

export function validateTargets(
  _state: GameState,
  _player: PlayerState,
  _ability: Effect,
  _targets: string[],
): void {
  // Target validation logic based on ability type
  // This would be expanded based on game rules
}

export function findDefender(
  _state: GameState,
  _attackingPlayerId: string,
  _targetId: string,
): { type: 'card' | 'player'; target: Card | PlayerState } | null {
  // Find defending card or player
  // This would be expanded based on game rules
  return null;
}

export function resolveCombat(
  state: GameState,
  _params: { attackerId: string; targetId: string; attackingPlayerId: string },
): GameState {
  // Combat resolution logic
  // This would be expanded based on game rules
  return state;
}

export function applyEffect(
  state: GameState,
  _effect: Effect & { sourceId: string; targetIds: string[]; playerId: string },
): GameState {
  // Effect application logic
  // This would be expanded based on game rules
  return state;
}

export function isGameActive(state: GameState): boolean {
  return state.status === 'active';
}

export function isPlayersTurn(state: GameState, playerId: string): boolean {
  return state.currentPlayer === playerId;
}

export function isCorrectPhase(state: GameState, phase: PhaseType): boolean {
  return state.phase === phase;
}

export function isValidLayer(layer: Layer): boolean {
  return ['material', 'mind'].includes(layer);
}

export function findCardInHand(player: PlayerState, cardId: string): Card | null {
  return player.hand.find((card) => card.id === cardId) || null;
}

export function isValidFieldPosition(player: PlayerState, position: number): boolean {
  return position >= 0 && position < player.field.length && player.field[position] === null;
}

export function isCorrectLayer(player: PlayerState, card: Card): boolean {
  return card.layer === player.activeLayer;
}

const PHASE_ORDER: PhaseType[] = ['draw', 'main', 'combat', 'end'];

export function isValidPhaseTransition(currentPhase: PhaseType, nextPhase: PhaseType): boolean {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  const nextIndex = PHASE_ORDER.indexOf(nextPhase);

  // Allow transitioning to the next phase or to end phase
  return nextIndex === currentIndex + 1 || nextPhase === 'end';
}

export function areTargetsValid(
  state: GameState,
  player: PlayerState,
  ability: Effect,
  targets: string[],
): boolean {
  // Target count validation
  if (ability.targetCount && targets.length !== ability.targetCount) {
    return false;
  }

  // Validate each target
  return targets.every((targetId) => {
    const target = findTarget(state, targetId);
    if (!target) return false;

    // Check target type
    switch (ability.target) {
      case 'self':
        return target.playerId === player.id;
      case 'enemy':
        return target.playerId !== player.id;
      case 'ally':
        return target.playerId === player.id;
      case 'all':
        return true;
      default:
        return false;
    }
  });
}

export function isValidAttackTarget(
  state: GameState,
  attackerId: string,
  targetId: string,
): boolean {
  const target = findTarget(state, targetId);
  if (!target) return false;

  // Can't attack own cards/player
  if (target.playerId === attackerId) return false;

  // Additional attack validation rules can be added here
  return true;
}

interface Target {
  type: 'card' | 'player';
  playerId: string;
  card?: Card;
}

export function findTarget(state: GameState, targetId: string): Target | null {
  // Check if target is a player
  if (state.players[targetId]) {
    return {
      type: 'player',
      playerId: targetId,
    };
  }

  // Check if target is a card on the field
  for (const [playerId, player] of Object.entries(state.players)) {
    const card = player.field.find((c) => c?.id === targetId);
    if (card) {
      return {
        type: 'card',
        playerId,
        card,
      };
    }
  }

  return null;
}
