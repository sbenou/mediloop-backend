
import React, { forwardRef } from 'react';
import './CanvasContainer.css';

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

const CanvasContainer = forwardRef<HTMLDivElement, CanvasContainerProps>(
  ({ canvasRef }, ref) => {
    return (
      <div 
        ref={canvasRef} 
        className="canvas-container"
        style={{
          width: '100%',
          height: '300px',
          backgroundColor: '#ffffff',
          position: 'relative',
          border: '2px dashed red', // Temporary debug border
          borderRadius: '0.375rem',
          overflow: 'hidden',
          zIndex: 1
        }}
      />
    );
  }
);

CanvasContainer.displayName = 'CanvasContainer';

export default CanvasContainer;
