import type { CardDefinition, Deck, PhaseType, GameState, Layer } from '@shared/types';
import superjson from 'superjson';

interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

class APIClient {
  private static baseUrl = '/api';
  private static headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  private static async makeRequest<T>(
    endpoint: string,
    method: string,
    body?: any,
    customHeaders?: HeadersInit,
  ): Promise<T> {
    const profileId = localStorage.getItem('profileId');
    const headers = {
      ...this.headers,
      ...(profileId && { 'X-Profile-ID': profileId }),
      ...customHeaders,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      ...(body && { body: typeof body === 'string' ? body : superjson.stringify(body) }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    const data: APIResponse<T> = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Request failed');
    }

    console.log(superjson.parse(data as any));

    return data.data;
  }

  static get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, 'GET');
  }

  static post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, 'POST', data);
  }

  static put<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>(endpoint, 'PUT', data);
  }

  static delete<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, 'DELETE', data);
  }
}

// Game API
export const gameAPI = {
  getState: (gameCode: string) => APIClient.get<GameState>(`/game/state?gameCode=${gameCode}`),

  create: () => APIClient.post<{ gameCode: string }>('/game/create'),

  join: (gameCode: string) => APIClient.post<{ success: boolean }>('/game/join', { gameCode }),

  start: (gameCode: string) => APIClient.post<{ success: boolean }>('/game/start', { gameCode }),

  leave: (gameCode: string) => APIClient.post<{ success: boolean }>('/game/leave', { gameCode }),

  playCard: (gameCode: string, cardId: string, position: number) =>
    APIClient.post<{ success: boolean }>('/game/play-card', { gameCode, cardId, position }),

  activateAbility: (gameCode: string, cardId: string, abilityIndex: number, targets: string[]) =>
    APIClient.post<{ success: boolean }>('/game/activate-ability', {
      gameCode,
      cardId,
      abilityIndex,
      targets,
    }),

  changePhase: (gameCode: string, phase: PhaseType) =>
    APIClient.post<{ success: boolean }>('/game/change-phase', { gameCode, phase }),

  changeLayer: (gameCode: string, layer: Layer) =>
    APIClient.post<{ success: boolean }>('/game/change-layer', { gameCode, layer }),

  endTurn: (gameCode: string) =>
    APIClient.post<{ success: boolean }>('/game/end-turn', { gameCode }),

  declareAttack: (gameCode: string, attackerId: string, targetId: string) =>
    APIClient.post<{ success: boolean }>('/game/declare-attack', {
      gameCode,
      attackerId,
      targetId,
    }),

  surrender: (gameCode: string) =>
    APIClient.post<{ success: boolean }>('/game/surrender', { gameCode }),

  spendResources: (gameCode: string, resources: Record<Layer, number>) =>
    APIClient.post<{ success: boolean }>('/game/spend-resources', { gameCode, resources }),
};

// Profile API
export const profileAPI = {
  get: (id: string) => APIClient.get(`/profile?id=${id}`),

  create: (username: string) => APIClient.post('/profile/create', { username }),

  update: (updates: Record<string, any>) => APIClient.post('/profile', updates),
};

// Deck API
export const deckAPI = {
  get: (deckId: string) => APIClient.get(`/deck?id=${deckId}`),

  list: () => APIClient.get('/deck/list'),

  create: (deck: Partial<Deck>) => APIClient.post('/deck/create', deck),

  update: (deckId: string, updates: Partial<Deck>) =>
    APIClient.post('/deck/update', { deckId, ...updates }),

  delete: (deckId: string) => APIClient.post('/deck/delete', { deckId }),
};

// Card API (admin only)
export const cardAPI = {
  list: () => APIClient.get('/admin/cards'),

  create: (cardData: FormData) => APIClient.post('/admin/cards', cardData),

  update: (cardId: string, updates: Partial<CardDefinition>) =>
    APIClient.put('/admin/cards', { cardId, ...updates }),

  delete: (cardId: string) => APIClient.delete('/admin/cards', { cardId }),

  uploadArtwork: (cardId: string, artwork: File) => {
    const formData = new FormData();
    formData.append('cardId', cardId);
    formData.append('artwork', artwork);
    return APIClient.post('/admin/cards/artwork', formData);
  },
};
