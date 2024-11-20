import { CardPreview } from '@components/game/CardPreview/CardPreview';
import { Button, ReturnToMainButton } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { createTestDeck } from '@shared/testing/test-cards';
import type { Card } from '@shared/types';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import styles from './ProfilePage.module.css';

type Tab = 'profile' | 'decks' | 'settings';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [testDeck, setTestDeck] = useState<Card[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const { profile, isLoading, error, updateProfile } = useProfile();

  // Initialize test deck
  useEffect(() => {
    const deck = createTestDeck();
    setTestDeck(deck);
  }, []);

  // Memoized update function
  const handleProfileUpdate = useCallback(
    async (updates: Partial<NonNullable<typeof profile>>) => {
      try {
        setModalError(null);
        await updateProfile(updates);
        setShowEditModal(false);
      } catch (err) {
        setModalError(err instanceof Error ? err.message : 'Failed to update profile');
      }
    },
    [updateProfile],
  );

  if (isLoading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        {error.message}
        <ReturnToMainButton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.error}>
        Profile not found
        <ReturnToMainButton />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mobileHeader}>
        <button
          className={styles.menuToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
        </button>
        <h1 className={styles.mobileTitle}>{profile.username}</h1>
      </div>

      <aside className={clsx(styles.sidebar, isMobileMenuOpen && styles.sidebarOpen)}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{profile.username[0]?.toUpperCase() || '?'}</div>
          <h2 className={styles.username}>{profile.username}</h2>
          <Button onClick={() => setShowEditModal(true)} className={styles.editButton}>
            Edit Profile
          </Button>
        </div>

        <nav className={styles.nav}>
          <Button
            className={clsx(styles.navButton, activeTab === 'profile' && styles.active)}
            onClick={() => {
              setActiveTab('profile');
              setIsMobileMenuOpen(false);
            }}
          >
            Profile Overview
          </Button>
          <Button
            className={clsx(styles.navButton, activeTab === 'decks' && styles.active)}
            onClick={() => {
              setActiveTab('decks');
              setIsMobileMenuOpen(false);
            }}
          >
            Deck Management
          </Button>
          <Button
            className={clsx(styles.navButton, activeTab === 'settings' && styles.active)}
            onClick={() => {
              setActiveTab('settings');
              setIsMobileMenuOpen(false);
            }}
          >
            Settings
          </Button>
        </nav>

        <div className={styles.controls}>
          <ReturnToMainButton />
        </div>
      </aside>

      <main className={styles.content}>
        {activeTab === 'profile' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile Statistics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Games Played</div>
                <div className={styles.statValue}>{profile.statistics.gamesPlayed}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Wins</div>
                <div className={styles.statValue}>{profile.statistics.wins}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Win Rate</div>
                <div className={styles.statValue}>
                  {profile.statistics.gamesPlayed
                    ? `${((profile.statistics.wins / profile.statistics.gamesPlayed) * 100).toFixed(
                        1,
                      )}%`
                    : '0%'}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Win Streak</div>
                <div className={styles.statValue}>{profile.statistics.winStreak}</div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'decks' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Decks</h2>
            <div className={styles.deckGrid}>
              {testDeck.map((card) => (
                <CardPreview card={card} size="small" />
              ))}
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Game Settings</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>Theme</label>
              <select
                className={styles.input}
                value={profile.preferences.theme}
                onChange={(e) =>
                  handleProfileUpdate({
                    preferences: { ...profile.preferences, theme: e.target.value as any },
                  })
                }
              >
                <option value="default">Default</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Card Back</label>
              <select
                className={styles.input}
                value={profile.preferences.cardBack}
                onChange={(e) =>
                  handleProfileUpdate({
                    preferences: { ...profile.preferences, cardBack: e.target.value },
                  })
                }
              >
                <option value="default">Default</option>
                <option value="ancient">Ancient</option>
                <option value="void">Void</option>
              </select>
            </div>
          </section>
        )}
      </main>

      {showEditModal && (
        <Modal title="Edit Profile" onClose={() => setShowEditModal(false)} size="small">
          <div className={styles.modalContent}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                type="text"
                className={styles.input}
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder={profile.username}
                maxLength={20}
              />
            </div>
            {modalError && <div className={styles.error}>{modalError}</div>}
            <div className={styles.modalButtons}>
              <Button
                onClick={() => handleProfileUpdate({ username: editUsername })}
                className={styles.saveButton}
              >
                Save Changes
              </Button>
              <Button onClick={() => setShowEditModal(false)} className={styles.cancelButton}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
