import { GameBoard } from '@components/game/GameBoard';
import { GameControls } from '@components/game/GameControls';
import { GameEffects } from '@components/game/GameEffects';
import { GameHand } from '@components/game/GameHand';
import { GameResources } from '@components/game/GameResources';
import type { Card, Layer } from '@shared/types/cards';
import type { GameEffect, GamePhase } from '@shared/types/game';
import styles from './GameLayout.module.css';

interface PlayerState {
  id: string;
  health: number;
  hand: Card[];
  field: (Card | null)[];
  resources: {
    material: number;
    mind: number;
    void: number;
  };
  activeLayer: Layer;
  activeEffects?: GameEffect[];
}

interface GameLayoutProps {
  currentPhase: GamePhase;
  onPhaseChange: (phase: GamePhase) => void;
  playerState: PlayerState;
  opponentState: PlayerState;
  onCardSelect: (cardId: string) => void;
  onSlotSelect: (slotId: number) => void;
  onAbilityActivate: (cardId: string, abilityIndex: number, targets: string[]) => void;
  onLayerChange: (layer: Layer) => void;
  onEndTurn: () => void;
  onSurrender: () => void;
  selectedCard: string | null;
  isMyTurn: boolean;
  turn: number;
  targetingMode: {
    type: 'ability' | 'attack';
    sourceId: string;
  } | null;
}

export function GameLayout({
  currentPhase,
  onPhaseChange,
  playerState,
  opponentState,
  onCardSelect,
  onSlotSelect,
  onAbilityActivate,
  onLayerChange,
  onEndTurn,
  onSurrender,
  selectedCard,
  isMyTurn,
  turn,
  targetingMode,
}: GameLayoutProps) {
  // Calculate which cards are playable based on resources
  const playableCards = new Set(
    playerState.hand
      .filter((card) => {
        const hasResources = Object.keys(card.cost).every(
          (resource) =>
            playerState.resources[resource as keyof typeof playerState.resources] >=
            card.cost[resource as keyof typeof card.cost],
        );
        return hasResources && isMyTurn && currentPhase === 'main';
      })
      .map((card) => card.id),
  );

  return (
    <div className={styles.container}>
      {/* Left Sidebar */}
      <div className={styles.sidebar}>
        <GameResources
          resources={playerState.resources}
          layer={playerState.activeLayer}
          onLayerChange={onLayerChange}
        />

        <GameHand
          cards={playerState.hand}
          playableCards={playableCards}
          onCardPlay={onCardSelect}
          onCardHover={() => {}} // Add hover handler if needed
        />

        <div className={styles.playerInfo}>
          <div className={styles.playerStats}>
            <div className={styles.avatar} />
            <span className={styles.health}>{playerState.health} HP</span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className={styles.mainArea}>
        <GameControls
          currentPhase={currentPhase}
          currentTurn={turn}
          isPlayerTurn={isMyTurn}
          onPhaseChange={onPhaseChange}
          onEndTurn={onEndTurn}
          onAction={() => {}} // Add specific action handler if needed
          canEndTurn={isMyTurn && currentPhase === 'end'}
          onSurrender={onSurrender}
        />

        <GameBoard
          currentPlayer={playerState.id}
          opponentPlayer={opponentState.id}
          playerField={playerState.field}
          opponentField={opponentState.field}
          selectedCard={selectedCard}
          onCardPlay={(_cardId, position) => onSlotSelect(position)}
          onAbilityActivate={onAbilityActivate}
          isMyTurn={isMyTurn}
          targetingMode={targetingMode}
          currentPhase={currentPhase}
        />
      </div>

      {/* Right Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.cardCount}>{playerState.hand.length} cards in hand</div>

        <GameEffects
          playerEffects={playerState.activeEffects || []}
          opponentEffects={opponentState.activeEffects || []}
        />

        <div className={styles.actionLog}>
          <div className={styles.logTitle}>LAST ACTIONS</div>
          <div className={styles.logEntries}>
            {/* Add action log entries when implemented */}
            <div className={styles.logEntry}>• Enemy played Dark Ritual</div>
            <div className={styles.logEntry}>• Void effect triggered</div>
            <div className={styles.logEntry}>• You lost 2 health</div>
          </div>
        </div>
      </div>
    </div>
  );
}
