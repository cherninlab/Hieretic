import type { Layer } from '@shared/types/cards';
import styles from './GameResources.module.css';

interface GameResourcesProps {
  resources: {
    material: number;
    mind: number;
    // void: number;
  };
  layer: Layer;
  onLayerChange: (layer: Layer) => void;
}

export function GameResources({ resources, layer, onLayerChange }: GameResourcesProps) {
  return (
    <div className={styles.container}>
      {/* Layer Selection */}
      <div className={styles.layerSelector}>
        <button
          className={`${styles.layerButton} ${layer === 'material' ? styles.active : ''}`}
          onClick={() => onLayerChange('material')}
        >
          <div className={styles.resourceIcon}>●</div>
          <span>Material</span>
          <div className={styles.resourceCount}>{resources.material}</div>
        </button>

        <button
          className={`${styles.layerButton} ${layer === 'mind' ? styles.active : ''}`}
          onClick={() => onLayerChange('mind')}
        >
          <div className={styles.resourceIcon}>○</div>
          <span>Mind</span>
          <div className={styles.resourceCount}>{resources.mind}</div>
        </button>

        {/* <button
          className={`${styles.layerButton} ${layer === 'void' ? styles.active : ''}`}
          onClick={() => onLayerChange('void')}
        >
          <div className={styles.resourceIcon}>◊</div>
          <span>Void</span>
          <div className={styles.resourceCount}>{resources.void}</div>
        </button> */}
      </div>

      {/* Resource Details */}
      <div className={styles.resourceDetails}>
        <div className={styles.resourceInfo}>
          <div className={styles.resourceLabel}>Generation</div>
          <div className={styles.resourceValue}>
            +{layer === 'material' ? 1 : 0}● +{layer === 'mind' ? 1 : 0}○
          </div>
        </div>

        <div className={styles.resourceInfo}>
          <div className={styles.resourceLabel}>Available</div>
          <div className={styles.resourceValue}>
            {resources.material}● {resources.mind}○
          </div>
        </div>
      </div>
    </div>
  );
}
