import styles from './DustEffect.module.css';
import { useParticles } from './useParticles';

export const DustEffect = () => {
  const canvasRef = useParticles();

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
};
