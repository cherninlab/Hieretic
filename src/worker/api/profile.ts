import type { UserProfile } from '@shared/types/user';
import type { Env } from '../types';
import { APIError } from '../types';
import { jsonResponse } from '../utils/response';
import { requireAuth } from './auth';

export const handleProfile = {
  get: requireAuth(async (_: Request, env: Env, userId: string) => {
    const profile = await env.USER_DATA.get(userId);

    if (!profile) {
      throw new APIError({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found',
        status: 404,
      });
    }

    return jsonResponse(JSON.parse(profile));
  }),

  update: requireAuth(async (request: Request, env: Env, userId: string) => {
    const updates = (await request.json()) as Partial<UserProfile>;
    const existing = await env.USER_DATA.get(userId);

    if (!existing) {
      throw new APIError({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found',
        status: 404,
      });
    }

    const currentProfile = JSON.parse(existing);
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updated: Date.now(),
    };

    await env.USER_DATA.put(userId, JSON.stringify(updatedProfile));
    return jsonResponse(updatedProfile);
  }),

  create: async (request: Request, env: Env) => {
    const { username } = await request.json();

    if (!username?.trim()) {
      throw new APIError({
        code: 'INVALID_INPUT',
        message: 'Username is required',
        status: 400,
      });
    }

    const userId = `user-${Date.now()}`;
    const profile: UserProfile = {
      id: userId,
      username: username.trim(),
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

    await env.USER_DATA.put(userId, JSON.stringify(profile));
    return jsonResponse(profile);
  },
};
