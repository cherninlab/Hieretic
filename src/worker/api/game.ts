import type { Env } from '../types';
import { APIError } from '../types';
import { jsonResponse } from '../utils/response';
import { requireAuth } from './auth';

export const handleGame = {
  create: requireAuth(async (_: Request, env: Env, userId: string) => {
    const gameId = `game-${Date.now()}`;

    const gameState = {
      id: gameId,
      createdBy: userId,
      players: [userId],
      status: 'waiting',
      created: Date.now(),
    };

    await env.GAME_STATE.put(gameId, JSON.stringify(gameState));
    return jsonResponse({ gameCode: gameId });
  }),

  join: requireAuth(async (request: Request, env: Env, userId: string) => {
    const { gameCode } = await request.json();

    const gameState = await env.GAME_STATE.get(gameCode);
    if (!gameState) {
      throw new APIError({
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
        status: 404,
      });
    }

    const game = JSON.parse(gameState);
    if (game.players.length >= 2) {
      throw new APIError({
        code: 'GAME_FULL',
        message: 'Game is full',
        status: 400,
      });
    }

    game.players.push(userId);
    await env.GAME_STATE.put(gameCode, JSON.stringify(game));

    return jsonResponse({ success: true });
  }),

  getState: requireAuth(async (request: Request, env: Env, _: string) => {
    const url = new URL(request.url);
    const gameCode = url.searchParams.get('gameCode');

    if (!gameCode) {
      throw new APIError({
        code: 'INVALID_REQUEST',
        message: 'Game code is required',
        status: 400,
      });
    }

    const gameState = await env.GAME_STATE.get(gameCode);
    if (!gameState) {
      throw new APIError({
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
        status: 404,
      });
    }

    return jsonResponse(JSON.parse(gameState));
  }),

  start: requireAuth(async (request: Request, env: Env, _: string) => {
    const { gameCode } = await request.json();

    const gameState = await env.GAME_STATE.get(gameCode);
    if (!gameState) {
      throw new APIError({
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
        status: 404,
      });
    }

    const game = JSON.parse(gameState);
    if (game.players.length !== 2) {
      throw new APIError({
        code: 'INVALID_PLAYERS',
        message: 'Game requires exactly 2 players to start',
        status: 400,
      });
    }

    game.status = 'active';
    game.startedAt = Date.now();
    await env.GAME_STATE.put(gameCode, JSON.stringify(game));

    return jsonResponse({ success: true });
  }),
};
