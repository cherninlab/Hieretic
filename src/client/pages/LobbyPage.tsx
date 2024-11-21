import type { UserProfile } from '@shared/types/user';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useProfile } from '../hooks/useProfile';
import styles from './LobbyPage.module.css';

interface LobbyPlayerState {
  id: string;
  connected: boolean;
  ready: boolean;
}

interface GameLobbyState {
  status: 'waiting' | 'active' | 'finished';
  createdBy: string;
  players: Record<string, LobbyPlayerState>;
  playerProfiles: Record<string, UserProfile>;
}
interface PlayerSlotProps {
  player?: UserProfile;
  empty?: boolean;
}

function PlayerSlot({ player, empty = false }: PlayerSlotProps) {
  return (
    <div className={clsx(styles.playerSlot, empty ? styles.empty : styles.filled)}>
      {player ? player.username : 'Awaiting player...'}
    </div>
  );
}

export default function LobbyPage() {
  const navigate = useNavigate();
  const { gameCode } = useParams<{ gameCode: string }>();
  const [copied, setCopied] = useState(false);

  // Get current user's profile
  const { profile } = useProfile();

  // Get and subscribe to game state
  const { gameState, error, isLoading, startGame } = useGame(gameCode || '');

  // Handle navigation to game when it starts
  useEffect(() => {
    if (gameState?.status === 'active' && gameCode) {
      navigate(`/game/${gameCode}`);
    }
  }, [gameState?.status, gameCode, navigate]);

  // Copy game code to clipboard
  const copyGameCode = useCallback(async () => {
    if (!gameCode) return;

    try {
      await navigator.clipboard.writeText(gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [gameCode]);

  // Handle game start
  const handleStartGame = useCallback(async () => {
    if (!gameCode) return;

    try {
      setStatusMessage('Starting game...');
      await startGame(gameCode);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to start game');
    }
  }, [gameCode, startGame]);

  // Status message for user feedback
  const [statusMessage, setStatusMessage] = useState('');

  // Reset status message when error changes
  useEffect(() => {
    if (error) {
      setStatusMessage(error.message);
    }
  }, [error]);

  // Clean up matchmaking on unmount
  useEffect(() => {
    return () => {
      // TODO: Implement matchmaking cleanup if needed
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>Connecting to the ethereal plane...</span>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className={styles.error}>
        <div className={styles.errorText}>
          {error instanceof Error ? error.message : 'Game not found'}
        </div>
        <button onClick={() => navigate('/')} className={styles.returnButton}>
          Return to Main Menu
        </button>
      </div>
    );
  }

  // Extract game state
  const lobbyState = gameState as unknown as GameLobbyState;
  const isCreator = profile?.id === lobbyState.createdBy;
  const playerProfilesIds = Object.keys(lobbyState.playerProfiles || {});
  const playerProfiles = lobbyState.playerProfiles || {};

  // Debugging logs
  console.log('gameState:', gameState);
  console.log('playerProfiles:', playerProfiles);

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
            {/* Show all joined players */}
            {playerProfilesIds.map((playerId) => (
              <PlayerSlot key={playerId} player={playerProfiles[playerId]} />
            ))}

            {/* Show empty slots */}
            {Array.from({ length: Math.max(0, 2 - playerProfilesIds.length) }).map((_, index) => (
              <PlayerSlot key={`empty-${index}`} empty />
            ))}
          </div>

          <button
            onClick={handleStartGame}
            disabled={!isCreator || playerProfilesIds.length < 2}
            className={styles.startButton}
          >
            {!isCreator
              ? 'Waiting for host...'
              : playerProfilesIds.length < 2
                ? 'Waiting for Players...'
                : 'Begin the Ritual'}
          </button>
          {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
        </div>
      </div>
    </div>
  );
}
