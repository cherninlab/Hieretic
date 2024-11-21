import type { CardDefinition } from '@shared/types/cards';
import type { Layer } from '@shared/types/core';
import type { Env } from '../types';
import { Errors } from '../utils/errors';
import { jsonResponse } from '../utils/response';
import { requireAuth } from './auth';

// Admin validation - this should be properly implemented based on your auth system
async function verifyAdmin(userId: string, env: Env): Promise<boolean> {
  const userData = await env.USER_DATA.get(userId);
  if (!userData) return false;

  // In development, allow all users to be admins
  if (env.ENVIRONMENT === 'development') return true;

  const user = JSON.parse(userData);
  return user.isAdmin === true;
}

export const handleCards = {
  // Admin endpoints
  uploadArtwork: requireAuth(async (request: Request, env: Env, userId: string) => {
    const isAdmin = await verifyAdmin(userId, env);
    if (!isAdmin) {
      throw Errors.FORBIDDEN();
    }

    const formData = await request.formData();
    const file = formData.get('artwork') as File;
    const cardId = formData.get('cardId') as string;

    if (!file || !cardId) {
      throw Errors.INVALID_INPUT('Artwork and card ID required');
    }

    // Generate a unique filename
    const filename = `${cardId}-${Date.now()}-${file.name}`;
    const key = `card-artwork/${filename}`;

    // Convert File to ArrayBuffer for R2
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    await env.ASSETS.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    // Update card metadata with artwork URL
    const cardKey = `card:${cardId}`;
    const existingCard = await env.CARDS.get(cardKey);
    if (!existingCard) throw Errors.NOT_FOUND('Card not found');

    const card = JSON.parse(existingCard);
    card.artworkUrl = `/assets/${key}`;
    await env.CARDS.put(cardKey, JSON.stringify(card));

    return jsonResponse({ artworkUrl: card.artworkUrl });
  }),

  create: requireAuth(async (request: Request, env: Env, userId: string) => {
    const isAdmin = await verifyAdmin(userId, env);
    if (!isAdmin) {
      throw Errors.FORBIDDEN();
    }

    const formData = await request.formData();
    const cardData = formData.get('cardData') as string;

    if (!cardData) {
      throw Errors.INVALID_INPUT('Card data is required');
    }

    const card: CardDefinition = JSON.parse(cardData);

    console.log('Parsed Card Data:', card); // Log the parsed card data

    // Validate required fields
    if (!card.name || !card.layer || !card.type) {
      throw Errors.INVALID_INPUT('Name, layer, and type are required');
    }

    const cardId = `card:${Date.now()}`;

    const cardDefinition: CardDefinition = {
      ...card,
      id: cardId,
      cost: card.cost || { material: 0, mind: 0, void: 0 },
      rarity: card.rarity || 'common',
      flavorText: card.flavorText || '',
      set: card.set || 'core',
      artist: card.artist || '',
      releaseDate: Date.now(),
      abilities: card.abilities || [],
      effect: card.effect,
      duration: card.duration || 0,
      effects: card.effects || [],
      layerRequirements: card.layerRequirements || {},
    };

    await env.CARDS.put(cardId, JSON.stringify(cardDefinition));
    return jsonResponse(cardDefinition);
  }),

  list: async (request: Request, env: Env) => {
    const url = new URL(request.url);
    const set = url.searchParams.get('set');
    const layer = url.searchParams.get('layer') as Layer | null;

    let prefix = 'card:';
    if (set) prefix += `${set}:`;

    const list = await env.CARDS.list({ prefix });
    const cards = await Promise.all(
      list.keys.map(async (key) => {
        const data = await env.CARDS.get(key.name);
        return data ? JSON.parse(data) : null;
      }),
    );

    // Filter by layer if specified
    const filtered = layer ? cards.filter((card) => card && card.layer === layer) : cards;

    return jsonResponse(filtered.filter(Boolean));
  },

  get: async (request: Request, env: Env) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) throw Errors.INVALID_INPUT('Card ID required');

    const card = await env.CARDS.get(`card:${id}`);
    if (!card) throw Errors.NOT_FOUND('Card not found');

    return jsonResponse(JSON.parse(card));
  },

  update: requireAuth(async (request: Request, env: Env, userId: string) => {
    const isAdmin = await verifyAdmin(userId, env);
    if (!isAdmin) {
      throw Errors.FORBIDDEN();
    }

    const formData = await request.formData();
    const cardData = formData.get('cardData') as string;

    if (!cardData) {
      throw Errors.INVALID_INPUT('Card data is required');
    }

    const card: Partial<CardDefinition> = JSON.parse(cardData);

    const { id, ...updates } = card;
    if (!id) throw Errors.INVALID_INPUT('Card ID required');

    const cardKey = `card:${id}`;
    const existing = await env.CARDS.get(cardKey);
    if (!existing) throw Errors.NOT_FOUND('Card not found');

    const updated = {
      ...JSON.parse(existing),
      ...updates,
      id, // Ensure ID doesn't change
    };

    await env.CARDS.put(cardKey, JSON.stringify(updated));
    return jsonResponse(updated);
  }),

  delete: requireAuth(async (request: Request, env: Env, userId: string) => {
    const isAdmin = await verifyAdmin(userId, env);
    if (!isAdmin) {
      throw Errors.FORBIDDEN();
    }

    const formData = await request.formData();
    const cardId = formData.get('cardId') as string;

    if (!cardId) {
      throw Errors.INVALID_INPUT('Card ID required');
    }

    await env.CARDS.delete(`card:${cardId}`);
    return jsonResponse({ success: true });
  }),
};
