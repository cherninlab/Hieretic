import { ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';
import { handleCards } from './api/cards';
import { handleDeck } from './api/deck';
import { handleGame } from './api/game';
import { handleProfile } from './api/profile';
import type { Env } from './types';
import { APIError } from './types';
import { Errors } from './utils/errors';
import { errorResponse, jsonResponse } from './utils/response';

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
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

      // Admin endpoints
      if (path.startsWith('/api/admin')) {
        if (env.ENVIRONMENT !== 'development') {
          throw Errors.FORBIDDEN();
        }

        if (path.startsWith('/api/admin/cards')) {
          // Card management endpoints
          if (path === '/api/admin/cards') {
            switch (request.method) {
              case 'GET':
                return await handleCards.list(request, env);
              case 'POST':
                return await handleCards.create(request, env);
              case 'PUT':
                return await handleCards.update(request, env);
              case 'DELETE':
                return await handleCards.delete(request, env);
            }
          }

          // Card artwork endpoint
          if (path === '/api/admin/cards/artwork' && request.method === 'POST') {
            return await handleCards.uploadArtwork(request, env);
          }
        }

        // Deck management endpoints
        if (path.startsWith('/api/admin/decks')) {
          if (path === '/api/admin/decks' && request.method === 'GET') {
            return await handleDeck.list(request, env);
          }
        }

        throw Errors.NOT_FOUND('Admin endpoint not found');
      }

      // Profile endpoints
      if (path.startsWith('/api/profile')) {
        switch (request.method) {
          case 'GET':
            return await handleProfile.get(request, env);
          case 'POST':
            if (path === '/api/profile/create') {
              return await handleProfile.create(request, env);
            }
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
        if (path === '/api/game/state' && request.method === 'GET') {
          return await handleGame.getState(request, env);
        }
      }

      // Deck endpoints
      if (path.startsWith('/api/deck')) {
        switch (request.method) {
          case 'GET':
            if (path === '/api/deck/list') {
              return await handleDeck.list(request, env);
            }
            return await handleDeck.get(request, env);
          case 'POST':
            if (path === '/api/deck/create') {
              return await handleDeck.create(request, env);
            }
            if (path === '/api/deck/update') {
              return await handleDeck.update(request, env);
            }
            if (path === '/api/deck/delete') {
              return await handleDeck.delete(request, env);
            }
        }
      }

      // Matchmaking endpoint
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

      // Asset serving for card artwork
      if (path.startsWith('/assets/')) {
        const key = path.replace('/assets/', '');
        const object = await env.ASSETS.get(key);

        if (!object) {
          throw Errors.NOT_FOUND('Asset not found');
        }

        const headers = new Headers({
          etag: object.httpEtag,
          'Cache-Control': 'public, max-age=31536000',
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        });

        // Convert R2ObjectBody to Web API ReadableStream
        const arrayBuffer = await object.arrayBuffer();
        return new Response(arrayBuffer, { headers });
      }

      // If no route matches
      throw Errors.NOT_FOUND('Endpoint not found');
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

  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
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
