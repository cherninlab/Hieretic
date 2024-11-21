import { Card } from '@shared/types/cards';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import styles from './GameHand.module.css';

export interface HandCardProps {
  card: Card;
  isPlayable: boolean;
  onHover: (card: Card | null) => void;
}

export function HandCard({ card, isPlayable, onHover }: HandCardProps) {
  return (
    <motion.div
      className={clsx(styles.card, isPlayable ? styles.playable : styles.unplayable)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => onHover(card)}
      onHoverEnd={() => onHover(null)}
    >
      <div className={styles.cardContent}>
        <h3>{card.name}</h3>
        <div className={styles.cardCost}>
          {card.cost.material > 0 && <span>{card.cost.material}●</span>}
          {card.cost.mind > 0 && <span>{card.cost.mind}○</span>}
          {card.cost.void > 0 && <span>{card.cost.void}◊</span>}
        </div>
      </div>
    </motion.div>
  );
}
