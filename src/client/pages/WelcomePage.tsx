// src/client/pages/WelcomePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './WelcomePage.module.css';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleCreateGame = async () => {
    try {
      setStatusMessage('Creating game...');
      const response = await fetch('/api/create-game', { method: 'POST' });
      const data = await response.json();
      navigate(`/lobby/${data.gameCode}`);
    } catch (error) {
      console.error('Error creating game:', error);
      setStatusMessage('Failed to create game');
    }
  };

  const handleJoinGame = async () => {
    if (!gameCode.trim()) return;

    try {
      setStatusMessage('Joining game...');
      const response = await fetch('/api/join-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameCode: gameCode.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        navigate(`/lobby/${gameCode.trim()}`);
      } else {
        setStatusMessage('Game not found or full');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setStatusMessage('Failed to join game');
    }
  };

  const startMatchmaking = async () => {
    if (isMatchmaking) return;

    setIsMatchmaking(true);
    setStatusMessage('Searching for worthy opponents...');

    try {
      const response = await fetch('/api/matchmake', { method: 'POST' });
      const data = await response.json();

      if (data.gameCode) {
        navigate(`/lobby/${data.gameCode}`);
      } else {
        setStatusMessage(data.message || 'Searching...');
      }
    } catch (error) {
      console.error('Error in matchmaking:', error);
      setStatusMessage('Failed to find a match');
      setIsMatchmaking(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSide}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>HIERETIC</h1>
          <p className={styles.subtitle}>SCIƎNŦIA ØCCVLŦA PREŦIVM</p>
        </div>
      </div>

      <div className={styles.rightSide}>
        <div className={styles.menuContainer}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Join Existing Game</h2>
            <input
              type="text"
              placeholder="Enter game code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              className={styles.input}
            />
            <button onClick={handleJoinGame} disabled={!gameCode.trim()} className={styles.button}>
              Join Game
            </button>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Create New Game</h2>
            <button onClick={handleCreateGame} className={styles.button}>
              Create Game
            </button>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick Match</h2>
            <button onClick={startMatchmaking} disabled={isMatchmaking} className={styles.button}>
              {isMatchmaking ? 'Finding Match...' : 'Find Match'}
            </button>
            {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
