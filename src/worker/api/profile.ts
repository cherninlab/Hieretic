import type { UserProfile } from '@shared/types';
import type { Env } from '../types';
import { APIError } from '../types';
import { jsonResponse } from '../utils/response';

export const handleProfile = {
  get: async (request: Request, env: Env) => {
    const url = new URL(request.url);
    const profileId = url.searchParams.get('id');

    if (!profileId) {
      throw new APIError({
        code: 'INVALID_INPUT',
        message: 'Profile ID is required',
        status: 400,
      });
    }

    // Ensure consistent key format
    const profileKey = profileId.startsWith('user:') ? profileId : `user:${profileId}`;
    const profile = await env.USER_DATA.get(profileKey);

    if (!profile) {
      throw new APIError({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found',
        status: 404,
      });
    }

    return jsonResponse(profile);
  },

  create: async (request: Request, env: Env) => {
    const { username } = await request.json();

    if (!username?.trim()) {
      throw new APIError({
        code: 'INVALID_INPUT',
        message: 'Username is required',
        status: 400,
      });
    }

    const userId = `user:user-${Date.now()}`;
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

  update: async (request: Request, env: Env) => {
    const updates = await request.json();
    const profileId = updates.id;

    if (!profileId) {
      throw new APIError({
        code: 'INVALID_INPUT',
        message: 'Profile ID is required',
        status: 400,
      });
    }

    const profileKey = profileId.startsWith('user:') ? profileId : `user:${profileId}`;
    const existing = await env.USER_DATA.get(profileKey);

    if (!existing) {
      throw new APIError({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found',
        status: 404,
      });
    }

    const updatedProfile = {
      ...JSON.parse(existing),
      ...updates,
      updated: Date.now(),
    };

    await env.USER_DATA.put(profileKey, JSON.stringify(updatedProfile));
    return jsonResponse(updatedProfile);
  },
};
