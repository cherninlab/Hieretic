import type { KVNamespace, R2Bucket } from '@cloudflare/workers-types';
import type { Card, Effect, GameState, ResourceState } from '@shared/types';

export interface Env {
  // KV Namespaces
  PLAYER_QUEUE: KVNamespace;
  GAME_STATE: KVNamespace;
  USER_DATA: KVNamespace;
  DECKS: KVNamespace;
  CARDS: KVNamespace;

  // R2 Bucket
  ASSETS: R2Bucket;

  // Environment variables
  ENVIRONMENT: string;
}

export interface APIError {
  code: string;
  message: string;
  status: number;
}

export class APIError implements APIError {
  constructor({ code, message, status }: APIError) {
    this.code = code;
    this.message = message;
    this.status = status;
  }
}

export interface MatchmakingPlayer {
  playerId: string;
  timestamp: number;
}

export interface GameSession extends GameState {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  createdBy: string;
  created: number;
  updated: number;
  startedAt?: number;
  finishedAt?: number;
  winner?: string;
}

export interface PlayerState {
  hand: Card[];
  deck: string[]; // Card IDs
  resources: ResourceState;
  health: number;
}

export interface LayerState {
  resources: number;
  activeEffects?: Effect[];
}

// Route handler types
export type RouteHandler = (request: Request, env: Env) => Promise<Response>;
export type AuthenticatedHandler = (
  request: Request,
  env: Env,
  userId: string,
) => Promise<Response>;
