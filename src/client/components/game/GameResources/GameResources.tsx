import type { Layer, ResourceState } from '@shared/types';
import styles from './GameResources.module.css';

interface GameResourcesProps {
  resources: ResourceState;
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
