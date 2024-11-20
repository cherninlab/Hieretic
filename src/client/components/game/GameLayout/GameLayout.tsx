import { useState } from 'react';
import styles from './GameLayout.module.css';

interface GameLayoutProps {
  onCardSelect?: (cardId: number) => void;
  onSlotSelect?: (slotId: number) => void;
}

export function GameLayout({ onCardSelect, onSlotSelect }: GameLayoutProps) {
  const [_, setSelectedCard] = useState<number | null>(null);
  const [__, setSelectedSlot] = useState<number | null>(null);

  const handleCardSelect = (cardId: number) => {
    setSelectedCard(cardId);
    onCardSelect?.(cardId);
  };

  const handleSlotSelect = (slotId: number) => {
    setSelectedSlot(slotId);
    onSlotSelect?.(slotId);
  };

  return (
    <div className={styles.outerContainer}>
      <div className={styles.container}>
        {/* Left Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.resourcesSection}>
            <div className={styles.resourceBox}>
              <span>5 ●</span>
            </div>
            <div className={styles.resourceBox}>
              <span>3 ○</span>
            </div>
          </div>

          <div className={styles.handArea}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} onClick={() => handleCardSelect(i)} className={styles.card}>
                <div className={styles.slotContent}>{`Card ${i}`}</div>
              </div>
            ))}
          </div>

          <div className={styles.playerInfo}>
            <div className={styles.avatar} />
            <span>25 HP</span>
          </div>
        </div>

        {/* Main Area */}
        <div className={styles.mainArea}>
          <div className={styles.header}>
            <span>Enemy • 25 HP</span>
            <span>Turn 3</span>
          </div>

          <div className={styles.layers}>
            {['Material', 'Void', 'Deep'].map((layer) => (
              <button key={layer} className={styles.button}>
                {layer}
              </button>
            ))}
            <button className={styles.button}>Pass</button>
          </div>

          <div className={styles.battlefieldContainer}>
            {/* Opponent Area */}
            <div className={styles.playArea}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.slot} onClick={() => handleSlotSelect(i)}>
                  <div className={styles.slotContent}>{`Slot ${i}`}</div>
                </div>
              ))}
            </div>

            <div className={styles.phaseIndicator}>Combat Phase</div>

            {/* Player Area */}
            <div className={styles.playArea}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.slot} onClick={() => handleSlotSelect(i + 4)}>
                  <div className={styles.slotContent}>{`Slot ${i}`}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.cardCount}>5 cards</div>

          <div className={styles.effectsArea}>
            <div>ACTIVE EFFECTS</div>
            {[1, 2].map((i) => (
              <div key={i} className={styles.effectBox} />
            ))}
          </div>

          <div className={styles.actionLog}>
            <div className={styles.logTitle}>LAST ACTIONS</div>
            <div className={styles.logEntry}>• Enemy played Dark Ritual</div>
            <div className={styles.logEntry}>• Void effect triggered</div>
            <div className={styles.logEntry}>• You lost 2 health</div>
          </div>
        </div>
      </div>
    </div>
  );
}
