import { KVNamespace } from '@cloudflare/workers-types';
import superjson from 'superjson';

export interface KVOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Optional prefix for the key */
  prefix?: string;
}

export class KVStore {
  constructor(
    private namespace: KVNamespace,
    private defaultOptions: KVOptions = {},
  ) {}

  /**
   * Get a value from KV store
   */
  async get<T>(key: string, options: KVOptions = {}): Promise<T | null> {
    const fullKey = this.getFullKey(key, options);
    const data = await this.namespace.get(fullKey);
    if (!data) return null;
    return superjson.parse<T>(data);
  }

  /**
   * Put a value in KV store
   */
  async put<T>(key: string, value: T, options: KVOptions = {}): Promise<void> {
    const fullKey = this.getFullKey(key, options);
    const serialized = superjson.stringify(value);
    await this.namespace.put(fullKey, serialized, {
      expirationTtl: options.ttl || this.defaultOptions.ttl,
    });
  }

  /**
   * Delete a value from KV store
   */
  async delete(key: string, options: KVOptions = {}): Promise<void> {
    const fullKey = this.getFullKey(key, options);
    await this.namespace.delete(fullKey);
  }

  /**
   * Check if a key exists
   */
  async exists(key: string, options: KVOptions = {}): Promise<boolean> {
    const fullKey = this.getFullKey(key, options);
    const value = await this.namespace.get(fullKey, 'text');
    return value !== null;
  }

  /**
   * List all keys with a prefix
   */
  async list(options: KVOptions = {}): Promise<{ keys: string[] }> {
    const prefix = this.getFullKey('', options);
    const result = await this.namespace.list({ ...options, prefix });
    return {
      keys: result.keys.map((k) => k.name.slice(prefix.length)),
    };
  }

  /**
   * Get multiple values at once
   */
  async getMany<T>(keys: string[], options: KVOptions = {}): Promise<(T | null)[]> {
    return Promise.all(keys.map((key) => this.get<T>(key, options)));
  }

  /**
   * Put multiple values at once
   */
  async putMany(
    entries: { key: string; value: unknown }[],
    options: KVOptions = {},
  ): Promise<void> {
    await Promise.all(entries.map(({ key, value }) => this.put(key, value, options)));
  }

  /**
   * Atomic update operation
   */
  async update<T>(
    key: string,
    updateFn: (currentValue: T | null) => T | null,
    options: KVOptions = {},
  ): Promise<T | null> {
    const currentValue = await this.get<T>(key, options);
    const newValue = updateFn(currentValue);

    if (newValue === null) {
      await this.delete(key, options);
      return null;
    }

    await this.put(key, newValue, options);
    return newValue;
  }

  /**
   * Get a value with automatic expiration refresh
   */
  async getWithRefresh<T>(
    key: string,
    options: KVOptions & { refreshTtl: number },
  ): Promise<T | null> {
    const value = await this.get<T>(key, options);
    if (value && options.refreshTtl) {
      // Refresh TTL by writing back
      await this.put(key, value, { ...options, ttl: options.refreshTtl });
    }
    return value;
  }

  private getFullKey(key: string, options: KVOptions): string {
    const prefix = options.prefix || this.defaultOptions.prefix || '';
    return prefix ? `${prefix}:${key}` : key;
  }
}

/**
 * Factory functions for different types of KV stores
 */
export const createKVStore = {
  games: (namespace: KVNamespace) =>
    new KVStore(namespace, {
      prefix: 'game',
      ttl: 24 * 60 * 60, // 24 hours default TTL for games
    }),

  profiles: (namespace: KVNamespace) =>
    new KVStore(namespace, {
      prefix: 'profile',
    }),

  decks: (namespace: KVNamespace) =>
    new KVStore(namespace, {
      prefix: 'deck',
    }),

  cards: (namespace: KVNamespace) =>
    new KVStore(namespace, {
      prefix: 'card',
    }),

  matchmaking: (namespace: KVNamespace) =>
    new KVStore(namespace, {
      prefix: 'queue',
      ttl: 5 * 60, // 5 minutes default TTL for matchmaking
    }),
};
