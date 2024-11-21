import { GameStateManager } from '../game/state/GameStateManager';
import type { Env } from '../types';
import { APIError } from '../types';
import { jsonResponse } from '../utils/response';
import { requireAuth } from './auth';

export const handleGame = {
  create: requireAuth(async (_: Request, env: Env, userId: string) => {
    const gameId = `game-${Date.now()}`;

    // Get creator's profile
    const profileData = await env.USER_DATA.get(userId);
    if (!profileData) {
      throw new APIError({
        code: 'PROFILE_NOT_FOUND',
        message: 'Creator profile not found',
        status: 404,
      });
    }

    const profile = JSON.parse(profileData);

    const gameState = {
      id: gameId,
      createdBy: userId,
      players: [userId],
      status: 'waiting',
      created: Date.now(),
      playerProfiles: {
        [userId]: profile,
      },
    };

    await env.GAME_STATE.put(gameId, JSON.stringify(gameState));

    return jsonResponse({
      gameCode: gameId,
    });
  }),

  getState: requireAuth(async (request: Request, env: Env, userId: string) => {
    const url = new URL(request.url);
    const gameCode = url.searchParams.get('gameCode');

    if (!gameCode) {
      throw new APIError({
        code: 'INVALID_INPUT',
        message: 'Game code is required',
        status: 400,
      });
    }

    const gameState = await env.GAME_STATE.get(gameCode);
    if (!gameState) {
      throw new APIError({
        code: 'NOT_FOUND',
        message: 'Game not found',
        status: 404,
      });
    }

    const state = JSON.parse(gameState);

    // Add profile info if not present but player is in game
    if (!state.playerProfiles?.[userId] && state.players.includes(userId)) {
      const profile = await env.USER_DATA.get(userId);
      if (profile) {
        state.playerProfiles = {
          ...state.playerProfiles,
          [userId]: JSON.parse(profile),
        };
        await env.GAME_STATE.put(gameCode, JSON.stringify(state));
      }
    }

    return jsonResponse(state);
  }),

  join: requireAuth(async (request: Request, env: Env, userId: string) => {
    const { gameCode } = await request.json();

    if (!gameCode) {
      throw new APIError({
        code: 'INVALID_INPUT',
        message: 'Game code is required',
        status: 400,
      });
    }

    const gameState = await env.GAME_STATE.get(gameCode);
    if (!gameState) {
      throw new APIError({
        code: 'NOT_FOUND',
        message: 'Game not found',
        status: 404,
      });
    }

    const state = JSON.parse(gameState);

    // Check if game is joinable
    if (state.status !== 'waiting') {
      throw new APIError({
        code: 'INVALID_STATE',
        message: 'Game is not in waiting state',
        status: 400,
      });
    }

    // Don't add the same player twice
    if (!state.players.includes(userId)) {
      if (state.players.length >= 2) {
        throw new APIError({
          code: 'GAME_FULL',
          message: 'Game is full',
          status: 400,
        });
      }

      // Get joining player's profile
      const profileData = await env.USER_DATA.get(userId);
      if (!profileData) {
        throw new APIError({
          code: 'PROFILE_NOT_FOUND',
          message: 'Joining player profile not found',
          status: 404,
        });
      }

      state.players.push(userId);
      state.playerProfiles = {
        ...state.playerProfiles,
        [userId]: JSON.parse(profileData),
      };

      await env.GAME_STATE.put(gameCode, JSON.stringify(state));
    }

    return jsonResponse({ success: true });
  }),

  start: requireAuth(async (request: Request, env: Env, userId: string) => {
    const { gameCode } = await request.json();

    if (!gameCode) {
      throw new APIError({
        code: 'INVALID_INPUT',
        message: 'Game code is required',
        status: 400,
      });
    }

    const gameState = await env.GAME_STATE.get(gameCode);
    if (!gameState) {
      throw new APIError({
        code: 'NOT_FOUND',
        message: 'Game not found',
        status: 404,
      });
    }

    const state = JSON.parse(gameState);

    // Verify the user is the game creator
    if (state.createdBy !== userId) {
      throw new APIError({
        code: 'UNAUTHORIZED',
        message: 'Only the game creator can start the game',
        status: 401,
      });
    }

    if (state.players.length !== 2) {
      throw new APIError({
        code: 'INVALID_PLAYERS',
        message: 'Game requires exactly 2 players to start',
        status: 400,
      });
    }

    // Initialize proper game state with test deck
    const stateManager = new GameStateManager(env);
    const gameInitialState = await stateManager.createGame(state.players);

    const initializedState = {
      ...gameInitialState,
      playerProfiles: state.playerProfiles,
      status: 'active',
      startedAt: Date.now(),
    };

    await env.GAME_STATE.put(gameCode, JSON.stringify(initializedState));

    return jsonResponse({ success: true });
  }),
};
