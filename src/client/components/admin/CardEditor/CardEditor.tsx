import type {
  Card,
  CardType,
  EffectCard,
  NewCard,
  RitualCard,
  UnitCard,
} from '@shared/types/cards';
import { useState } from 'react';
import { CardArtworkUploader } from './CardArtworkUploader';
import styles from './CardEditor.module.css';
import { CardEditorBasicInfo } from './CardEditorBasicInfo';
import { CardEditorCardPreview } from './CardEditorCardPreview';
import { CardEditorCardStats } from './CardEditorCardStats';
import { CardEditorEffectEditor } from './CardEditorEffectEditor';

interface CardEditorProps {
  initialCard?: NewCard;
  onSave: (card: Card | NewCard, artwork?: File) => Promise<void>;
}

export function CardEditor({ initialCard, onSave }: CardEditorProps) {
  const defaultCard: Card = {
    name: '',
    type: 'unit',
    layer: 'material',
    cost: { material: 0, mind: 0, void: 0 },
    rarity: 'common',
    attack: 0,
    defense: 0,
    abilities: [],
  };

  const [card, setCard] = useState<Card | NewCard>(initialCard || defaultCard);
  const [activeTab, setActiveTab] = useState<'basic' | 'stats' | 'effects'>('basic');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<File | undefined>();

  const handleTypeChange = (type: CardType) => {
    if (type === card.type) return;

    let newCard: Card;
    const baseProperties = {
      name: card.name,
      layer: card.layer,
      cost: { ...card.cost },
      rarity: card.rarity,
      flavorText: card.flavorText,
    };

    switch (type) {
      case 'unit':
        newCard = {
          ...baseProperties,
          type: 'unit',
          attack: 0,
          defense: 0,
          abilities: [],
        } as UnitCard;
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
        } as EffectCard;
        break;

      case 'ritual':
        newCard = {
          ...baseProperties,
          type: 'ritual',
          duration: 3,
          effects: [],
          layerRequirements: {},
        } as RitualCard;
        break;

      default:
        throw new Error('Invalid card type');
    }

    setCard(newCard);
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
            <CardEditorBasicInfo card={card} onChange={setCard} onTypeChange={handleTypeChange} />
            <CardArtworkUploader artwork={card.artworkUrl} onChange={setArtwork} />
          </>
        )}

        {activeTab === 'stats' && <CardEditorCardStats card={card} onChange={setCard} />}

        {activeTab === 'effects' && <CardEditorEffectEditor card={card} onChange={setCard} />}

        <button className={styles.saveButton} onClick={handleSave}>
          Save Card
        </button>
      </div>
    </div>
  );
}
