import type { Card, Deck, GameAction, GameEvent, GameState, PlayerState } from '@shared/types';
import { HTTPException } from 'hono/http-exception';
import type { Env } from '../../types/env';
import { handleAction } from '../actions/handlers';
import { validateAction } from '../actions/validators';
import { processEffects } from '../effects/handlers';

const INITIAL_HAND_SIZE = 5;
const INITIAL_HEALTH = 20;
const INITIAL_RESOURCES = { material: 3, mind: 3 };
const FIELD_SIZE = 4;

export class GameStateManager {
  constructor(private readonly env: Env) {}

  /**
   * Create a new game
   */
  async createGame(playerId: string, deckId: string): Promise<GameState> {
    let deck: Deck | null;

    deck = await this.env.DECKS.get(`${playerId}/${deckId}`, {
      type: 'json',
    });

    if (!deck) {
      throw new HTTPException(400, { message: 'Deck not found' });
    }

    const shuffledDeck = this.shuffleArray([...deck.cards]);
    const initialHand = shuffledDeck.slice(0, INITIAL_HAND_SIZE);
    const remainingDeck = shuffledDeck.slice(INITIAL_HAND_SIZE);

    // Load card details for hand
    const handCards: (Card | null)[] = await Promise.all(
      initialHand.map(async (cardId) => {
        return await this.env.CARDS.get(`card:${cardId}`, {
          type: 'json',
        });
      }),
    );

    // Create player state
    const playerState: PlayerState = {
      id: playerId,
      health: INITIAL_HEALTH,
      deck: remainingDeck,
      hand: handCards.filter((i) => i != null),
      field: Array(FIELD_SIZE).fill(null),
      resources: { ...INITIAL_RESOURCES },
      activeLayer: 'material',
      activeEffects: [],
    };

    // Create initial game state
    const gameState: GameState = {
      id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'waiting',
      turn: 0,
      phase: 'init',
      currentPlayer: playerId,
      players: { [playerId]: playerState },
      activeEffects: [],
      history: [],
      createdBy: playerId,
      created: Date.now(),
      lastAccessed: Date.now(),
      playerProfiles: {},
    };

    // Save initial state
    await this.saveState(gameState);
    return gameState;
  }

  /**
   * Join an existing game
   */
  async joinGame(gameCode: string, playerId: string, deckId: string): Promise<GameState> {
    const state = await this.getState(gameCode);

    if (state.status !== 'waiting') {
      throw new HTTPException(400, { message: 'Game is not in waiting state' });
    }

    if (state.players[playerId]) {
      throw new HTTPException(400, { message: 'Already in game' });
    }

    if (Object.keys(state.players).length >= 2) {
      throw new HTTPException(400, { message: 'Game is full' });
    }

    // Get player's deck
    const deck: Deck | null = await this.env.DECKS.get(`${playerId}/${deckId}`, {
      type: 'json',
    });

    if (!deck) {
      throw new HTTPException(400, { message: 'Deck not found' });
    }

    const shuffledDeck = this.shuffleArray([...deck.cards]);
    const initialHand = shuffledDeck.slice(0, INITIAL_HAND_SIZE);
    const remainingDeck = shuffledDeck.slice(INITIAL_HAND_SIZE);

    // Load card details for hand
    const handCards: (Card | null)[] = await Promise.all(
      initialHand.map(async (cardId) => {
        return await this.env.CARDS.get(`card:${cardId}`, {
          type: 'json',
        });
      }),
    );

    // Create player state
    const playerState: PlayerState = {
      id: playerId,
      health: INITIAL_HEALTH,
      deck: remainingDeck,
      hand: handCards.filter((i) => i != null),
      field: Array(FIELD_SIZE).fill(null),
      resources: { ...INITIAL_RESOURCES },
      activeLayer: 'material',
      activeEffects: [],
    };

    // Update game state
    state.players[playerId] = playerState;
    state.status = 'active';
    state.phase = 'draw';
    state.turn = 1;
    state.lastAccessed = Date.now();

    await this.saveState(state);
    return state;
  }

  /**
   * Get current game state
   */
  async getState(gameCode: string): Promise<GameState> {
    const state = await this.env.GAME_STATE.get(gameCode);
    if (!state) {
      throw new HTTPException(404, { message: 'Game not found' });
    }
    return JSON.parse(state);
  }

