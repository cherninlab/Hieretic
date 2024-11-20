import { CardPreview } from '@components/game/CardPreview/CardPreview';
import { Button } from '@components/ui/Button';
import type { Card, CardType, UnitCard } from '@shared/types';
import { useState } from 'react';
import { CardArtworkUploader } from './CardArtworkUploader';
import styles from './CardEditor.module.css';
import { CardEditorBasicInfo } from './CardEditorBasicInfo';
import { CardEditorCardStats } from './CardEditorCardStats';

interface CardEditorProps {
  initialCard?: Partial<Card>;
  onSave: (card: Card, artwork?: File) => Promise<void>;
}

const defaultCard: UnitCard = {
  id: `temp-${Date.now()}`,
  name: '',
  type: 'unit',
  layer: 'material',
  cost: { material: 0, mind: 0 },
  rarity: 'common',
  set: 'core',
  releaseDate: Date.now(),
  attack: 0,
  defense: 0,
  abilities: [],
  artworkUrl: '',
};

export function CardEditor({ initialCard, onSave }: CardEditorProps) {
  const [card, setCard] = useState<UnitCard>({
    ...defaultCard,
    ...(initialCard as Partial<UnitCard>), // We only support unit cards for now
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'stats'>('basic');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<File | undefined>();

  const handleTypeChange = (_type: CardType) => {
    // Currently we only support unit type, so no need to change
    return;
  };

  const handleCardUpdate = (updates: Partial<Card>) => {
    setCard((currentCard) => ({
      ...currentCard,
      ...(updates as Partial<UnitCard>),
    }));
  };

  const validateCard = (): boolean => {
    if (!card.name.trim()) {
      setErrorMessage('Card name is required');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateCard()) return;

    try {
      await onSave(card, artwork);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save card');
    }
  };

  return (
    <div className={styles.editor}>
      <div className={styles.previewSection}>
        <CardPreview card={card} size="large" />
      </div>

      <div className={styles.form}>
        <div className={styles.tabs}>
          <Button
            className={`${styles.tab} ${activeTab === 'basic' ? styles.active : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </Button>
          <Button
            className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </Button>
        </div>

        {errorMessage && <div className={styles.error}>{errorMessage}</div>}

        {activeTab === 'basic' && (
          <>
            <CardEditorBasicInfo
              card={card}
              onChange={handleCardUpdate}
              onTypeChange={handleTypeChange}
            />
            <CardArtworkUploader artwork={card.artworkUrl} onChange={setArtwork} />
          </>
        )}

        {activeTab === 'stats' && <CardEditorCardStats card={card} onChange={handleCardUpdate} />}

        <Button className={styles.saveButton} onClick={handleSave}>
          Save Card
        </Button>
      </div>
    </div>
  );
}
