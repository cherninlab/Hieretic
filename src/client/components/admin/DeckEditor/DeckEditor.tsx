import { useState } from 'react';
import styles from './DeckEditor.module.css';

export function DeckEditor() {
  const [decks, _] = useState([]);

  // Add deck loading logic
  if (decks.length === 0) {
    // Add deck loading state
  }

  return (
    <div className={styles.container}>
      {/* Add deck editor UI */}
      <h2>Deck Editor Coming Soon</h2>
    </div>
  );
}
