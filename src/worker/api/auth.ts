import { Env } from '../types';
import { Errors } from '../utils/errors';

export async function getAuthenticatedUser(request: Request, env: Env): Promise<string> {
  const profileId = request.headers.get('X-Profile-ID');

  if (!profileId) {
    throw Errors.UNAUTHORIZED();
  }

  // Handle different profile ID formats
  const cleanProfileId = profileId.replace('user:', '');
  const fullProfileId = `user:${cleanProfileId}`;

  // Validate profile exists in KV store
  const profile = await env.USER_DATA.get(fullProfileId);
  if (!profile) {
    throw Errors.UNAUTHORIZED();
  }

  return fullProfileId;
}

export function requireAuth(handler: Function) {
  return async (request: Request, env: Env, ...args: any[]) => {
    try {
      const userId = await getAuthenticatedUser(request, env);
      return handler(request, env, userId, ...args);
    } catch (error) {
      if (error instanceof Error) {
        throw Errors.UNAUTHORIZED(error.message);
      }
      throw error;
    }
  };
}
