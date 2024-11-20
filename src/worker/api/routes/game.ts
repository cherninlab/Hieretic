import { getAuth } from '@hono/clerk-auth';
import { zValidator } from '@hono/zod-validator';
import type { UserProfile } from '@shared/types';
import { GameStateManager } from '@worker/core/game/GameStateManager';
import type { Env } from '@worker/types/env';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

// Validation schemas
const schemas = {
  joinGame: z
    .object({
      gameCode: z.string().min(1),
    })
    .strict(),

  playCard: z
    .object({
      gameCode: z.string().min(1),
      cardId: z.string().min(1),
      position: z.number().min(0).max(3),
    })
    .strict(),

  activateAbility: z
    .object({
      gameCode: z.string().min(1),
      cardId: z.string().min(1),
      abilityIndex: z.number().min(0),
      targets: z.array(z.string()),
    })
    .strict(),

  changePhase: z
    .object({
      gameCode: z.string().min(1),
      phase: z.enum(['draw', 'main', 'combat', 'end']),
    })
    .strict(),

  changeLayer: z
    .object({
      gameCode: z.string().min(1),
      layer: z.enum(['material', 'mind']),
    })
    .strict(),
};

const router = new Hono<{ Bindings: Env }>();

/**
 * Create new game
 */
router.post('/create', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  try {
    const profile: UserProfile | null = await c.env.USER_DATA.get(`profile:${auth.userId}`, {
      type: 'json',
    });

    if (!profile) {
      throw new HTTPException(400, { message: 'Profile not found' });
    }

    const { activeDeckId } = profile;

    // Create game state
    const stateManager = new GameStateManager(c.env);
    const gameState = await stateManager.createGame(auth.userId, activeDeckId);

    return c.json({
      success: true,
      data: {
        gameCode: gameState.id,
        state: gameState,
      },
    });
  } catch (error) {
    console.error('Error creating game:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to create game' });
  }
});

/**
 * Join existing game
 */
router.post('/join', zValidator('json', schemas.joinGame), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const { gameCode } = c.req.valid('json');

  try {
    // Get user's active deck
    const profile = await c.env.USER_DATA.get(`profile:${auth.userId}`);
    if (!profile) {
      throw new HTTPException(400, { message: 'Profile not found' });
    }

    const { activeDeckId } = JSON.parse(profile);
    if (!activeDeckId) {
      throw new HTTPException(400, { message: 'No active deck selected' });
    }

    // Join game
    const stateManager = new GameStateManager(c.env);
    const gameState = await stateManager.joinGame(gameCode, auth.userId, activeDeckId);

    return c.json({
      success: true,
      data: { state: gameState },
    });
  } catch (error) {
    console.error('Error joining game:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to join game' });
  }
});

/**
 * Get game state
 */
router.get('/:gameCode', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const gameCode = c.req.param('gameCode');

  try {
    const stateManager = new GameStateManager(c.env);
    const gameState = await stateManager.getState(gameCode);

    // Verify player is in game
    if (!gameState.players[auth.userId]) {
      throw new HTTPException(403, { message: 'Not a participant in this game' });
    }

    // If game is active, record last access time
    if (gameState.status === 'active') {
      gameState.lastAccessed = Date.now();
      await c.env.GAME_STATE.put(gameCode, JSON.stringify(gameState));
    }

    return c.json({
      success: true,
      data: { state: gameState },
    });
  } catch (error) {
    console.error('Error fetching game state:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to fetch game state' });
  }
});

/**
 * Play a card
 */
router.post('/play-card', zValidator('json', schemas.playCard), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const { gameCode, cardId, position } = c.req.valid('json');

  try {
    const stateManager = new GameStateManager(c.env);
    const gameState = await stateManager.applyAction(gameCode, {
      type: 'PLAY_CARD',
      playerId: auth.userId,
      timestamp: Date.now(),
      data: { cardId, position },
    });

    return c.json({
      success: true,
      data: { state: gameState },
    });
  } catch (error) {
    console.error('Error playing card:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to play card' });
  }
});

/**
 * Activate card ability
 */
router.post('/activate-ability', zValidator('json', schemas.activateAbility), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const { gameCode, cardId, abilityIndex, targets } = c.req.valid('json');

  try {
    const stateManager = new GameStateManager(c.env);
    const gameState = await stateManager.applyAction(gameCode, {
      type: 'ACTIVATE_ABILITY',
      playerId: auth.userId,
      timestamp: Date.now(),
      data: { cardId, abilityIndex, targets },
    });

    return c.json({
      success: true,
      data: { state: gameState },
    });
  } catch (error) {
    console.error('Error activating ability:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to activate ability' });
  }
});

/**
 * Change game phase
 */
router.post('/change-phase', zValidator('json', schemas.changePhase), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const { gameCode, phase } = c.req.valid('json');

  try {
    const stateManager = new GameStateManager(c.env);
    const gameState = await stateManager.applyAction(gameCode, {
      type: 'CHANGE_PHASE',
      playerId: auth.userId,
      timestamp: Date.now(),
      data: { phase },
    });

    return c.json({
      success: true,
      data: { state: gameState },
    });
  } catch (error) {
    console.error('Error changing phase:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to change phase' });
  }
});

/**
 * Change layer
 */
router.post('/change-layer', zValidator('json', schemas.changeLayer), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const { gameCode, layer } = c.req.valid('json');

  try {
    const stateManager = new GameStateManager(c.env);
    const gameState = await stateManager.applyAction(gameCode, {
      type: 'CHANGE_LAYER',
      playerId: auth.userId,
      timestamp: Date.now(),
      data: { layer },
    });

    return c.json({
      success: true,
      data: { state: gameState },
    });
  } catch (error) {
    console.error('Error changing layer:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to change layer' });
  }
});

/**
 * End turn
 */
router.post('/:gameCode/end-turn', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const gameCode = c.req.param('gameCode');

  try {
    const stateManager = new GameStateManager(c.env);
    const gameState = await stateManager.applyAction(gameCode, {
      type: 'END_TURN',
      playerId: auth.userId,
      timestamp: Date.now(),
      data: {},
    });

    return c.json({
      success: true,
      data: { state: gameState },
    });
  } catch (error) {
    console.error('Error ending turn:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to end turn' });
  }
});

/**
 * Surrender game
 */
router.post('/:gameCode/surrender', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const gameCode = c.req.param('gameCode');

  try {
    const stateManager = new GameStateManager(c.env);
    const gameState = await stateManager.applyAction(gameCode, {
      type: 'SURRENDER',
      playerId: auth.userId,
      timestamp: Date.now(),
      data: {},
    });

    // Update player statistics
    const profile = await c.env.USER_DATA.get(`profile:${auth.userId}`);
    if (profile) {
      const profileData = JSON.parse(profile);
      profileData.statistics.losses++;
      profileData.statistics.winStreak = 0;
      await c.env.USER_DATA.put(`profile:${auth.userId}`, JSON.stringify(profileData));
    }

    // Update winner's statistics
    const winnerId = Object.keys(gameState.players).find((id) => id !== auth.userId);
    if (winnerId) {
      const winnerProfile = await c.env.USER_DATA.get(`profile:${winnerId}`);
      if (winnerProfile) {
        const profileData = JSON.parse(winnerProfile);
        profileData.statistics.wins++;
        profileData.statistics.winStreak++;
        await c.env.USER_DATA.put(`profile:${winnerId}`, JSON.stringify(profileData));
      }
    }

    return c.json({
      success: true,
      data: { state: gameState },
    });
  } catch (error) {
    console.error('Error surrendering game:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to surrender game' });
  }
});

export { router as gameRouter };
