import { gameAPI } from '@client/utils/api-client';
import type { Card, GameState, Layer, PlayerState, ResourceState, UnitCard } from '@shared/types';
import { useCallback, useMemo } from 'react';

interface LayerState {
  currentLayer: Layer;
  resourcesAvailable: ResourceState;
  cardsInLayer: {
    player: (Card | null)[];
    opponent: (Card | null)[];
  };
  playableCards: Set<string>;
}

interface LayerActions {
  changeLayer: (layer: Layer) => Promise<void>;
  isCardPlayableInLayer: (card: Card) => boolean;
  getValidTargetsInLayer: (sourceCard: Card) => string[];
  canInteractAcrossLayers: (sourceCard: Card, targetCard: Card) => boolean;
}

export function useGameLayer(
  gameState: GameState | null,
  currentPlayerId: string | null,
  isMyTurn: boolean,
): LayerState & LayerActions {
  // Get current layer from game state
  const currentLayer = useMemo((): Layer => {
    if (!gameState || !currentPlayerId) return 'material';
    return gameState.players[currentPlayerId]?.activeLayer || 'material';
  }, [gameState, currentPlayerId]);

  // Get current resources
  const resourcesAvailable = useMemo(() => {
    if (!gameState || !currentPlayerId) {
      return { material: 0, mind: 0 };
    }
    return gameState.players[currentPlayerId].resources;
  }, [gameState, currentPlayerId]);

  // Get cards in current layer
  const cardsInLayer = useMemo(() => {
    if (!gameState || !currentPlayerId) {
      return { player: [], opponent: [] };
    }

    const playerState = gameState.players[currentPlayerId];
    const opponentState = Object.values(gameState.players).find(
      (p): p is PlayerState => p.id !== currentPlayerId,
    );

    return {
      player: filterCardsByLayer(playerState?.field || [], currentLayer),
      opponent: filterCardsByLayer(opponentState?.field || [], currentLayer),
    };
  }, [gameState, currentPlayerId, currentLayer]);

  // Determine playable cards based on current layer and resources
  const playableCards = useMemo(() => {
    if (!gameState || !currentPlayerId || !isMyTurn) {
      return new Set<string>();
    }

    const playerState = gameState.players[currentPlayerId];
    if (!playerState) return new Set<string>();

    return new Set(
      playerState.hand
        .filter((card) => isCardPlayableInCurrentState(card, playerState, currentLayer))
        .map((card) => card.id),
    );
  }, [gameState, currentPlayerId, isMyTurn, currentLayer]);

  // Change active layer
  const changeLayer = useCallback(
    async (layer: Layer) => {
      if (!gameState?.id || !isMyTurn) return;

      try {
        await gameAPI.changeLayer(gameState.id, layer);
      } catch (error) {
        console.error('Failed to change layer:', error);
        throw error;
      }
    },
    [gameState?.id, isMyTurn],
  );

  // Check if a card can be played in current layer
  const isCardPlayableInLayer = useCallback(
    (card: Card): boolean => {
      if (!isMyTurn || !gameState || !currentPlayerId) return false;

      const playerState = gameState.players[currentPlayerId];
      if (!playerState) return false;

      return isCardPlayableInCurrentState(card, playerState, currentLayer);
    },
    [gameState, currentPlayerId, isMyTurn, currentLayer],
  );

  // Get valid targets for a card in current layer
  const getValidTargetsInLayer = useCallback(
    (sourceCard: Card): string[] => {
      if (!gameState || !currentPlayerId) return [];

      const playerState = gameState.players[currentPlayerId];
      const opponentState = Object.values(gameState.players).find((p) => p.id !== currentPlayerId);

      if (!playerState || !opponentState) return [];

      return getValidTargets(sourceCard, playerState, opponentState, currentLayer);
    },
    [gameState, currentPlayerId, currentLayer],
  );

  // Check if cards can interact across layers
  const canInteractAcrossLayers = useCallback((sourceCard: Card, targetCard: Card): boolean => {
    if (!('abbilities' in sourceCard)) {
      return sourceCard.layer === targetCard.layer;
    }

    const sourceUnitCard = sourceCard as UnitCard;

    const hasCrossLayerAbility = sourceUnitCard.abilities?.some(
      (ability) => ability.canTargetOtherLayer,
    );

    if (!hasCrossLayerAbility) {
      return sourceUnitCard.layer === targetCard.layer;
    }

    return true;
  }, []);

  return {
    currentLayer,
    resourcesAvailable,
    cardsInLayer,
    playableCards,
    changeLayer,
    isCardPlayableInLayer,
    getValidTargetsInLayer,
    canInteractAcrossLayers,
  };
}

// Helper functions
function filterCardsByLayer(field: (Card | null)[], layer: Layer): (Card | null)[] {
  return field.map((card) => (card && card.layer === layer ? card : null));
}

function isCardPlayableInCurrentState(
  card: Card,
  playerState: PlayerState,
  currentLayer: Layer,
): boolean {
  // Check if card matches current layer
  if (card.layer !== currentLayer) return false;

  // Check if player has enough resources
  return (
    playerState.resources.material >= card.cost.material &&
    playerState.resources.mind >= card.cost.mind
  );
}

function getValidTargets(
  sourceCard: Card,
  playerState: PlayerState,
  opponentState: PlayerState,
  currentLayer: Layer,
): string[] {
  const validTargets: string[] = [];

  if (!('abbilities' in sourceCard)) {
    return validTargets;
  }

  const sourceUnitCard = sourceCard as UnitCard;

  const abilities = sourceUnitCard.abilities || [];

  if ('effect' in sourceCard) {
    abilities.push(sourceCard.effect);
  }

  // For each card on the field
  playerState.field.forEach((card) => {
    if (card && isValidTarget(card, sourceCard, abilities, currentLayer)) {
      validTargets.push(card.id);
    }
  });

  opponentState.field.forEach((card) => {
    if (card && isValidTarget(card, sourceCard, abilities, currentLayer)) {
      validTargets.push(card.id);
    }
  });

  return validTargets;
}

function isValidTarget(
  targetCard: Card,
  sourceCard: Card,
  abilities: Array<{ target: string; canTargetOtherLayer?: boolean }>,
  currentLayer: Layer,
): boolean {
  return abilities.some((ability) => {
    // Check layer restrictions
    if (!ability.canTargetOtherLayer && targetCard.layer !== currentLayer) {
      return false;
    }

    // Check targeting restrictions
    switch (ability.target) {
      case 'enemy':
        return targetCard.layer !== sourceCard.layer;
      case 'ally':
        return targetCard.layer === sourceCard.layer;
      case 'all':
        return true;
      default:
        return false;
    }
  });
}
