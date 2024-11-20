import { KVNamespace, R2Bucket } from '@cloudflare/workers-types';

/**
 * Environment bindings for the worker runtime.
 */
export interface Env {
  // KV Namespaces
  PLAYER_QUEUE: KVNamespace;
  GAME_STATE: KVNamespace;
  USER_DATA: KVNamespace;
  DECKS: KVNamespace;
  CARDS: KVNamespace;

  // R2 Storage
  ASSETS: R2Bucket;

  // Environment variables
  ENVIRONMENT: string;
}
