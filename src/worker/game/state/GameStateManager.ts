import { GameAction, GameState } from '@shared/types/game';
import { Env } from '@worker/types';
import { Errors } from '@worker/utils/errors';
import { kvGet, kvPut } from '@worker/utils/kv';

export class GameStateManager {
  constructor(private env: Env) {}

  async getState(gameId: string): Promise<GameState> {
    const state = await kvGet<GameState>(this.env.GAME_STATE, `game:${gameId}`);
    if (!state) {
      throw Errors.NOT_FOUND('Game not found');
    }
    return state;
  }

  async saveState(gameId: string, state: GameState): Promise<void> {
    await kvPut(this.env.GAME_STATE, `game:${gameId}`, state);
  }

  async createGame(players: string[]): Promise<GameState> {
    const gameId = `game-${Date.now()}`;

    const initialState: GameState = {
      id: gameId,
      status: 'waiting',
      turn: 1,
      phase: 'init',
      currentPlayer: players[0],
      players: {},
      activeEffects: [],
      history: [],
    };

    // Initialize player states
    for (const playerId of players) {
      initialState.players[playerId] = {
        id: playerId,
        health: 20,
        deck: [],
        hand: [],
        field: [null, null, null, null],
        resources: {
          material: 0,
          mind: 0,
          void: 0,
        },
        activeLayer: 'material',
      };
    }

    await this.saveState(gameId, initialState);
    return initialState;
  }

  async applyAction(gameId: string, action: GameAction): Promise<GameState> {
    const state = await this.getState(gameId);

    // Validate action
    if (!this.validateAction(state, action)) {
      throw Errors.INVALID_INPUT('Invalid action');
    }

    // Apply action
    const newState = await this.handleAction(state, action);

    // Save new state
    await this.saveState(gameId, newState);

    // Emit any events
    await this.emitEvents(newState, action);

    return newState;
  }

  private validateAction(state: GameState, action: GameAction): boolean {
    // Basic validation
    if (state.status !== 'active') return false;
    if (state.currentPlayer !== action.playerId) return false;

    // TODO: Add specific action validation
    return true;
  }

  private async handleAction(state: GameState, _action: GameAction): Promise<GameState> {
    // TODO: Add specific action handlers
    return state;
  }

  private async emitEvents(_state: GameState, _action: GameAction): Promise<void> {
    // TODO: Implement event emission
  }
}
