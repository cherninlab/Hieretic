import type { CardDefinition, CardType } from '@shared/types/cards';
import { useState } from 'react';
import { CardArtworkUploader } from './CardArtworkUploader';
import styles from './CardEditor.module.css';
import { CardEditorBasicInfo } from './CardEditorBasicInfo';
import { CardEditorCardPreview } from './CardEditorCardPreview';
import { CardEditorCardStats } from './CardEditorCardStats';
import { CardEditorEffectEditor } from './CardEditorEffectEditor';

interface CardEditorProps {
  initialCard?: Partial<CardDefinition>;
  onSave: (card: CardDefinition, artwork?: File) => Promise<void>;
}

const defaultCard: CardDefinition = {
  id: `temp-${Date.now()}`, // Temporary ID for new cards
  name: '',
  type: 'unit',
  layer: 'material',
  cost: { material: 0, mind: 0, void: 0 },
  rarity: 'common',
  set: 'core',
  releaseDate: Date.now(),
  attack: 0,
  defense: 0,
  abilities: [],
  flavorText: '',
  effects: [],
  layerRequirements: {},
  artworkUrl: '',
};

export function CardEditor({ initialCard, onSave }: CardEditorProps) {
  const [card, setCard] = useState<CardDefinition>({
    ...defaultCard,
    ...initialCard,
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'stats' | 'effects'>('basic');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<File | undefined>();

  const handleTypeChange = (type: CardType) => {
    if (type === card.type) return;

    // Keep common properties when changing type
    const baseProperties = {
      id: card.id,
      name: card.name,
      layer: card.layer,
      cost: { ...card.cost },
      rarity: card.rarity,
      flavorText: card.flavorText,
      set: card.set,
      releaseDate: card.releaseDate,
      artworkUrl: card.artworkUrl,
    };

    let newCard: CardDefinition;

    switch (type) {
      case 'unit':
        newCard = {
          ...baseProperties,
          type: 'unit',
          attack: 0,
          defense: 0,
          abilities: [],
        };
        break;

      case 'effect':
        newCard = {
          ...baseProperties,
          type: 'effect',
          effect: {
            id: `effect-${Date.now()}`,
            type: 'damage',
            target: 'unit',
            value: 0,
          },
        };
        break;

      case 'ritual':
        newCard = {
          ...baseProperties,
          type: 'ritual',
          duration: 3,
          effects: [],
          layerRequirements: {},
        };
        break;

      default:
        throw new Error('Invalid card type');
    }

    setCard(newCard);
  };

  const handleCardUpdate = (updates: Partial<CardDefinition>) => {
    setCard((currentCard) => ({
      ...currentCard,
      ...updates,
    }));
  };

  const validateCard = (): boolean => {
    if (!card.name.trim()) {
      setErrorMessage('Card name is required');
      return false;
    }

    // Add layer-specific validation
    switch (card.type) {
      case 'unit':
        if (card.attack === undefined || card.defense === undefined) {
          setErrorMessage('Unit cards require attack and defense values');
          return false;
        }
        break;
      case 'ritual':
        if (!card.duration) {
          setErrorMessage('Ritual cards require duration');
          return false;
        }
        break;
      case 'effect':
        if (!card.effect) {
          setErrorMessage('Effect cards require an effect definition');
          return false;
        }
        break;
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
      <CardEditorCardPreview card={card} />

      <div className={styles.form}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'basic' ? styles.active : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'effects' ? styles.active : ''}`}
            onClick={() => setActiveTab('effects')}
          >
            Effects
          </button>
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

        {activeTab === 'effects' && (
          <CardEditorEffectEditor card={card} onChange={handleCardUpdate} />
        )}

        <button className={styles.saveButton} onClick={handleSave}>
          Save Card
        </button>
      </div>
    </div>
  );
}
