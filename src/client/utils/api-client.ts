import type { GamePhase, GameStateResponse } from '@shared/types/game';
import type { UserProfile } from '@shared/types/user';

interface CreateGameResponse {
  gameCode: string;
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

// Base API client
class APIClient {
  private static getHeaders(skipAuth: boolean = false): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const profileId = localStorage.getItem('profileId');
      if (profileId) {
        headers['X-Profile-ID'] = profileId;
      }
    }

    return headers;
  }

  static async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const response = await fetch(`/api${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...this.getHeaders(skipAuth),
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Network response was not ok');
    }

    const data = await response.json();
    return data.data;
  }
}

// Game-specific API methods
export const gameAPI = {
  // Game creation and joining
  create: () =>
    APIClient.fetch<CreateGameResponse>('/game/create', {
      method: 'POST',
    }),

  join: (gameCode: string) =>
    APIClient.fetch<{ success: boolean }>('/game/join', {
      method: 'POST',
      body: JSON.stringify({ gameCode }),
    }),

  // Game state management
  getState: (gameCode: string) =>
    APIClient.fetch<GameStateResponse>(`/game/state?gameCode=${gameCode}`),

  start: (gameCode: string) =>
    APIClient.fetch<{ success: boolean }>('/game/start', {
      method: 'POST',
      body: JSON.stringify({ gameCode }),
    }),

  // Game actions
  playCard: (gameCode: string, cardId: string, position: number) =>
    APIClient.fetch<{ success: boolean }>('/game/play-card', {
      method: 'POST',
      body: JSON.stringify({ gameCode, cardId, position }),
    }),

  changePhase: (gameCode: string, phase: GamePhase) =>
    APIClient.fetch<{ success: boolean }>('/game/change-phase', {
      method: 'POST',
      body: JSON.stringify({ gameCode, phase }),
    }),

  endTurn: (gameCode: string) =>
    APIClient.fetch<{ success: boolean }>('/game/end-turn', {
      method: 'POST',
      body: JSON.stringify({ gameCode }),
    }),

  // Combat actions
  declareAttack: (gameCode: string, attackerId: string, targetId: string) =>
    APIClient.fetch<{ success: boolean }>('/game/declare-attack', {
      method: 'POST',
      body: JSON.stringify({ gameCode, attackerId, targetId }),
    }),

  declareBlock: (gameCode: string, blockerId: string, attackerId: string) =>
    APIClient.fetch<{ success: boolean }>('/game/declare-block', {
      method: 'POST',
      body: JSON.stringify({ gameCode, blockerId, attackerId }),
    }),

  // Card abilities
  activateAbility: (gameCode: string, cardId: string, abilityIndex: number, targets: string[]) =>
    APIClient.fetch<{ success: boolean }>('/game/activate-ability', {
      method: 'POST',
      body: JSON.stringify({ gameCode, cardId, abilityIndex, targets }),
    }),

  // Layer management
  changeLayer: (gameCode: string, layer: 'material' | 'mind' | 'void') =>
    APIClient.fetch<{ success: boolean }>('/game/change-layer', {
      method: 'POST',
      body: JSON.stringify({ gameCode, layer }),
    }),

  // Resource management
  spendResources: (gameCode: string, resources: Record<string, number>) =>
    APIClient.fetch<{ success: boolean }>('/game/spend-resources', {
      method: 'POST',
      body: JSON.stringify({ gameCode, resources }),
    }),

  // Game lifecycle
  surrender: (gameCode: string) =>
    APIClient.fetch<{ success: boolean }>('/game/surrender', {
      method: 'POST',
      body: JSON.stringify({ gameCode }),
    }),

  // Matchmaking
  findMatch: () =>
    APIClient.fetch<{ gameCode: string }>('/matchmake', {
      method: 'POST',
    }),

  cancelMatchmaking: () =>
    APIClient.fetch<{ success: boolean }>('/matchmake/cancel', {
      method: 'POST',
    }),
};

// Profile-specific API methods
export const profileAPI = {
  get: (id: string) => APIClient.fetch(`/profile?id=${id}`),

  create: (username: string) =>
    APIClient.fetch('/profile/create', {
      method: 'POST',
      body: JSON.stringify({ username }),
      skipAuth: true,
    }),

  update: (updates: Partial<UserProfile>) =>
    APIClient.fetch('/profile', {
      method: 'POST',
      body: JSON.stringify(updates),
    }),
};
