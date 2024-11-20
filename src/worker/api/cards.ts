import type { CardDefinition } from '@shared/types/cards';
import type { Env } from '../types';
import { Errors } from '../utils/errors';
import { jsonResponse } from '../utils/response';
import { requireAuth } from './auth';

async function verifyAdmin(userId: string, env: Env): Promise<boolean> {
  // Implement admin verification logic here
  console.log('userId:', userId);
  console.log('env:', env);
  return false; // Placeholder
}

export const handleCards = {
  // Admin endpoints
  create: requireAuth(async (request: Request, env: Env, userId: string) => {
    // Verify admin status first
    const isAdmin = await verifyAdmin(userId, env);
    if (!isAdmin) {
      throw Errors.FORBIDDEN();
    }

    const cardData = (await request.json()) as CardDefinition;
    const key = `card:${cardData.set}:${cardData.id}`;

    await env.CARDS.put(key, JSON.stringify(cardData));
    return jsonResponse(cardData);
  }),

  // Public endpoints
  list: async (request: Request, env: Env) => {
    const set = new URL(request.url).searchParams.get('set') || 'core';
    const cards = await env.CARDS.list({ prefix: `card:${set}:` });

    const cardData = await Promise.all(
      cards.keys.map(async (key) => {
        const data = await env.CARDS.get(key.name);
        return data ? JSON.parse(data) : null;
      }),
    );

    return jsonResponse(cardData.filter(Boolean));
  },

  get: async (request: Request, env: Env) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const set = url.searchParams.get('set') || 'core';

    if (!id) {
      throw Errors.INVALID_INPUT('Card ID is required');
    }

    const card = await env.CARDS.get(`card:${set}:${id}`);
    if (!card) {
      throw Errors.NOT_FOUND('Card not found');
    }

    return jsonResponse(JSON.parse(card));
  },
};
