import { Env } from '../types';

// Temporary solution until proper auth is implemented
export async function getAuthenticatedUser(_: Request): Promise<string> {
  // In production, this would validate tokens, etc.
  return `user-${Date.now()}`;
}

export function requireAuth(handler: Function) {
  return async (request: Request, env: Env, ...args: any[]) => {
    const userId = await getAuthenticatedUser(request);
    return handler(request, env, userId, ...args);
  };
}
