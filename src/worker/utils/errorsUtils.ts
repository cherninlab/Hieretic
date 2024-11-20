/**
 * Error utilities and factories
 */

export class GameError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export const Errors = {
  NOT_FOUND: (resource: string) => new GameError('NOT_FOUND', `${resource} not found`, 404),

  INVALID_INPUT: (message: string) => new GameError('INVALID_INPUT', message, 400),

  UNAUTHORIZED: () => new GameError('UNAUTHORIZED', 'Unauthorized', 401),

  FORBIDDEN: () => new GameError('FORBIDDEN', 'Forbidden', 403),
};
