import { gameAPI } from '@client/utils/api-client';
import type {
  Card,
  PhaseType,
  Layer,
  ResourceGeneration,
  ResourceManager,
  ResourceRequirement,
  ResourceState,
} from '@shared/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

const INITIAL_RESOURCES: ResourceState = {
  material: 0,
  mind: 0,
};

const BASE_GENERATION: ResourceState = {
  material: 1,
  mind: 1,
};

export function useGameResources(
  gameId: string,
  playerId: string,
  phase: PhaseType,
  isMyTurn: boolean,
): ResourceManager {
  // Track current resources
  const [resources, setResources] = useState<ResourceState>(INITIAL_RESOURCES);
  const [pendingCosts, setPendingCosts] = useState<ResourceState>(INITIAL_RESOURCES);

  // Calculate available resources accounting for pending costs
  const currentResources = useMemo<ResourceState>(
    () => ({
      material: Math.max(0, (resources.material || 0) - (pendingCosts.material || 0)),
      mind: Math.max(0, (resources.mind || 0) - (pendingCosts.mind || 0)),
    }),
    [resources, pendingCosts],
  );

  // Calculate resource generation per turn
  const generation = useMemo<ResourceGeneration>(
    () => ({
      current: currentResources,
      basePerTurn: BASE_GENERATION,
      bonuses: INITIAL_RESOURCES,
    }),
    [currentResources],
  );

  // Reset pending costs at the start of each turn
  useEffect(() => {
    if (isMyTurn && phase === 'draw') {
      setPendingCosts(INITIAL_RESOURCES);
    }
  }, [isMyTurn, phase]);

  // Check if a card can be played with current resources
  const canPlayCard = useCallback(
    (card: Card): boolean => {
      return Object.entries(card.cost).every(([resource, cost]) => {
        const available = currentResources[resource as Layer] || 0;
        return available >= cost;
      });
    },
    [currentResources],
  );

  // Get resource requirements for a card
  const getResourceRequirement = useCallback((card: Card): ResourceRequirement => {
    return {
      material: card.cost.material || 0,
      mind: card.cost.mind || 0,
    };
  }, []);

  // Spend resources
  const spendResources = useCallback(
    async (costs: Partial<ResourceState>) => {
      if (!gameId || !playerId) return;

      // Create a complete resource state from partial costs
      const fullCosts: ResourceState = {
        material: costs.material || 0,
        mind: costs.mind || 0,
      };

      try {
        await gameAPI.spendResources(gameId, fullCosts);
        setPendingCosts((prev) => ({
          material: (prev.material || 0) + (fullCosts.material || 0),
          mind: (prev.mind || 0) + (fullCosts.mind || 0),
        }));
      } catch (error) {
        console.error('Failed to spend resources:', error);
        throw error;
      }
    },
    [gameId, playerId],
  );

  // Add resources (e.g., from effects or start of turn)
  const addResources = useCallback((gained: Partial<ResourceState>) => {
    setResources((prev) => ({
      material: (prev.material || 0) + (gained.material || 0),
      mind: (prev.mind || 0) + (gained.mind || 0),
    }));
  }, []);

  // Update resources from game state
  useEffect(() => {
    const updateResources = async () => {
      if (!gameId || !playerId) return;

      try {
        const gameState = await gameAPI.getState(gameId);
        const playerResources = gameState.players[playerId]?.resources;
        if (playerResources) {
          setResources(playerResources);
        }
      } catch (error) {
        console.error('Failed to update resources:', error);
      }
    };

    updateResources();
  }, [gameId, playerId, phase]);

  // Calculate potential resource usage
  const calculateResourceUsage = useCallback((cards: Card[]): ResourceState => {
    return cards.reduce<ResourceState>(
      (total, card) => ({
        material: (total.material || 0) + (card.cost.material || 0),
        mind: (total.mind || 0) + (card.cost.mind || 0),
      }),
      { ...INITIAL_RESOURCES },
    );
  }, []);

  return {
    currentResources,
    generation,
    canPlayCard,
    getResourceRequirement,
    spendResources,
    addResources,
    calculateResourceUsage,
    pendingCosts,
  };
}

// Resource utility functions
export const resourceUtils = {
  canAfford(resources: ResourceState, costs: Partial<ResourceState>): boolean {
    return Object.entries(costs).every(([resource, cost]) => {
      const available = resources[resource as Layer] || 0;
      return available >= (cost || 0);
    });
  },

  addResources(base: ResourceState, added: Partial<ResourceState>): ResourceState {
    return {
      material: (base.material || 0) + (added.material || 0),
      mind: (base.mind || 0) + (added.mind || 0),
    };
  },

  subtractResources(base: ResourceState, subtracted: Partial<ResourceState>): ResourceState {
    return {
      material: Math.max(0, (base.material || 0) - (subtracted.material || 0)),
      mind: Math.max(0, (base.mind || 0) - (subtracted.mind || 0)),
    };
  },
};
