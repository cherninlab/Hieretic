import type { Env } from '@worker/types/env';

/**
 * Task configuration constants
 */
const TIMEOUTS = {
  MATCHMAKING: 5 * 60 * 1000, // 5 minutes
  ABANDONED_GAME: 24 * 60 * 60 * 1000, // 24 hours
  INACTIVE_GAME: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Clean up stale matchmaking queue entries
 */
export async function cleanupMatchmakingQueue(env: Env) {
  console.log('[Task] Starting matchmaking queue cleanup');
  const startTime = Date.now();
  const stats = { processed: 0, removed: 0, errors: 0 };

  try {
    const queue = await env.PLAYER_QUEUE.list();

    for (const key of queue.keys) {
      stats.processed++;

      try {
        const player = await env.PLAYER_QUEUE.get(key.name);
        if (!player) {
          continue;
        }

        const data = JSON.parse(player);
        if (Date.now() - data.timestamp > TIMEOUTS.MATCHMAKING) {
          await env.PLAYER_QUEUE.delete(key.name);
          stats.removed++;
          console.log(
            `Removed stale queue entry: ${key.name}, queued at: ${new Date(data.timestamp).toISOString()}`,
          );
        }
      } catch (error) {
        stats.errors++;
        console.error(`Error processing queue item ${key.name}:`, error);
        // Delete invalid entries
        await env.PLAYER_QUEUE.delete(key.name);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Task] Matchmaking cleanup completed in ${duration}ms`, stats);
  } catch (error) {
    console.error('[Task] Matchmaking cleanup failed:', error);
    throw error; // Let the worker handle the error
  }
}

/**
 * Daily maintenance tasks
 */
export async function dailyMaintenance(env: Env) {
  console.log('[Task] Starting daily maintenance');
  const startTime = Date.now();

  try {
    const tasks = [
      cleanupAbandonedGames(env),
      cleanupInactiveGames(env),
      updateGameStats(env),
      // Add more maintenance tasks here
    ];

    const results = await Promise.allSettled(tasks);

    // Log results
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Task ${index} failed:`, result.reason);
      }
    });

    const duration = Date.now() - startTime;
    console.log(`[Task] Daily maintenance completed in ${duration}ms`);
  } catch (error) {
    console.error('[Task] Daily maintenance failed:', error);
    throw error;
  }
}

/**
 * Clean up abandoned games (in 'waiting' state for too long)
 */
export async function cleanupAbandonedGames(env: Env) {
  console.log('[Task] Cleaning up abandoned games');
  const stats = { processed: 0, removed: 0, errors: 0 };

  try {
    const games = await env.GAME_STATE.list();

    for (const key of games.keys) {
      stats.processed++;

      try {
        const game = await env.GAME_STATE.get(key.name);
        if (!game) continue;

        const data = JSON.parse(game);
        if (data.status === 'waiting' && Date.now() - data.created > TIMEOUTS.ABANDONED_GAME) {
          await env.GAME_STATE.delete(key.name);
          stats.removed++;
          console.log(
            `Removed abandoned game: ${key.name}, created at: ${new Date(data.created).toISOString()}`,
          );
        }
      } catch (error) {
        stats.errors++;
        console.error(`Error processing game ${key.name}:`, error);
        await env.GAME_STATE.delete(key.name);
      }
    }

    console.log('[Task] Abandoned games cleanup completed', stats);
  } catch (error) {
    console.error('[Task] Abandoned games cleanup failed:', error);
    throw error;
  }
}

/**
 * Clean up inactive games (finished but not accessed for a long time)
 */
async function cleanupInactiveGames(env: Env) {
  console.log('[Task] Cleaning up inactive games');
  const stats = { processed: 0, removed: 0, errors: 0 };

  try {
    const games = await env.GAME_STATE.list();

    for (const key of games.keys) {
      stats.processed++;

      try {
        const game = await env.GAME_STATE.get(key.name);
        if (!game) continue;

        const data = JSON.parse(game);
        if (data.status === 'finished' && Date.now() - data.lastAccessed > TIMEOUTS.INACTIVE_GAME) {
          await env.GAME_STATE.delete(key.name);
          stats.removed++;
          console.log(
            `Removed inactive game: ${key.name}, last accessed: ${new Date(data.lastAccessed).toISOString()}`,
          );
        }
      } catch (error) {
        stats.errors++;
        console.error(`Error processing game ${key.name}:`, error);
      }
    }

    console.log('[Task] Inactive games cleanup completed', stats);
  } catch (error) {
    console.error('[Task] Inactive games cleanup failed:', error);
    throw error;
  }
}

/**
 * Update game statistics
 */
async function updateGameStats(env: Env) {
  console.log('[Task] Updating game statistics');

  try {
    const games = await env.GAME_STATE.list();
    const stats = {
      total: 0,
      active: 0,
      finished: 0,
      abandoned: 0,
    };

    for (const key of games.keys) {
      try {
        const game = await env.GAME_STATE.get(key.name);
        if (!game) continue;

        const data = JSON.parse(game);
        stats.total++;

        switch (data.status) {
          case 'active':
            stats.active++;
            break;
          case 'finished':
            stats.finished++;
            break;
          case 'waiting':
            if (Date.now() - data.created > TIMEOUTS.ABANDONED_GAME) {
              stats.abandoned++;
            }
            break;
        }
      } catch (error) {
        console.error(`Error processing game stats ${key.name}:`, error);
      }
    }

    // Store stats for monitoring
    await env.GAME_STATE.put(
      'stats:daily',
      JSON.stringify({
        ...stats,
        timestamp: Date.now(),
      }),
    );

    console.log('[Task] Game statistics updated', stats);
  } catch (error) {
    console.error('[Task] Game statistics update failed:', error);
    throw error;
  }
}