  /**
   * Apply an action to the game state
   */
  async applyAction(gameCode: string, action: GameAction): Promise<GameState> {
    const state = await this.getState(gameCode);

    // Validate action
    if (!validateAction(state, action)) {
      throw new HTTPException(400, { message: 'Invalid action' });
    }

    try {
      // Apply action
      const newState = handleAction(state, action);

      // Process effects
      const { state: finalState } = await this.processStateUpdate(newState);

      // Update history
      finalState.history.push({
        type: action.type,
        playerId: action.playerId,
        timestamp: action.timestamp,
        data: action.data,
      });

      // Check win conditions
      const gameOver = this.checkWinConditions(finalState);
      if (gameOver) {
        finalState.status = 'finished';
        finalState.winner = gameOver.winner;
        await this.updateStatistics(gameOver.winner, gameOver.loser);
      }

      finalState.lastAccessed = Date.now();
      await this.saveState(finalState);
      return finalState;
    } catch (error) {
      console.error('Error applying action:', error);
      throw new HTTPException(500, { message: 'Failed to apply action' });
    }
  }

  /**
   * Process state update and effects
   */
  private async processStateUpdate(
    state: GameState,
  ): Promise<{ state: GameState; events: GameEvent[] }> {
    const events: GameEvent[] = [];

    // Process global effects
    const { state: stateAfterEffects, events: effectEvents } = await processEffects(state);
    events.push(...effectEvents);

    // Process phase-specific effects
    switch (state.phase) {
      case 'draw':
        const { state: stateAfterDraw, events: drawEvents } =
          await this.handleDrawPhase(stateAfterEffects);
        return { state: stateAfterDraw, events: [...events, ...drawEvents] };

      case 'end':
        const { state: stateAfterEnd, events: endEvents } =
          await this.handleEndPhase(stateAfterEffects);
        return { state: stateAfterEnd, events: [...events, ...endEvents] };

      default:
        return { state: stateAfterEffects, events };
    }
  }

  /**
   * Handle draw phase
   */
  private async handleDrawPhase(
    state: GameState,
  ): Promise<{ state: GameState; events: GameEvent[] }> {
    const events: GameEvent[] = [];
    const player = state.players[state.currentPlayer];

    if (player.deck.length > 0) {
      // Draw card
      const cardId = player.deck[0];
      const card: Card | null = await this.env.CARDS.get(`card:${cardId}`, {
        type: 'json',
      });

      if (card) {
        player.hand.push(card);
        player.deck = player.deck.slice(1);

        events.push({
          type: 'CARD_DRAWN',
          playerId: player.id,
          cardId: card.id,
          timestamp: Date.now(),
        });
      }
    }

    return { state, events };
  }

  /**
   * Handle end phase
   */
  private async handleEndPhase(
    state: GameState,
  ): Promise<{ state: GameState; events: GameEvent[] }> {
    const events: GameEvent[] = [];
    const player = state.players[state.currentPlayer];

    // Replenish resources
    player.resources = { ...INITIAL_RESOURCES };

    events.push({
      type: 'RESOURCES_REPLENISHED',
      playerId: player.id,
      resources: player.resources,
      timestamp: Date.now(),
    });

    return { state, events };
  }

  /**
   * Check win conditions
   */
  private checkWinConditions(state: GameState): { winner: string; loser: string } | null {
    for (const [playerId, playerState] of Object.entries(state.players)) {
      // Check health
      if (playerState.health <= 0) {
        const winner = Object.keys(state.players).find((id) => id !== playerId)!;
        return { winner, loser: playerId };
      }

      // Check deck out
      if (playerState.deck.length === 0 && playerState.hand.length === 0) {
        const winner = Object.keys(state.players).find((id) => id !== playerId)!;
        return { winner, loser: playerId };
      }
    }

    return null;
  }

  /**
   * Update player statistics
   */
  private async updateStatistics(winnerId: string, loserId: string): Promise<void> {
    // Update winner stats
    const winnerProfile = await this.env.USER_DATA.get(`profile:${winnerId}`);
    if (winnerProfile) {
      const profile = JSON.parse(winnerProfile);
      profile.statistics.wins++;
      profile.statistics.winStreak++;
      profile.statistics.gamesPlayed++;
      await this.env.USER_DATA.put(`profile:${winnerId}`, JSON.stringify(profile));
    }

    // Update loser stats
    const loserProfile = await this.env.USER_DATA.get(`profile:${loserId}`);
    if (loserProfile) {
      const profile = JSON.parse(loserProfile);
      profile.statistics.losses++;
      profile.statistics.winStreak = 0;
      profile.statistics.gamesPlayed++;
      await this.env.USER_DATA.put(`profile:${loserId}`, JSON.stringify(profile));
    }
  }

  /**
   * Save game state
   */
  private async saveState(state: GameState): Promise<void> {
    await this.env.GAME_STATE.put(state.id, JSON.stringify(state));
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
