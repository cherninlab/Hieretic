import type { Deck } from '@shared/types/user';
import type { Env } from '../types';
import { APIError } from '../types';
import { jsonResponse } from '../utils/response';
import { requireAuth } from './auth';

export const handleDeck = {
  list: requireAuth(async (_: Request, env: Env, userId: string) => {
    const userDecks = await env.DECKS.list({ prefix: `${userId}/` });
    const decks = await Promise.all(
      userDecks.keys.map(async (key) => {
        const deck = await env.DECKS.get(key.name);
        return deck ? JSON.parse(deck) : null;
      }),
    );

    return jsonResponse(decks.filter(Boolean));
  }),

  get: requireAuth(async (request: Request, env: Env, userId: string) => {
    const url = new URL(request.url);
    const deckId = url.searchParams.get('deckId');

    if (!deckId) {
      throw new APIError({
        code: 'INVALID_REQUEST',
        message: 'Deck ID is required',
        status: 400,
      });
    }

    const deck = await env.DECKS.get(`${userId}/${deckId}`);
    if (!deck) {
      throw new APIError({
        code: 'DECK_NOT_FOUND',
        message: 'Deck not found',
        status: 404,
      });
    }

    return jsonResponse(JSON.parse(deck));
  }),

  create: requireAuth(async (request: Request, env: Env, userId: string) => {
    const deckData = (await request.json()) as Partial<Deck>;

    if (!deckData.name?.trim()) {
      throw new APIError({
        code: 'INVALID_INPUT',
        message: 'Deck name is required',
        status: 400,
      });
    }

    const deck: Deck = {
      id: `deck-${Date.now()}`,
      name: deckData.name.trim(),
      cards: deckData.cards || [],
      created: Date.now(),
      updated: Date.now(),
      format: deckData.format || 'standard',
    };

    await env.DECKS.put(`${userId}/${deck.id}`, JSON.stringify(deck));
    return jsonResponse(deck);
  }),

  update: requireAuth(async (request: Request, env: Env, userId: string) => {
    const { deckId, ...updates } = await request.json();

    if (!deckId) {
      throw new APIError({
        code: 'INVALID_INPUT',
        message: 'Deck ID is required',
        status: 400,
      });
    }

    const existing = await env.DECKS.get(`${userId}/${deckId}`);
    if (!existing) {
      throw new APIError({
        code: 'DECK_NOT_FOUND',
        message: 'Deck not found',
        status: 404,
      });
    }

    const currentDeck = JSON.parse(existing);
    const updatedDeck = {
      ...currentDeck,
      ...updates,
      updated: Date.now(),
    };

    await env.DECKS.put(`${userId}/${deckId}`, JSON.stringify(updatedDeck));
    return jsonResponse(updatedDeck);
  }),

  delete: requireAuth(async (request: Request, env: Env, userId: string) => {
    const { deckId } = await request.json();

    if (!deckId) {
      throw new APIError({
        code: 'INVALID_INPUT',
        message: 'Deck ID is required',
        status: 400,
      });
    }

    await env.DECKS.delete(`${userId}/${deckId}`);
    return jsonResponse({ success: true });
  }),
};
