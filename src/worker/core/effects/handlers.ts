import type { Card, Effect, GameEvent, GameState, UnitCard } from '@shared/types';
import { HTTPException } from 'hono/http-exception';

export interface ProcessedEffect {
  state: GameState;
  events: GameEvent[];
}

/**
 * Process all active effects in the game state
 */
export async function processEffects(state: GameState): Promise<ProcessedEffect> {
  let currentState = { ...state };
  const events: GameEvent[] = [];

  try {
    // Process global effects
    for (const effect of state.activeEffects) {
      const { state: newState, events: newEvents } = await processEffect(
        currentState,
        effect,
        null,
      );
      currentState = newState;
      events.push(...newEvents);
    }

    // Process player effects
    for (const [playerId, playerState] of Object.entries(currentState.players)) {
      for (const effect of playerState.activeEffects) {
        const { state: newState, events: newEvents } = await processEffect(
          currentState,
          effect,
          playerId,
        );
        currentState = newState;
        events.push(...newEvents);
      }
    }

    // Process field effects (card abilities)
    for (const [playerId, playerState] of Object.entries(currentState.players)) {
      for (const card of playerState.field) {
        if (!card || !('abilities' in card)) continue;

        const unitCard = card as UnitCard;
        for (const ability of unitCard.abilities || []) {
          if (ability.trigger === 'onPhase' && ability.phase === currentState.phase) {
            const { state: newState, events: newEvents } = await processEffect(
              currentState,
              ability,
              playerId,
              card.id,
            );
            currentState = newState;
            events.push(...newEvents);
          }
        }
      }
    }

    // Remove expired effects
    currentState = removeExpiredEffects(currentState);

    return { state: currentState, events };
  } catch (error) {
    console.error('Error processing effects:', error);
    throw new HTTPException(500, { message: 'Failed to process effects' });
  }
}

/**
 * Process a single effect
 */
async function processEffect(
  state: GameState,
  effect: Effect,
  playerId: string | null,
  sourceCardId?: string,
): Promise<ProcessedEffect> {
  const handler = effectHandlers[effect.type];
  if (!handler) {
    throw new HTTPException(400, { message: `Invalid effect type: ${effect.type}` });
  }

  const events: GameEvent[] = [];
  let newState = { ...state };

  try {
    const result = await handler(newState, effect, playerId, sourceCardId);
    newState = result.state;
    events.push(...result.events);

    // Update effect duration if it's a temporary effect
    if (effect.duration) {
      effect.duration--;
    }

    return { state: newState, events };
  } catch (error) {
    console.error('Error processing effect:', error);
    throw error;
  }
}

/**
 * Effect type handlers
 */
const effectHandlers: Record<
  string,
  (
    state: GameState,
    effect: Effect,
    playerId: string | null,
    sourceCardId?: string,
  ) => Promise<ProcessedEffect>
