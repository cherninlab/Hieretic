import { APIError } from '../types';

export function createError(code: string, message: string, status: number = 400): APIError {
  return new APIError({
    code,
    message,
    status,
  });
}

export const Errors = {
  NOT_FOUND: (resource: string) => createError('NOT_FOUND', `${resource} not found`, 404),

  INVALID_INPUT: (message: string) => createError('INVALID_INPUT', message, 400),

  UNAUTHORIZED: () => createError('UNAUTHORIZED', 'Unauthorized', 401),

  FORBIDDEN: () => createError('FORBIDDEN', 'Forbidden', 403),

  CONFLICT: (message: string) => createError('CONFLICT', message, 409),

  INTERNAL: (message: string = 'Internal server error') =>
    createError('INTERNAL_ERROR', message, 500),
};
