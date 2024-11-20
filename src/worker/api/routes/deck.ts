// src/worker/api/routes/deck.ts
import { getAuth } from '@hono/clerk-auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import type { Env } from '../../types/env';

// Validation schemas
const schemas = {
  createDeck: z
    .object({
      name: z.string().min(1).max(50),
      format: z.enum(['standard', 'custom']).default('standard'),
      cards: z.array(z.string()).min(30).max(50),
    })
    .strict(),

  updateDeck: z
    .object({
      name: z.string().min(1).max(50).optional(),
      cards: z.array(z.string()).min(30).max(50).optional(),
    })
    .strict(),

  validateDeck: z
    .object({
      cards: z.array(z.string()).min(30).max(50),
      format: z.enum(['standard', 'custom']).default('standard'),
    })
    .strict(),
};

// Types
interface Deck {
  id: string;
  userId: string;
  name: string;
  cards: string[];
  format: 'standard' | 'custom';
  created: number;
  updated: number;
}

const router = new Hono<{ Bindings: Env }>();

/**
 * List user's decks
 */
router.get('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  try {
    const decks = await c.env.DECKS.list({ prefix: `${auth.userId}/` });
    const deckList = await Promise.all(
      decks.keys.map(async (key) => {
        const deck = await c.env.DECKS.get(key.name);
        return deck ? JSON.parse(deck) : null;
      }),
    );

    return c.json({
      success: true,
      data: deckList.filter(Boolean),
    });
  } catch (error) {
    console.error('Error listing decks:', error);
    throw new HTTPException(500, { message: 'Failed to list decks' });
  }
});

/**
 * Get specific deck
 */
router.get('/:deckId', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const deckId = c.req.param('deckId');

  try {
    const deck = await c.env.DECKS.get(`${auth.userId}/${deckId}`);
    if (!deck) {
      throw new HTTPException(404, { message: 'Deck not found' });
    }

    // Load card details
    const deckData = JSON.parse(deck) as Deck;
    const cardDetails = await Promise.all(
      deckData.cards.map(async (cardId) => {
        const card = await c.env.CARDS.get(`card:${cardId}`);
        return card ? JSON.parse(card) : null;
      }),
    );

    return c.json({
      success: true,
      data: {
        ...deckData,
        cardDetails: cardDetails.filter(Boolean),
      },
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to fetch deck' });
  }
});

/**
 * Create new deck
 */
router.post('/', zValidator('json', schemas.createDeck), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const deckData = c.req.valid('json');

  try {
    // Validate cards exist
    const cardValidations = await Promise.all(
      deckData.cards.map(async (cardId) => {
        const card = await c.env.CARDS.get(`card:${cardId}`);
        return card ? true : false;
      }),
    );

    if (cardValidations.some((valid) => !valid)) {
      throw new HTTPException(400, { message: 'Invalid card ID in deck' });
    }

    // Create deck
    const deck: Deck = {
      id: `deck-${Date.now()}`,
      userId: auth.userId,
      name: deckData.name,
      cards: deckData.cards,
      format: deckData.format,
      created: Date.now(),
      updated: Date.now(),
    };

    await c.env.DECKS.put(`${auth.userId}/${deck.id}`, JSON.stringify(deck));

    return c.json({
      success: true,
      data: deck,
    });
  } catch (error) {
    console.error('Error creating deck:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to create deck' });
  }
});

/**
 * Update deck
 */
router.patch('/:deckId', zValidator('json', schemas.updateDeck), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const deckId = c.req.param('deckId');
  const updates = c.req.valid('json');

  try {
    const deck = await c.env.DECKS.get(`${auth.userId}/${deckId}`);
    if (!deck) {
      throw new HTTPException(404, { message: 'Deck not found' });
    }

    const currentDeck = JSON.parse(deck) as Deck;

    // If updating cards, validate them
    if (updates.cards) {
      const cardValidations = await Promise.all(
        updates.cards.map(async (cardId) => {
          const card = await c.env.CARDS.get(`card:${cardId}`);
          return card ? true : false;
        }),
      );

      if (cardValidations.some((valid) => !valid)) {
        throw new HTTPException(400, { message: 'Invalid card ID in deck' });
      }
    }

    const updatedDeck = {
      ...currentDeck,
      ...updates,
      updated: Date.now(),
    };

    await c.env.DECKS.put(`${auth.userId}/${deckId}`, JSON.stringify(updatedDeck));

    return c.json({
      success: true,
      data: updatedDeck,
    });
  } catch (error) {
    console.error('Error updating deck:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to update deck' });
  }
});

/**
 * Delete deck
 */
router.delete('/:deckId', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const deckId = c.req.param('deckId');

  try {
    // Check if deck exists and belongs to user
    const deck = await c.env.DECKS.get(`${auth.userId}/${deckId}`);
    if (!deck) {
      throw new HTTPException(404, { message: 'Deck not found' });
    }

    // Delete deck
    await c.env.DECKS.delete(`${auth.userId}/${deckId}`);

    // If this was user's active deck, clear it
    const profile = await c.env.USER_DATA.get(`profile:${auth.userId}`);
    if (profile) {
      const profileData = JSON.parse(profile);
      if (profileData.activeDeckId === deckId) {
        profileData.activeDeckId = '';
        await c.env.USER_DATA.put(`profile:${auth.userId}`, JSON.stringify(profileData));
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting deck:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to delete deck' });
  }
});

/**
 * Validate deck
 */
router.post('/validate', zValidator('json', schemas.validateDeck), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const { cards, format } = c.req.valid('json');

  try {
    // Validate all cards exist
    const cardDetails = await Promise.all(
      cards.map(async (cardId) => {
        const card = await c.env.CARDS.get(`card:${cardId}`);
        return card ? JSON.parse(card) : null;
      }),
    );

    if (cardDetails.some((card) => !card)) {
      return c.json({
        success: true,
        data: {
          valid: false,
          errors: ['Deck contains invalid cards'],
        },
      });
    }

    // Count cards by type/layer for format validation
    const counts = cardDetails.reduce(
      (acc, card) => {
        acc.typeCount[card.type] = (acc.typeCount[card.type] || 0) + 1;
        acc.layerCount[card.layer] = (acc.layerCount[card.layer] || 0) + 1;
        return acc;
      },
      { typeCount: {}, layerCount: {} },
    );

    const errors = [];

    // Format-specific validations
    if (format === 'standard') {
      // Example rules
      if (counts.layerCount['material'] < 10) {
        errors.push('Standard decks must have at least 10 material cards');
      }
      if (counts.layerCount['mind'] < 10) {
        errors.push('Standard decks must have at least 10 mind cards');
      }
      if (counts.typeCount['unit'] < 15) {
        errors.push('Standard decks must have at least 15 unit cards');
      }
    }

    return c.json({
      success: true,
      data: {
        valid: errors.length === 0,
        errors,
        stats: {
          types: counts.typeCount,
          layers: counts.layerCount,
        },
      },
    });
  } catch (error) {
    console.error('Error validating deck:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to validate deck' });
  }
});

export { router as deckRouter };
