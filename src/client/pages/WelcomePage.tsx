import { Button } from '@components/ui/Button';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useProfile } from '../hooks/useProfile';
import styles from './WelcomePage.module.css';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [_statusMessage, setStatusMessage] = useState('');

  // Custom hooks
  const { profile } = useProfile();
  const { createGame, joinGame, error: gameError, isLoading } = useGame();

  console.log('profile:', profile);

  // Reset status message when error changes
  useEffect(() => {
    if (gameError) {
      setStatusMessage(gameError.message);
    }
  }, [gameError]);

  // Clean up matchmaking on unmount
  useEffect(() => {
    return () => {
      if (isMatchmaking) {
        // TODO: Implement matchmaking cleanup
        setIsMatchmaking(false);
      }
    };
  }, [isMatchmaking]);

  const handleJoinGame = async () => {
    if (!profile || !gameCode.trim()) return;

    try {
      setStatusMessage('Joining game...');
      await joinGame(gameCode.trim());
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to join game');
    }
  };

  const handleCreateGame = async () => {
    if (!profile) return;

    try {
      setStatusMessage('Creating game...');
      await createGame();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to create game');
    }
  };

  const startMatchmaking = async () => {
    if (!profile || isMatchmaking) return;

    setIsMatchmaking(true);
    setStatusMessage('Searching for worthy opponents...');

    try {
      // Using the API client directly for matchmaking as it's a special case
      const response = await fetch('/api/matchmake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Profile-ID': profile.id,
        },
      });

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
          <Button onClick={() => navigate('/profile')} className={styles.profileButton}>
            {profile ? profile.username : 'Create Profile'}
          </Button>
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
              disabled={isLoading}
            />
            <Button
              onClick={handleJoinGame}
              disabled={isLoading || !profile || !gameCode.trim()}
              className={styles.button}
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </Button>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Create New Game</h2>
            <Button
              onClick={handleCreateGame}
              disabled={isLoading || !profile}
              className={styles.button}
            >
              {isLoading ? 'Creating...' : 'Create Game'}
            </Button>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick Match</h2>
            <Button
              onClick={startMatchmaking}
              disabled={isLoading || !profile || isMatchmaking}
              className={styles.button}
            >
              {isMatchmaking ? 'Finding Match...' : 'Find Match'}
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
