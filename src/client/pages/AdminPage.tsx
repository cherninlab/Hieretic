import { CardEditor } from '@components/admin/CardEditor';
import { CardList } from '@components/admin/CardList';
import { DeckEditor } from '@components/admin/DeckEditor';
import { Stats } from '@components/admin/Stats';
import { Button } from '@components/ui/Button';
import type { CardDefinition } from '@shared/types';
import { useEffect, useState } from 'react';
import superjson from 'superjson';
import styles from './AdminPage.module.css';
type Tab = 'new-card' | 'card-list' | 'decks' | 'stats';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('new-card');
  const [_cards, setCards] = useState<CardDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<CardDefinition | null>(null);

  useEffect(() => {
    // Reset loading state when activeTab changes
    setLoading(true);
    setError(null);

    const fetchCards = async () => {
      try {
        const response = await fetch('/api/admin/cards');
        const data = await response.json();
        if (data.success) {
          setCards(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to load cards');
        }
      } catch (err) {
        setError('Failed to connect to server');
        console.error('Error fetching cards:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'card-list') {
      fetchCards();
    } else {
      setLoading(false); // No need to load cards for other tabs
    }
  }, [activeTab]);

  const handleSaveCard = async (card: Partial<CardDefinition>, artwork?: File) => {
    try {
      const formData = new FormData();
      formData.append('cardData', superjson.stringify(card));
      if (artwork) {
        formData.append('artwork', artwork);
      }

      const response = await fetch('/api/admin/cards', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save card');
      }

      // Refresh card list
      const updatedResponse = await fetch('/api/admin/cards');
      const data = await updatedResponse.json();
      if (data.success) {
        setCards(data.data || []);
      }
    } catch (error) {
      console.error('Error saving card:', error);
      setError(error instanceof Error ? error.message : 'Failed to save card');
    }
  };

  const handleEditCard = (card: CardDefinition) => {
    setActiveTab('new-card');
    setEditingCard(card);
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetch('/api/admin/cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({ cardId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      // Refresh card list
      const updatedResponse = await fetch('/api/admin/cards');
      const data = await updatedResponse.json();
      if (data.success) {
        setCards(data.data || []);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete card');
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <span>Loading admin panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h1 className={styles.title}>Admin</h1>
        <nav className={styles.nav}>
          <Button
            className={`${styles.navButton} ${activeTab === 'new-card' ? styles.active : ''}`}
            onClick={() => setActiveTab('new-card')}
          >
            New Card
          </Button>
          <Button
            className={`${styles.navButton} ${activeTab === 'card-list' ? styles.active : ''}`}
            onClick={() => setActiveTab('card-list')}
          >
            Card List
          </Button>
          <Button
            className={`${styles.navButton} ${activeTab === 'decks' ? styles.active : ''}`}
            onClick={() => setActiveTab('decks')}
          >
            Decks
          </Button>
          <Button
            className={`${styles.navButton} ${activeTab === 'stats' ? styles.active : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </Button>
        </nav>
      </aside>

      <main className={styles.main}>
        {activeTab === 'new-card' && (
          <CardEditor onSave={handleSaveCard} initialCard={editingCard ?? {}} />
        )}
        {activeTab === 'card-list' && (
          <CardList onEditCard={handleEditCard} onDeleteCard={handleDeleteCard} />
        )}
        {activeTab === 'decks' && <DeckEditor />}
        {activeTab === 'stats' && <Stats />}
      </main>
    </div>
  );
}
