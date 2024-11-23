import { createTestDeck } from '@shared/testing/test-cards';
import type {
  Card,
  Effect,
  GameAction,
  GameEffect,
  GamePhase,
  GameState,
  Layer,
  PlayerState,
  UserProfile,
} from '@shared/types';
import type { Env } from '@worker/types';
import { Errors } from '@worker/utils/errors';
import { kvGet, kvPut } from '@worker/utils/kv';
import { handleAction } from '../actions/handlers';
import { validateAction } from '../actions/validators';
import { GameEventTypes } from '../events/types';

const INITIAL_HAND_SIZE = 5;
const INITIAL_HEALTH = 20;
const INITIAL_RESOURCES = {
  material: 3,
  mind: 3,
};
const FIELD_SIZE = 4;

export class GameStateManager {
  constructor(private env: Env) {}

  async getState(gameId: string): Promise<GameState> {
    const state = await kvGet<GameState>(this.env.GAME_STATE, gameId);
    if (!state) {
      throw Errors.NOT_FOUND('Game not found');
    }
    return state;
  }

  async saveState(gameId: string, state: GameState): Promise<void> {
    await kvPut(this.env.GAME_STATE, gameId, state);
  }

  async createGame(players: string[]): Promise<GameState> {
    if (players.length !== 2) {
      throw Errors.INVALID_INPUT('Game requires exactly 2 players');
    }

    // Initialize decks and hands
    const { playerDecks, playerHands } = this.initializeDecksAndHands(players.length);

    // Fetch player profiles
    const playerProfiles: Record<string, UserProfile> = {};
    await Promise.all(
      players.map(async (playerId) => {
        const profileData = await this.env.USER_DATA.get(playerId);
        if (profileData) {
          try {
            playerProfiles[playerId] = JSON.parse(profileData);
          } catch (e) {
            console.error(`Failed to parse profile data for ${playerId}:`, e);
            playerProfiles[playerId] = {
              id: playerId,
              username: `Player-${playerId.slice(-4)}`,
              activeDeckId: '',
              created: Date.now(),
              preferences: { theme: 'default', cardBack: 'default' },
              statistics: { gamesPlayed: 0, wins: 0, losses: 0, winStreak: 0 },
            };
          }
        }
      }),
    );

    const initialState: GameState = {
      id: `game-${Date.now()}`,
      status: 'active',
      turn: 1,
      phase: 'draw',
      currentPlayer: players[0],
      players: this.createPlayerStates(players, playerDecks, playerHands),
      activeEffects: [],
      history: [],
      playerProfiles,
      createdBy: players[0],
      created: Date.now(),
      startedAt: Date.now(),
    };

    await this.saveState(initialState.id, initialState);
    return initialState;
  }

  private initializeDecksAndHands(playerCount: number): {
    playerDecks: string[][];
    playerHands: Card[][];
  } {
    const testDeck = createTestDeck();
    const playerDecks: string[][] = [];
    const playerHands: Card[][] = [];

    for (let i = 0; i < playerCount; i++) {
      const shuffledDeck = this.shuffleDeck([...testDeck]);
      const hand = shuffledDeck.slice(0, INITIAL_HAND_SIZE);
      const deck = shuffledDeck.slice(INITIAL_HAND_SIZE).map((card) => card.id);

      playerHands.push(hand);
      playerDecks.push(deck);
    }

    return { playerDecks, playerHands };
  }

  private shuffleDeck<T>(deck: T[]): T[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private createPlayerStates(
    players: string[],
    decks: string[][],
    hands: Card[][],
  ): Record<string, PlayerState> {
    return players.reduce(
      (states, playerId, index) => {
        states[playerId] = {
          id: playerId,
          health: INITIAL_HEALTH,
          deck: decks[index],
          hand: hands[index],
          field: Array(FIELD_SIZE).fill(null),
          resources: { ...INITIAL_RESOURCES },
          activeLayer: 'material' as Layer,
          activeEffects: [],
        };
        return states;
      },
      {} as Record<string, PlayerState>,
    );
  }

  async applyAction(gameId: string, action: GameAction): Promise<GameState> {
    const state = await this.getState(gameId);

    if (!validateAction(state, action)) {
      throw Errors.INVALID_INPUT('Invalid action');
    }

    const newState = handleAction(state, action);
    await this.saveState(gameId, newState);
    await this.processGameEvents(newState, action);

    // Check win conditions
    const gameOver = await this.checkWinConditions(newState);
    if (gameOver) {
      await this.saveState(gameId, gameOver);
      return gameOver;
    }

    return newState;
  }

  private async processGameEvents(state: GameState, action: GameAction): Promise<void> {
    const events = [];

    // Handle phase changes
    if (action.type === 'CHANGE_PHASE') {
      events.push({
        type: GameEventTypes.PHASE_CHANGED,
        data: { phase: action.data.phase as GamePhase },
      });
    }

    // Process active effects
    const expiredEffects: GameEffect[] = [];
    const activeEffects = state.activeEffects.filter((effect) => {
      if (effect.remainingDuration <= 0) {
        expiredEffects.push(effect);
        return false;
      }
      return true;
    });

    // Handle expired effects
    for (const effect of expiredEffects) {
      events.push({
        type: GameEventTypes.EFFECT_TRIGGERED,
        data: { effect, expired: true },
      });

      // Remove effect from affected cards
      if (effect.affectedCardIds.length > 0) {
        await this.removeEffectFromCards(state, effect);
      }
    }

    // Update state with processed effects
    state.activeEffects = activeEffects;
  }

  private async removeEffectFromCards(_state: GameState, _effect: GameEffect): Promise<void> {
    // Implement effect removal logic here
    // This would need to update the cards in the game state to remove the effect
    // You'll need to handle different effect types differently
  }

  private async checkWinConditions(state: GameState): Promise<GameState | null> {
    for (const [playerId, playerState] of Object.entries(state.players)) {
      if (playerState.health <= 0) {
        const winner = Object.keys(state.players).find((id) => id !== playerId);
        if (winner) {
          return {
            ...state,
            status: 'finished',
            winner,
            finishedAt: Date.now(),
          };
        }
      }

      // Check for deck-out condition
      if (playerState.deck.length === 0 && playerState.hand.length === 0) {
        const winner = Object.keys(state.players).find((id) => id !== playerId);
        if (winner) {
          return {
            ...state,
            status: 'finished',
            winner,
            finishedAt: Date.now(),
          };
        }
      }
    }
    return null;
  }

  async addEffectToState(state: GameState, effect: Effect, sourceId: string): Promise<GameState> {
    const gameEffect: GameEffect = {
      id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceCardId: sourceId,
      sourceName: 'Unknown Source', // You might want to look up the actual card name
      type: effect.type,
      target: effect.target,
      value: effect.value,
      remainingDuration: effect.duration || 1,
      affectedCardIds: [],
    };

    state.activeEffects.push(gameEffect);
    await this.saveState(state.id, state);
    return state;
  }
}
