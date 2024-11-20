import type { Deck, UserProfile } from '@shared/types/user';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import styles from './ProfilePage.module.css';

type Tab = 'profile' | 'decks' | 'settings';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (isSaving) {
    console.log('saving...');
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        setProfile(data);

        // Fetch decks if profile loads successfully
        const decksResponse = await fetch('/api/decks');
        const decksData = await decksResponse.json();
        setDecks(decksData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const saveProfile = async (updates: Partial<UserProfile>) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const setActiveDeck = async (deckId: string) => {
    if (!profile) return;

    try {
      await saveProfile({ ...profile, activeDeckId: deckId });
    } catch (error) {
      console.error('Error setting active deck:', error);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  if (!profile) {
    return <div className={styles.error}>Error loading profile</div>;
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{profile.username[0].toUpperCase()}</div>
          <h2 className={styles.username}>{profile.username}</h2>
          <div className={styles.stats}>
            Games: {profile.statistics.gamesPlayed} | Wins: {profile.statistics.wins}
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={clsx(styles.navButton, activeTab === 'profile' && styles.active)}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={clsx(styles.navButton, activeTab === 'decks' && styles.active)}
            onClick={() => setActiveTab('decks')}
          >
            Deck Management
          </button>
          <button
            className={clsx(styles.navButton, activeTab === 'settings' && styles.active)}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
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
                value={profile.username}
                onChange={(e) => saveProfile({ ...profile, username: e.target.value })}
              />
            </div>
            {/* Add more profile fields as needed */}
          </section>
        )}

        {activeTab === 'decks' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Decks</h2>
            <div className={styles.deckGrid}>
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className={clsx(
                    styles.deckCard,
                    deck.id === profile.activeDeckId && styles.active,
                  )}
                  onClick={() => setActiveDeck(deck.id)}
                >
                  <h3 className={styles.deckName}>{deck.name}</h3>
                  <div className={styles.deckMeta}>
                    {deck.cards.length} cards | {deck.format}
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
                value={profile.preferences.theme}
                onChange={(e) =>
                  saveProfile({
                    ...profile,
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
                  saveProfile({
                    ...profile,
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
