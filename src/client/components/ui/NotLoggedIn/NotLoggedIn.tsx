import { useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import styles from './NotLoggedIn.module.css';

export function NotLoggedIn() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.heroContent}>
        <div className={styles.title} />
        <div>
          <p className={styles.subtitle}>Knowledge has a price</p>
          <div className={styles.actions}>
            <Button onClick={() => navigate('/sign-in')}>
              Enter the Void
            </Button>
            <Button onClick={() => navigate('/sign-up')}>
              Begin the Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
