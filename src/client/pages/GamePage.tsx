import { GameLayout } from '@components/game/GameLayout';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './GamePage.module.css';

interface GameState {
  status: 'waiting' | 'active' | 'finished';
  players: string[];
  currentPlayer: string;
  turn: number;
  phase: 'main' | 'combat' | 'end';
}

export default function GamePage() {
  const navigate = useNavigate();
  const { gameCode } = useParams<{ gameCode: string }>();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch(`/api/get-game-state?gameCode=${gameCode}`);
        if (!response.ok) {
          throw new Error('Failed to fetch game state');
        }
        const data = await response.json();
        setGameState(data);
      } catch (err) {
        setError('Failed to connect to game server');
        console.error('Error fetching game state:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();
    // Set up polling for game state updates
    const interval = setInterval(fetchGameState, 2000);
    return () => clearInterval(interval);
  }, [gameCode]);

  const handleCardSelect = async (cardId: number) => {
    try {
      const response = await fetch('/api/play-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameCode,
          cardId,
        }),
      });

      const data = await response.json();
      console.log('Card played:', data);
      // Handle response
    } catch (err) {
      console.error('Error playing card:', err);
    }
  };

  const handleSlotSelect = async (slotId: number) => {
    try {
      const response = await fetch('/api/select-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameCode,
          slotId,
        }),
      });

      const data = await response.json();
      console.log('Card played:', data);
      // Handle response
    } catch (err) {
      console.error('Error selecting slot:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>Entering the ethereal plane...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span className={styles.errorText}>{error}</span>
        <button onClick={() => navigate('/lobby')} className={styles.returnButton}>
          Return to Lobby
        </button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className={styles.error}>
        <span className={styles.errorText}>Game not found</span>
        <button onClick={() => navigate('/')} className={styles.returnButton}>
          Return to Main Menu
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameLayout onCardSelect={handleCardSelect} onSlotSelect={handleSlotSelect} />
    </div>
  );
}