> = {
  /**
   * Direct damage effect
   */
  damage: async (state, effect, playerId, sourceCardId) => {
    const events: GameEvent[] = [];
    let newState = { ...state };

    const targets = resolveTargets(newState, effect.target, playerId);
    for (const target of targets) {
      if (target.type === 'player') {
        // Apply damage to player
        const player = newState.players[target.id];
        player.health -= effect.value;

        events.push({
          type: 'DAMAGE_DEALT',
          targetId: target.id,
          sourceId: sourceCardId,
          value: effect.value,
          timestamp: Date.now(),
        });
      } else {
        // Apply damage to unit
        const card = target.card as UnitCard;
        if (card.type !== 'unit') continue;

        card.defense -= effect.value;

        events.push({
          type: 'DAMAGE_DEALT',
          targetId: card.id,
          sourceId: sourceCardId,
          value: effect.value,
          timestamp: Date.now(),
        });

        if (!target.playerId) {
          throw new HTTPException(400, { message: 'Invalid target: missing player ID' });
        }

        // Check if unit is destroyed
        if (card.defense <= 0) {
          await handleUnitDestruction(newState, card, target.playerId, events);
        }
      }
    }

    return { state: newState, events };
  },

  /**
   * Healing effect
   */
  heal: async (state, effect, playerId, sourceCardId) => {
    const events: GameEvent[] = [];
    let newState = { ...state };

    const targets = resolveTargets(newState, effect.target, playerId);
    for (const target of targets) {
      if (target.type === 'player') {
        // Heal player
        const player = newState.players[target.id];
        player.health = Math.min(20, player.health + effect.value);

        events.push({
          type: 'HEALING_APPLIED',
          targetId: target.id,
          sourceId: sourceCardId,
          value: effect.value,
          timestamp: Date.now(),
        });
      } else {
        // Heal unit
        const card = target.card as UnitCard;
        if (card.type !== 'unit') continue;

        card.defense = Math.min(card.defense + effect.value, card.maxDefense || card.defense);

        events.push({
          type: 'HEALING_APPLIED',
          targetId: card.id,
          sourceId: sourceCardId,
          value: effect.value,
          timestamp: Date.now(),
        });
      }
    }

    return { state: newState, events };
  },

  /**
   * Stat buff effect
   */
  buff: async (state, effect, playerId, sourceCardId) => {
    const events: GameEvent[] = [];
    let newState = { ...state };

    const targets = resolveTargets(newState, effect.target, playerId);
    for (const target of targets) {
      if (target.type === 'unit') {
        const card = target.card as UnitCard;
        if (card.type !== 'unit') continue;

        // Apply buff
        card.attack += effect.value;
        card.defense += effect.value;

        events.push({
          type: 'BUFF_APPLIED',
          targetId: card.id,
          sourceId: sourceCardId,
          value: effect.value,
          timestamp: Date.now(),
        });
      }
    }

    return { state: newState, events };
  },

  /**
   * Control effect (e.g., mind control, stun)
   */
  control: async (state, effect, playerId, sourceCardId) => {
    const events: GameEvent[] = [];
    let newState = { ...state };

    const targets = resolveTargets(newState, effect.target, playerId);
    for (const target of targets) {
      if (target.type === 'unit') {
        const card = target.card as UnitCard;
        if (card.type !== 'unit') continue;

        // Apply control effect
        card.controlled = {
          by: playerId || '',
          duration: effect.duration || 1,
        };

        events.push({
          type: 'CONTROL_APPLIED',
          targetId: card.id,
          sourceId: sourceCardId,
          controllerId: playerId || '',
          duration: effect.duration || 1,
          timestamp: Date.now(),
        });
      }
    }

    return { state: newState, events };
  },

  // Add more effect types as needed...
};

/**
 * Helper functions
 */

interface Target {
  type: 'player' | 'unit';
  id: string;
  playerId?: string;
  card?: Card;
}

/**
 * Resolve effect targets based on target type and source
 */
function resolveTargets(
  state: GameState,
  targetType: string,
  sourcePlayerId: string | null,
): Target[] {
  const targets: Target[] = [];

  switch (targetType) {
    case 'self':
      if (sourcePlayerId) {
        targets.push({ type: 'player', id: sourcePlayerId });
      }
      break;

    case 'enemy':
      const enemyId = Object.keys(state.players).find((id) => id !== sourcePlayerId);
      if (enemyId) {
        targets.push({ type: 'player', id: enemyId });
      }
      break;

    case 'all':
      Object.keys(state.players).forEach((playerId) => {
        targets.push({ type: 'player', id: playerId });
      });
      break;

    // Add more target types as needed...
  }

  return targets;
}

/**
 * Handle unit destruction
 */
async function handleUnitDestruction(
  state: GameState,
  card: UnitCard,
  playerId: string,
  events: GameEvent[],
): Promise<void> {
  // Find and remove card from field
  const player = state.players[playerId];
  const cardIndex = player.field.findIndex((c) => c?.id === card.id);
  if (cardIndex !== -1) {
    player.field[cardIndex] = null;
  }

  events.push({
    type: 'UNIT_DESTROYED',
    cardId: card.id,
    playerId,
    timestamp: Date.now(),
  });

  // Trigger death effects if any
  if (card.abilities) {
    for (const ability of card.abilities) {
      if (ability.trigger === 'onDeath') {
        const { state: newState, events: newEvents } = await processEffect(
          state,
          ability,
          playerId,
          card.id,
        );
        Object.assign(state, newState);
        events.push(...newEvents);
      }
    }
  }
}

/**
 * Remove expired effects from game state
 */
function removeExpiredEffects(state: GameState): GameState {
  const newState = { ...state };

  // Remove expired global effects
  newState.activeEffects = newState.activeEffects.filter(
    (effect) => effect.duration === undefined || effect.duration > 0,
  );

  // Remove expired player effects
  for (const playerState of Object.values(newState.players)) {
    playerState.activeEffects = playerState.activeEffects.filter(
      (effect) => effect.duration === undefined || effect.duration > 0,
    );
  }

  return newState;
}

export const internal = {
  processEffect,
  resolveTargets,
  handleUnitDestruction,
  removeExpiredEffects,
};
