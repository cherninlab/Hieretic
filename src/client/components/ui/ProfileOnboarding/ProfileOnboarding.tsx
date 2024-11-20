import { CardPreview } from '@components/game/CardPreview';
import { allTestCards, createFormatedTestDeck } from '@shared/testing/test-cards';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Button';
import { Input } from '../Input';
import styles from './ProfileOnboarding.module.css';

type OnboardingStep = 'identity' | 'deck';
type DeckType = 'balanced' | 'material' | 'mind';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
}

function IdentityStep({ onNext, onSkip }: StepProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = async () => {
    if (username.trim()) {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
    }
    onNext();
  };

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Identity</h2>
      <Input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        maxLength={20}
      />
      <div className={styles.actions}>
        <Button onClick={handleSubmit}>Continue</Button>
        <Button className={styles.skipButton} onClick={onSkip}>
          Skip
        </Button>
      </div>
    </div>
  );
}

function DeckStep({ onNext }: StepProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<DeckType>('balanced');
  const [error, setError] = useState<string | null>(null);

  const previewCards = {
    balanced: allTestCards.slice(0, 3),
  };

  const handleCreateDeck = async () => {
    try {
      setIsCreating(true);
      setError(null);
      const testDeck = createFormatedTestDeck();

      // Make sure we're sending exactly what the API expects
      const response = await fetch('/api/deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${selectedDeck.charAt(0).toUpperCase() + selectedDeck.slice(1)} Grimoire`,
          format: 'standard' as const,
          cards: testDeck.cards, // This should be an array of card IDs
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create deck');
      }

      if (data.success) {
        await fetch('/api/profile/deck', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckId: data.data.id }),
        });
        onNext();
      }
    } catch (error) {
      console.error('Error creating deck:', error);
      setError(error instanceof Error ? error.message : 'Failed to create deck');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Choose Your Path</h2>
      <div className={styles.deckChoices}>
        <div
          className={`${styles.deckOption} ${selectedDeck === 'balanced' ? styles.selected : ''}`}
          onClick={() => setSelectedDeck('balanced')}
        >
          <h3>Balance</h3>
          <div className={styles.deckPreview}>
            {previewCards.balanced.map((card) => (
              <CardPreview key={card.id} card={card} size="small" />
            ))}
          </div>
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <Button onClick={handleCreateDeck} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Accept'}
      </Button>
    </div>
  );
}

export function ProfileOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('identity');

  const handleComplete = () => {
    navigate('/profile');
  };

  const steps: Record<OnboardingStep, React.ReactNode> = {
    identity: <IdentityStep onNext={() => setStep('deck')} onSkip={() => setStep('deck')} />,
    deck: <DeckStep onNext={handleComplete} />,
  };

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        {['identity', 'deck'].map((s) => (
          <div key={s} className={`${styles.progressDot} ${step === s ? styles.active : ''}`} />
        ))}
      </div>
      <div className={styles.content}>{steps[step]}</div>
    </div>
  );
}
