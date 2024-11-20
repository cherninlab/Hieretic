import type { KVNamespace } from '@cloudflare/workers-types';

export async function kvGet<T>(namespace: KVNamespace, key: string): Promise<T | null> {
  try {
    const data = await namespace.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting ${key} from KV:`, error);
    return null;
  }
}

export async function kvPut(namespace: KVNamespace, key: string, data: any): Promise<boolean> {
  try {
    await namespace.put(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error putting ${key} to KV:`, error);
    return false;
  }
}

export async function kvDelete(namespace: KVNamespace, key: string): Promise<boolean> {
  try {
    await namespace.delete(key);
    return true;
  } catch (error) {
    console.error(`Error deleting ${key} from KV:`, error);
    return false;
  }
}

export async function kvList<T>(
  namespace: KVNamespace,
  prefix?: string,
  limit?: number,
): Promise<T[]> {
  try {
    const list = await namespace.list({ prefix, limit });
    const items = await Promise.all(list.keys.map((key) => namespace.get(key.name)));

    return items.filter((item): item is string => item !== null).map((item) => JSON.parse(item));
  } catch (error) {
    console.error(`Error listing from KV:`, error);
    return [];
  }
}
