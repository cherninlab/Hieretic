import { getAuth } from '@hono/clerk-auth';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '@worker/types/env';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

// Validation schemas
const schemas = {
  updateProfile: z
    .object({
      username: z.string().min(3).max(20).optional(),
      preferences: z
        .object({
          theme: z.enum(['default', 'dark', 'light']).optional(),
          cardBack: z.string().optional(),
        })
        .optional(),
    })
    .strict(),

  updateActiveDeck: z
    .object({
      deckId: z.string().min(1),
    })
    .strict(),
};

// Types
interface UserProfile {
  id: string;
  username: string;
  activeDeckId: string;
  created: number;
  preferences: {
    theme: 'default' | 'dark' | 'light';
    cardBack: string;
  };
  statistics: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winStreak: number;
  };
}

const router = new Hono<{ Bindings: Env }>();

/**
 * Get user's profile
 * Creates a new profile if it doesn't exist
 */
router.get('/', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  try {
    // Try to get existing profile
    let profile = await c.env.USER_DATA.get(`profile:${auth.userId}`);

    if (!profile) {
      // Get user data from Clerk
      const clerk = c.get('clerk');
      const user = await clerk.users.getUser(auth.userId);

      // Create new profile
      const newProfile: UserProfile = {
        id: auth.userId,
        username: user.username || `Player${auth.userId.substring(0, 6)}`,
        activeDeckId: '',
        created: Date.now(),
        preferences: {
          theme: 'default',
          cardBack: 'default',
        },
        statistics: {
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          winStreak: 0,
        },
      };

      // Save new profile
      await c.env.USER_DATA.put(`profile:${auth.userId}`, JSON.stringify(newProfile));

      return c.json({
        success: true,
        data: newProfile,
      });
    }

    // Return existing profile
    return c.json({
      success: true,
      data: JSON.parse(profile),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw new HTTPException(500, { message: 'Failed to fetch profile' });
  }
});

/**
 * Update user's profile
 */
router.patch('/', zValidator('json', schemas.updateProfile), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const updates = c.req.valid('json');

  try {
    const profile = await c.env.USER_DATA.get(`profile:${auth.userId}`);
    if (!profile) {
      throw new HTTPException(404, { message: 'Profile not found' });
    }

    const currentProfile = JSON.parse(profile) as UserProfile;
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      // Merge nested preferences if provided
      preferences: updates.preferences
        ? { ...currentProfile.preferences, ...updates.preferences }
        : currentProfile.preferences,
    };

    await c.env.USER_DATA.put(`profile:${auth.userId}`, JSON.stringify(updatedProfile));

    return c.json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to update profile' });
  }
});

/**
 * Update active deck
 */
router.post('/deck', zValidator('json', schemas.updateActiveDeck), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const { deckId } = c.req.valid('json');

  try {
    // Verify deck exists and belongs to user
    const deck = await c.env.DECKS.get(`${auth.userId}/${deckId}`);
    if (!deck) {
      throw new HTTPException(404, { message: 'Deck not found' });
    }

    // Update profile with new active deck
    const profile = await c.env.USER_DATA.get(`profile:${auth.userId}`);
    if (!profile) {
      throw new HTTPException(404, { message: 'Profile not found' });
    }

    const currentProfile = JSON.parse(profile) as UserProfile;
    const updatedProfile = {
      ...currentProfile,
      activeDeckId: deckId,
    };

    await c.env.USER_DATA.put(`profile:${auth.userId}`, JSON.stringify(updatedProfile));

    return c.json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating active deck:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to update active deck' });
  }
});

/**
 * Get user's statistics
 */
router.get('/stats', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  try {
    const profile = await c.env.USER_DATA.get(`profile:${auth.userId}`);
    if (!profile) {
      throw new HTTPException(404, { message: 'Profile not found' });
    }

    const { statistics } = JSON.parse(profile) as UserProfile;

    // Could enhance with additional stats from game history
    return c.json({
      success: true,
      data: {
        ...statistics,
        winRate:
          statistics.gamesPlayed > 0
            ? ((statistics.wins / statistics.gamesPlayed) * 100).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    if (error instanceof HTTPException) throw error;
    throw new HTTPException(500, { message: 'Failed to fetch statistics' });
  }
});

export { router as profileRouter };
