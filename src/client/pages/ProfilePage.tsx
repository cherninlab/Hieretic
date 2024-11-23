import { createTestDeck } from '@shared/testing/test-cards';
import type { Card } from '@shared/types';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../store/profileStore';
import styles from './ProfilePage.module.css';

type Tab = 'profile' | 'decks' | 'settings';

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, isLoading, error, updateProfile } = useProfileStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [testDeck, setTestDeck] = useState<Card[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Memoized debounced update function
  const debouncedUpdate = useCallback(
    debounce((updates: Partial<typeof profile>) => {
      updateProfile(updates ?? {});
    }, 500),
    [], // Empty dependency array since we don't want to recreate this function
  );

  useEffect(() => {
    const deck = createTestDeck();
    setTestDeck(deck);
  }, []);

  const handleProfileUpdate = (updates: Partial<typeof profile>) => {
    debouncedUpdate(updates);
  };

  if (isLoading) return <div className={styles.loading}>Loading profile...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!profile) return <div className={styles.error}>Profile not found</div>;

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
          <div className={styles.avatar}>{profile.username?.[0]?.toUpperCase() || '?'}</div>
          <h2 className={styles.username}>{profile.username}</h2>
          <div className={styles.stats}>
            Games: {profile.statistics.gamesPlayed} | Wins: {profile.statistics.wins}
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={clsx(styles.navButton, activeTab === 'profile' && styles.active)}
            onClick={() => {
              setActiveTab('profile');
              setIsMobileMenuOpen(false);
            }}
          >
            Profile
          </button>
          <button
            className={clsx(styles.navButton, activeTab === 'decks' && styles.active)}
            onClick={() => {
              setActiveTab('decks');
              setIsMobileMenuOpen(false);
            }}
          >
            Deck Management
          </button>
          <button
            className={clsx(styles.navButton, activeTab === 'settings' && styles.active)}
            onClick={() => {
              setActiveTab('settings');
              setIsMobileMenuOpen(false);
            }}
          >
            Settings
          </button>
        </nav>

        <div className={styles.controls}>
          <button
            className={clsx(styles.controlButton, styles.backButton)}
            onClick={() => navigate('/')}
          >
            Return to Main
          </button>
        </div>
      </aside>

      <main className={styles.content}>
        {activeTab === 'profile' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile Settings</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                type="text"
                className={styles.input}
                defaultValue={profile.username}
                onChange={(e) => handleProfileUpdate({ username: e.target.value })}
              />
            </div>
          </section>
        )}

        {activeTab === 'decks' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Test Deck</h2>
            <div className={styles.deckGrid}>
              {testDeck.map((card) => (
                <div key={card.id} className={styles.deckCard}>
                  <h3 className={styles.cardName}>{card.name}</h3>
                  <div className={styles.cardType}>
                    {card.type} - {card.layer}
                  </div>
                  <div className={styles.cardCost}>
                    Cost: {card.cost.material}● {card.cost.mind}○
                  </div>
                </div>
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
                defaultValue={profile.preferences.theme}
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
                defaultValue={profile.preferences.cardBack}
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
    </div>
  );
}
