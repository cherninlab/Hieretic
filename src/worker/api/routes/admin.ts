import { Card } from '@/shared/types';
import { getAuth } from '@hono/clerk-auth';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '@worker/types/env';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { z } from 'zod';

// Schemas for requests
const schemas = {
  createCard: z.object({
    name: z.string().min(1),
    type: z.enum(['unit', 'effect', 'ritual']),
    layer: z.enum(['material', 'mind']),
    cost: z.object({
      material: z.number().min(0),
      mind: z.number().min(0),
    }),
    rarity: z.enum(['common', 'uncommon', 'rare']),
    attack: z.number().optional(),
    defense: z.number().optional(),
    abilities: z.array(z.any()).optional(),
    effect: z.any().optional(),
    effects: z.array(z.any()).optional(),
    duration: z.number().optional(),
    artworkUrl: z.string().optional(),
  }),

  updateCard: z.object({
    cardId: z.string(),
    updates: z.object({
      name: z.string().min(1).optional(),
      cost: z
        .object({
          material: z.number().min(0),
          mind: z.number().min(0),
        })
        .optional(),
      attack: z.number().optional(),
      defense: z.number().optional(),
      abilities: z.array(z.any()).optional(),
      effect: z.any().optional(),
      effects: z.array(z.any()).optional(),
      duration: z.number().optional(),
      artworkUrl: z.string().optional(),
    }),
  }),
};

// Create router instance
const router = new Hono<{ Bindings: Env }>();

// Admin middleware
async function adminOnly(c: any, next: any) {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const clerk = c.get('clerk');
  const user = await clerk.users.getUser(auth.userId);

  // Check if user has admin role
  // You might want to customize this based on your Clerk metadata structure
  const isAdmin = user.privateMetadata?.role === 'admin' || c.env.ENVIRONMENT === 'development'; // Allow all in dev

  if (!isAdmin) {
    throw new HTTPException(403, { message: 'Admin access required' });
  }

  await next();
}

// Apply admin check to all routes
router.use('*', adminOnly);

/**
 * Card Management
 */
router.get('/cards', async (c) => {
  try {
    const cards = await c.env.CARDS.list();
    const cardData: (Card | null)[] = await Promise.all(
      cards.keys.map(async (key) => {
        return await c.env.CARDS.get(key.name, {
          type: 'json',
        });
      }),
    );

    return c.json({
      success: true,
      data: cardData.filter((i) => i != null),
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw new HTTPException(500, { message: 'Failed to fetch cards' });
  }
});

router.post('/cards', zValidator('json', schemas.createCard), async (c) => {
  const cardData = c.req.valid('json');
  const cardId = `card:${Date.now()}`;

  try {
    await c.env.CARDS.put(
      cardId,
      JSON.stringify({
        ...cardData,
        id: cardId,
        created: Date.now(),
        updated: Date.now(),
      }),
    );

    return c.json({
      success: true,
      data: { id: cardId },
    });
  } catch (error) {
    console.error('Error creating card:', error);
    throw new HTTPException(500, { message: 'Failed to create card' });
  }
});

router.put('/cards', zValidator('json', schemas.updateCard), async (c) => {
  const { cardId, updates } = c.req.valid('json');

  try {
    const existing = await c.env.CARDS.get(cardId, {
      type: 'json',
    });
    if (!existing) {
      throw new HTTPException(404, { message: 'Card not found' });
    }

    const updatedCard = {
      ...existing,
      ...updates,
      updated: Date.now(),
    };

    await c.env.CARDS.put(cardId, JSON.stringify(updatedCard));

    return c.json({
      success: true,
      data: updatedCard,
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error('Error updating card:', error);
    throw new HTTPException(500, { message: 'Failed to update card' });
  }
});

router.delete('/cards/:cardId', async (c) => {
  const cardId = c.req.param('cardId');

  try {
    await c.env.CARDS.delete(cardId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    throw new HTTPException(500, { message: 'Failed to delete card' });
  }
});

/**
 * System Status & Maintenance
 */
router.get('/status', async (c) => {
  try {
    // Get system stats
    const [gameStats, queueStats] = await Promise.all([
      c.env.GAME_STATE.get('stats:daily'),
      c.env.PLAYER_QUEUE.list(),
    ]);

    return c.json({
      success: true,
      data: {
        games: gameStats ? JSON.parse(gameStats) : null,
        matchmaking: {
          queueLength: queueStats.keys.length,
        },
        environment: c.env.ENVIRONMENT,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    throw new HTTPException(500, { message: 'Failed to fetch system status' });
  }
});

router.post('/maintenance/cleanup', async (c) => {
  try {
    // Import tasks dynamically to avoid circular dependencies
    const { cleanupMatchmakingQueue, cleanupAbandonedGames } = await import('../../tasks');

    // Run cleanup tasks
    await Promise.all([cleanupMatchmakingQueue(c.env), cleanupAbandonedGames(c.env)]);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error running maintenance:', error);
    throw new HTTPException(500, { message: 'Failed to run maintenance' });
  }
});

export { router as adminRouter };
