
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
          border: '1px solid #e2e8f0',
          borderRadius: '0.375rem',
          overflow: 'hidden'
        }}
      />
    );
  }
);

CanvasContainer.displayName = 'CanvasContainer';

export default CanvasContainer;
