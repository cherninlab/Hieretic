import React from 'react';

interface LayerIndicatorProps {
  type: string; // Type of layer, e.g., 'friendly', 'enemy', 'obstacle'
  position: { x: number; y: number }; // Position on the board
}

export const LayerIndicator: React.FC<LayerIndicatorProps> = ({ type, position }) => {
  const indicatorClass = `layer-indicator ${type}`;

  return (
    <div
      className={indicatorClass}
      style={{ left: `${position.x * 50}px`, top: `${position.y * 50}px` }} // Assuming each cell is 50x50px
    />
  );
};
