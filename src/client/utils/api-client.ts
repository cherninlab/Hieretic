import type { GamePhase, GameState, Layer } from '@shared/types';

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

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const profileId = localStorage.getItem('profileId');
    if (profileId) {
      this.headers = {
        ...this.headers,
        'X-Profile-ID': profileId,
      };
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    const data: APIResponse<T> = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data;
  }
}

export const gameAPI = {
  // Game state
  getState: (gameCode: string) => APIClient.request<GameState>(`/game/state?gameCode=${gameCode}`),

  // Game creation & joining
  create: () =>
    APIClient.request<{ gameCode: string }>('/game/create', {
      method: 'POST',
    }),

  join: (gameCode: string) =>
    APIClient.request<{ success: boolean }>('/game/join', {
      method: 'POST',
      body: JSON.stringify({ gameCode }),
    }),

  start: (gameCode: string) =>
    APIClient.request<{ success: boolean }>('/game/start', {
      method: 'POST',
      body: JSON.stringify({ gameCode }),
    }),

  // Game actions
  playCard: (gameCode: string, cardId: string, position: number) =>
    APIClient.request<{ success: boolean }>('/game/play-card', {
      method: 'POST',
      body: JSON.stringify({ gameCode, cardId, position }),
    }),

  activateAbility: (gameCode: string, cardId: string, abilityIndex: number, targets: string[]) =>
    APIClient.request<{ success: boolean }>('/game/activate-ability', {
      method: 'POST',
      body: JSON.stringify({ gameCode, cardId, abilityIndex, targets }),
    }),

  changePhase: (gameCode: string, phase: GamePhase) =>
    APIClient.request<{ success: boolean }>('/game/change-phase', {
      method: 'POST',
      body: JSON.stringify({ gameCode, phase }),
    }),

  changeLayer: (gameCode: string, layer: Layer) =>
    APIClient.request<{ success: boolean }>('/game/change-layer', {
      method: 'POST',
      body: JSON.stringify({ gameCode, layer }),
    }),

  endTurn: (gameCode: string) =>
    APIClient.request<{ success: boolean }>('/game/end-turn', {
      method: 'POST',
      body: JSON.stringify({ gameCode }),
    }),

  declareAttack: (gameCode: string, attackerId: string, targetId: string) =>
    APIClient.request<{ success: boolean }>('/game/declare-attack', {
      method: 'POST',
      body: JSON.stringify({ gameCode, attackerId, targetId }),
    }),

  surrender: (gameCode: string) =>
    APIClient.request<{ success: boolean }>('/game/surrender', {
      method: 'POST',
      body: JSON.stringify({ gameCode }),
    }),

  // Resource management
  spendResources: (gameCode: string, resources: Record<Layer, number>) =>
    APIClient.request<{ success: boolean }>('/game/spend-resources', {
      method: 'POST',
      body: JSON.stringify({ gameCode, resources }),
    }),
};

export const profileAPI = {
  get: (id: string) => APIClient.request(`/profile?id=${id}`),

  create: (username: string) =>
    APIClient.request('/profile/create', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  update: (updates: Record<string, any>) =>
    APIClient.request('/profile', {
      method: 'POST',
      body: JSON.stringify(updates),
    }),
};
