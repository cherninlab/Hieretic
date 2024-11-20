import { Button, ReturnToMainButton } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import type { UserProfile } from '@shared/types';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useProfile } from '../hooks/useProfile';
import styles from './LobbyPage.module.css';

interface PlayerSlotProps {
  profile?: UserProfile;
  isReady?: boolean;
  isHost?: boolean;
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({ profile, isReady, isHost }) => {
  return (
    <div
      className={clsx(styles.playerSlot, {
        [styles.filled]: profile,
        [styles.empty]: !profile,
        [styles.ready]: isReady,
      })}
    >
      {profile ? (
        <div className={styles.playerInfo}>
          <span className={styles.playerName}>{profile.username}</span>
          {isHost && <span className={styles.hostBadge}>Host</span>}
          <span className={styles.playerStatus}>{isReady ? 'Ready' : 'Not Ready'}</span>
        </div>
      ) : (
        <span className={styles.emptySlot}>Awaiting player...</span>
      )}
    </div>
  );
};

export default function LobbyPage() {
  const navigate = useNavigate();
  const { gameCode } = useParams<{ gameCode: string }>();
  const [copied, setCopied] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Get current user's profile
  const { profile } = useProfile();

  // Get and subscribe to game state
  const { gameState, error, isLoading, startGame: startGameAction, leaveGame } = useGame(gameCode);

  // Keep track of ready states
  const [readyStates, setReadyStates] = useState<Record<string, boolean>>({});

  // Handle navigation to game when it starts
  useEffect(() => {
    if (gameState?.status === 'active' && gameCode) {
      navigate(`/game/${gameCode}`);
    }
  }, [gameState?.status, gameCode, navigate]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setErrorMessage(error.message);
      setShowErrorModal(true);
    }
  }, [error]);

  // Copy game code to clipboard
  const copyGameCode = useCallback(async () => {
    if (!gameCode) return;

    try {
      await navigator.clipboard.writeText(gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setErrorMessage('Failed to copy game code');
      setShowErrorModal(true);
    }
  }, [gameCode]);

  // Toggle ready state
  const toggleReady = useCallback(() => {
    if (!profile?.id || !gameState) return;

    setReadyStates((prev) => ({
      ...prev,
      [profile.id]: !prev[profile.id],
    }));
  }, [profile, gameState]);

  // Start game handler
  const handleStartGame = useCallback(async () => {
    if (!gameCode || !gameState) return;

    try {
      await startGameAction(gameCode);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start game');
      setShowErrorModal(true);
    }
  }, [gameCode, gameState, startGameAction]);

  // Leave game handler
  const handleLeaveGame = useCallback(async () => {
    try {
      if (gameCode) {
        await leaveGame(gameCode);
      }
      navigate('/');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to leave game');
      setShowErrorModal(true);
    }
  }, [gameCode, leaveGame, navigate]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (gameCode && profile?.id) {
        leaveGame(gameCode).catch(console.error);
      }
    };
  }, [gameCode, profile, leaveGame]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <h2>Opening the portal...</h2>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  if (!gameState || error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <h2>Failed to Join Game</h2>
          <p>{error?.message || 'Game not found'}</p>
          <ReturnToMainButton />
        </div>
      </div>
    );
  }

  const isHost = profile?.id === gameState.createdBy;
  const canStartGame =
    isHost &&
    Object.keys(gameState.playerProfiles).length === 2 &&
    Object.values(readyStates).every((ready) => ready);

  return (
    <div className={styles.container}>
      <div className={styles.leftSide}>
        <div className={styles.info}>
          <h1 className={styles.title}>Game Lobby</h1>
          <div className={styles.codeBox}>
            <h2 className={styles.codeLabel}>Invite Code</h2>
            <div className={styles.codeDisplay}>
              <span className={styles.code}>{gameCode}</span>
              <Button onClick={copyGameCode} className={styles.copyButton} title="Copy game code">
                {copied ? (
                  <svg
                    className={styles.icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg
                    className={styles.icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightSide}>
        <div className={styles.playersBox}>
          <h2 className={styles.playersTitle}>{isHost ? 'Waiting for Players' : 'Players'}</h2>

          <div className={styles.playersList}>
            {/* Show players */}
            {Object.entries(gameState.playerProfiles).map(([playerId, profile]) => (
              <PlayerSlot
                key={playerId}
                profile={profile}
                isReady={readyStates[playerId]}
                isHost={playerId === gameState.createdBy}
              />
            ))}

            {/* Show empty slots */}
            {Array.from({
              length: Math.max(0, 2 - Object.keys(gameState.playerProfiles).length),
            }).map((_, index) => (
              <PlayerSlot key={`empty-${index}`} />
            ))}
          </div>

          <div className={styles.controls}>
            {!isHost && (
              <Button
                onClick={toggleReady}
                className={clsx(styles.readyButton, {
                  [styles.ready]: readyStates[profile?.id || ''],
                })}
              >
                {readyStates[profile?.id || ''] ? 'Ready!' : 'Ready Up'}
              </Button>
            )}

            {isHost && (
              <Button
                onClick={handleStartGame}
                disabled={!canStartGame}
                className={styles.startButton}
              >
                {Object.keys(gameState.playerProfiles).length < 2
                  ? 'Waiting for Players...'
                  : !canStartGame
                    ? 'Waiting for Ready...'
                    : 'Begin the Ritual'}
              </Button>
            )}

            <Button onClick={handleLeaveGame} className={styles.leaveButton}>
              Leave Game
            </Button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <Modal title="Error" onClose={() => setShowErrorModal(false)}>
          <div className={styles.modalContent}>
            <p>{errorMessage}</p>
            <Button onClick={() => setShowErrorModal(false)} className={styles.modalButton}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
