// src/client/pages/LobbyPage.tsx
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './LobbyPage.module.css';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { gameCode } = useParams<{ gameCode: string }>();
  const [players, setPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch(`/api/get-game-state?gameCode=${gameCode}`);
        const data = await response.json();

        if (Array.isArray(data.players)) {
          setPlayers(data.players);
        } else {
          console.error('Unexpected data format:', data);
          setPlayers([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching game state:', error);
        setLoading(false);
      }
    };

    fetchGameState();
    const interval = setInterval(fetchGameState, 5000);
    return () => clearInterval(interval);
  }, [gameCode]);

  const copyGameCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const startGame = async () => {
    try {
      const response = await fetch('/api/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameCode }),
      });

      const data = await response.json();
      if (data.success) {
        navigate(`/game/${gameCode}`);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>Connecting to the ethereal plane...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftSide}>
        <div className={styles.info}>
          <h1 className={styles.title}>Game Lobby</h1>
          <div className={styles.codeBox}>
            <h2 className={styles.codeLabel}>Invite Code</h2>
            <div className={styles.codeDisplay}>
              <span className={styles.code}>{gameCode}</span>
              <button onClick={copyGameCode} className={styles.copyButton}>
                {copied ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightSide}>
        <div className={styles.playersBox}>
          <h2 className={styles.playersTitle}>Gathering Players</h2>
          <div className={styles.playersList}>
            {players.map((player, index) => (
              <div key={index} className={clsx(styles.playerSlot, styles.filled)}>
                {player}
              </div>
            ))}
            {Array.from({ length: 2 - players.length }).map((_, index) => (
              <div key={`empty-${index}`} className={clsx(styles.playerSlot, styles.empty)}>
                Awaiting player...
              </div>
            ))}
          </div>

          <button onClick={startGame} disabled={players.length < 2} className={styles.startButton}>
            {players.length < 2 ? 'Waiting for Players...' : 'Begin the Ritual'}
          </button>
        </div>
      </div>
    </div>
  );
}
