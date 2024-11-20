import { Errors } from './errors';

export function validateUsername(username: string): boolean {
  if (!username || username.length < 3) {
    throw Errors.INVALID_INPUT('Username must be at least 3 characters long');
  }

  if (username.length > 20) {
    throw Errors.INVALID_INPUT('Username must be less than 20 characters long');
  }

  // Add more username validation rules as needed
  return true;
}

export function validateDeck(cards: string[]): boolean {
  if (!Array.isArray(cards)) {
    throw Errors.INVALID_INPUT('Invalid deck format');
  }

  if (cards.length < 30) {
    throw Errors.INVALID_INPUT('Deck must contain at least 30 cards');
  }

  if (cards.length > 50) {
    throw Errors.INVALID_INPUT('Deck cannot contain more than 50 cards');
  }

  // Add more deck validation rules as needed
  return true;
}

export function validateGameState(players: string[], phase: string, turn: number): boolean {
  if (!Array.isArray(players) || players.length !== 2) {
    throw Errors.INVALID_INPUT('Game requires exactly 2 players');
  }

  if (!['main', 'combat', 'end'].includes(phase)) {
    throw Errors.INVALID_INPUT('Invalid game phase');
  }

  if (turn < 0) {
    throw Errors.INVALID_INPUT('Invalid turn number');
  }

  return true;
}
