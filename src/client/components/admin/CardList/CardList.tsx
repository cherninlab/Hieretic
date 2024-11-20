import { CardPreview } from '@components/game/CardPreview/CardPreview';
import { Button } from '@components/ui/Button';
import type { Card } from '@shared/types';
import { useEffect, useState } from 'react';
import styles from './CardList.module.css';

interface CardListProps {
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
}

export function CardList({ onEditCard, onDeleteCard }: CardListProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchCards();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading cards...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.cardList}>
      <h2 className={styles.sectionTitle}>Card List</h2>
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.id} className={styles.cardItem}>
            <div className={styles.cardPreviewWrapper}>
              <CardPreview card={card} size="small" />
            </div>
            <div className={styles.cardActions}>
              <Button onClick={() => onEditCard(card)}>Edit</Button>
              <Button onClick={() => onDeleteCard(card.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
