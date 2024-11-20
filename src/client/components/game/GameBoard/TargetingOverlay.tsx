import React from 'react';

interface TargetingOverlayProps {
  targets: Array<{ x: number; y: number }>; // Coordinates of possible targets
  onClick: (x: number, y: number) => void; // Callback when a target is clicked
}

export const TargetingOverlay: React.FC<TargetingOverlayProps> = ({ targets, onClick }) => {
  return (
    <div className="targeting-overlay">
      {targets.map((target, index) => (
        <div
          key={index}
          className="target"
          style={{ left: `${target.x * 50}px`, top: `${target.y * 50}px` }} // Assuming each cell is 50x50px
          onClick={() => onClick(target.x, target.y)}
        />
      ))}
    </div>
  );
};
