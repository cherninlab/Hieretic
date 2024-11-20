import type { Layer } from '@shared/types';
import styles from './GameBoard.module.css';

export interface LayerSelectorProps {
  currentLayer: Layer;
  onLayerSelect: (layer: Layer) => void;
  disabled?: boolean;
}

export function LayerSelector({ currentLayer, onLayerSelect }: LayerSelectorProps) {
  return (
    <>
      <button
        onClick={() => onLayerSelect('material')}
        className={currentLayer === 'material' ? styles.active : ''}
      >
        Material ●
      </button>
      <button
        onClick={() => onLayerSelect('mind')}
        className={currentLayer === 'mind' ? styles.active : ''}
      >
        Mind ○
      </button>
    </>
  );
}
