import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Button';
import { DustEffect } from '../DustEffect';
import { Input } from '../Input';
import { Section } from '../Section';
import styles from './MainMenu.module.css';

export function MainMenu() {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [status, setStatus] = useState('');

  const handleJoinGame = useCallback(async () => {
    if (!gameCode.trim()) return;

    try {
      setStatus('Opening portal...');
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameCode: gameCode.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        navigate(`/lobby/${gameCode.trim()}`);
      } else {
        setStatus(data.error?.message || 'Failed to join game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to join game');
    }
  }, [gameCode, navigate]);

  const handleCreateGame = useCallback(async () => {
    try {
      setStatus('Creating ritual space...');
      const response = await fetch('/api/game/create', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        navigate(`/lobby/${data.data.gameCode}`);
      } else {
        setStatus(data.error?.message || 'Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to create game');
    }
  }, [navigate]);

  const handleQuickMatch = useCallback(async () => {
    if (isMatchmaking) return;

    setIsMatchmaking(true);
    setStatus('Seeking worthy opponents...');

    try {
      const response = await fetch('/api/matchmake', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.gameCode) {
        navigate(`/lobby/${data.gameCode}`);
      } else {
        setStatus(data.message || 'No match found');
        setIsMatchmaking(false);
      }
    } catch (error) {
      console.error('Error in matchmaking:', error);
      setStatus('Failed to find a match');
      setIsMatchmaking(false);
    }
  }, [isMatchmaking, navigate]);

  return (
    <div className={styles.container}>
      <DustEffect />
      <div className={styles.content}>
        <div className={styles.menu}>
          <Section noBorder>
            <header className={styles.header}>
              <div className={styles.title} />
              <Button onClick={() => navigate('/profile')} secondary short>
                Profile
              </Button>
            </header>
          </Section>

          <Section>
            <Button onClick={handleCreateGame} important>
              Create New Game
            </Button>
          </Section>

          <Section title="Join Game">
            <Input
              type="text"
              placeholder="ENTER THE CODE"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
            />
            <Button onClick={handleJoinGame} disabled={!gameCode.trim()}>
              Join
            </Button>
          </Section>

          <Section>
            <Button onClick={handleQuickMatch} disabled={isMatchmaking} loading={isMatchmaking}>
              {isMatchmaking ? 'Seeking...' : 'Quick Match'}
            </Button>
          </Section>

          {status && <div className={styles.statusMessage}>{status}</div>}
        </div>
      </div>
    </div>
  );
}
