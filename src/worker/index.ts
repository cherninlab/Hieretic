import { ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';
import { handleDeck } from './api/deck';
import { handleGame } from './api/game';
import { handleProfile } from './api/profile';
import type { Env } from './types';
import { APIError } from './types';
import { errorResponse, jsonResponse } from './utils/response';

export default {
  async fetch(request: Request, env: Env, _: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      // Profile endpoints
      if (path.startsWith('/api/profile')) {
        if (request.method === 'GET') {
          return await handleProfile.get(request, env);
        }
        if (request.method === 'POST' && path === '/api/profile/create') {
          return await handleProfile.create(request, env);
        }
        if (request.method === 'POST') {
          return await handleProfile.update(request, env);
        }
      }

      // Game endpoints
      if (path.startsWith('/api/game')) {
        if (path === '/api/game/create' && request.method === 'POST') {
          return await handleGame.create(request, env);
        }
        if (path === '/api/game/join' && request.method === 'POST') {
          return await handleGame.join(request, env);
        }
        if (path === '/api/game/start' && request.method === 'POST') {
          return await handleGame.start(request, env);
        }
        if (path.startsWith('/api/game/state') && request.method === 'GET') {
          return await handleGame.getState(request, env);
        }
      }

      // Deck endpoints
      if (path.startsWith('/api/deck')) {
        if (path === '/api/deck/list' && request.method === 'GET') {
          return await handleDeck.list(request, env);
        }
        if (path === '/api/deck/create' && request.method === 'POST') {
          return await handleDeck.create(request, env);
        }
        if (path === '/api/deck/update' && request.method === 'POST') {
          return await handleDeck.update(request, env);
        }
        if (path === '/api/deck/delete' && request.method === 'POST') {
          return await handleDeck.delete(request, env);
        }
        if (request.method === 'GET') {
          return await handleDeck.get(request, env);
        }
      }

      // Handle matchmaking separately as it's a special case
      if (path === '/api/matchmake' && request.method === 'POST') {
        const playerId = `player-${Date.now()}`; // Temporary until auth is implemented
        await env.PLAYER_QUEUE.put(
          playerId,
          JSON.stringify({
            timestamp: Date.now(),
            status: 'searching',
          }),
        );

        return jsonResponse({
          status: 'searching',
          message: 'Looking for opponents...',
        });
      }

      // If no route matches
      throw new APIError({
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
        status: 404,
      });
    } catch (error) {
      console.error('Error processing request:', error);

      if (error instanceof APIError) {
        return errorResponse(
          {
            code: error.code,
            message: error.message,
          },
          error.status,
        );
      }

      return errorResponse(
        {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        500,
      );
    }
  },

  // Optional: Add scheduled tasks
  async scheduled(event: ScheduledEvent, env: Env, _: ExecutionContext) {
    // Handle matchmaking queue cleanup
    if (event.cron === '*/5 * * * *') {
      // Every 5 minutes
      const queue = await env.PLAYER_QUEUE.list();
      const now = Date.now();

      for (const key of queue.keys) {
        const player = await env.PLAYER_QUEUE.get(key.name);
        if (player) {
          const data = JSON.parse(player);
          // Remove players that have been in queue for more than 5 minutes
          if (now - data.timestamp > 5 * 60 * 1000) {
            await env.PLAYER_QUEUE.delete(key.name);
          }
        }
      }
    }
  },
};
