import { gameAPI } from '@client/utils/api-client';
import type {
  BoardActions,
  BoardState,
  Card,
  CardWithAbilities,
  Effect,
  GameState,
  Layer,
  PlayerState,
  TargetingMode,
} from '@shared/types';
import { useCallback, useMemo, useState } from 'react';

export function useGameBoard(
  gameState: GameState | null,
  currentPlayerId: string | null,
  currentLayer: Layer,
  isMyTurn: boolean,
): BoardState & BoardActions {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [targetingMode, setTargetingMode] = useState<TargetingMode | null>(null);

  // Get current fields
  const { playerField, opponentField } = useMemo(() => {
    if (!gameState || !currentPlayerId) {
      return { playerField: [], opponentField: [] };
    }

    const playerState = gameState.players[currentPlayerId];
    const opponentState = Object.values(gameState.players).find(
      (p): p is PlayerState => p.id !== currentPlayerId,
    );

    return {
      playerField: playerState?.field || [],
      opponentField: opponentState?.field || [],
    };
  }, [gameState, currentPlayerId]);

  // Calculate valid play positions
  const validPlayPositions = useMemo(() => {
    if (!isMyTurn || !selectedCard || targetingMode) return [];

    return playerField.map((card, index) => (!card ? index : -1)).filter((index) => index !== -1);
  }, [isMyTurn, selectedCard, targetingMode, playerField]);

  // Calculate highlighted positions based on current state
  const highlightedPositions = useMemo(() => {
    if (targetingMode) {
      return targetingMode.validTargets;
    }
    return validPlayPositions;
  }, [targetingMode, validPlayPositions]);

  // Handle card selection
  const selectCard = useCallback(
    (cardId: string | null) => {
      if (!isMyTurn) return;
      setSelectedCard(cardId);
      setTargetingMode(null);
    },
    [isMyTurn],
  );

  // Calculate valid targets for an ability
  const getValidAbilityTargets = useCallback(
    (sourceCard: CardWithAbilities, ability: Effect): number[] => {
      const validTargets: number[] = [];

      const checkField = (field: (Card | null)[], isOpponent: boolean) => {
        field.forEach((targetCard, index) => {
          if (!targetCard) return;

          // Check layer restrictions
          if (targetCard.layer !== currentLayer && !ability.canTargetOtherLayer) {
            return;
          }

          // Check targeting restrictions
          switch (ability.target) {
            case 'enemy':
              if (isOpponent) validTargets.push(index);
              break;
            case 'ally':
              if (!isOpponent) validTargets.push(index);
              break;
            case 'self':
              if (!isOpponent && sourceCard.id === targetCard.id) {
                validTargets.push(index);
              }
              break;
            case 'all':
              validTargets.push(index);
              break;
          }
        });
      };

      checkField(playerField, false);
      checkField(opponentField, true);

      return validTargets;
    },
    [playerField, opponentField, currentLayer],
  );

  // Handle card playing
  const playCard = useCallback(
    async (position: number) => {
      if (!gameState?.id || !selectedCard || !isMyTurn) return;

      try {
        await gameAPI.playCard(gameState.id, selectedCard, position);
        setSelectedCard(null);
        setTargetingMode(null);
      } catch (error) {
        console.error('Failed to play card:', error);
        throw error;
      }
    },
    [gameState?.id, selectedCard, isMyTurn],
  );

  // Initiate attack targeting
  const initiateAttack = useCallback(
    (attackerId: string) => {
      if (!isMyTurn || gameState?.phase !== 'combat') return;

      const attackingCard = playerField.find((card) => card?.id === attackerId);
      if (!attackingCard) return;

      const validTargets = opponentField
        .map((card, index) => (card && card.layer === currentLayer ? index : -1))
        .filter((index) => index !== -1);

      setTargetingMode({
        type: 'attack',
        sourceId: attackerId,
        validTargets,
      });
    },
    [isMyTurn, gameState?.phase, playerField, opponentField, currentLayer],
  );

  // Initiate ability targeting
  const initiateAbility = useCallback(
    (cardId: string, abilityIndex: number) => {
      if (!isMyTurn) return;

      const sourceCard = playerField.find((card) => card?.id === cardId) as CardWithAbilities;
      if (!sourceCard?.abilities?.[abilityIndex]) return;

      const ability = sourceCard.abilities[abilityIndex];
      const validTargets = getValidAbilityTargets(sourceCard, ability);

      setTargetingMode({
        type: 'ability',
        sourceId: cardId,
        validTargets,
        abilityIndex,
      });
    },
    [isMyTurn, playerField, getValidAbilityTargets],
  );

  // Handle field slot click
  const handleFieldSlotClick = useCallback(
    async (position: number, isOpponent: boolean) => {
      if (!gameState?.id || !isMyTurn) return;

      try {
        if (targetingMode) {
          switch (targetingMode.type) {
            case 'attack':
              if (isOpponent && targetingMode.validTargets.includes(position)) {
                const targetCard = opponentField[position];
                if (targetCard) {
                  await gameAPI.declareAttack(gameState.id, targetingMode.sourceId, targetCard.id);
                }
              }
              break;

            case 'ability':
              if (targetingMode.validTargets.includes(position)) {
                const targetCard = isOpponent ? opponentField[position] : playerField[position];
                if (targetCard && targetingMode.abilityIndex !== undefined) {
                  await gameAPI.activateAbility(
                    gameState.id,
                    targetingMode.sourceId,
                    targetingMode.abilityIndex,
                    [targetCard.id],
                  );
                }
              }
              break;

            case 'play':
              if (!isOpponent && validPlayPositions.includes(position)) {
                await playCard(position);
              }
              break;
          }
          setTargetingMode(null);
        } else if (selectedCard && !isOpponent) {
          await playCard(position);
        }
      } catch (error) {
        console.error('Failed to handle field slot click:', error);
        throw error;
      }
    },
    [
      gameState?.id,
      isMyTurn,
      targetingMode,
      selectedCard,
      validPlayPositions,
      opponentField,
      playerField,
      playCard,
    ],
  );

  // Cancel targeting
  const cancelTargeting = useCallback(() => {
    setTargetingMode(null);
    setSelectedCard(null);
  }, []);

  return {
    selectedCard,
    targetingMode,
    validPlayPositions,
    highlightedPositions,
    playerField,
    opponentField,
    selectCard,
    playCard,
    initiateAttack,
    initiateAbility,
    handleFieldSlotClick,
    cancelTargeting,
  };
}
