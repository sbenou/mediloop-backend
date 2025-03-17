
import React, { useEffect, useRef } from 'react';

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({ canvasRef }) => {
  const initialized = useRef(false);

  // Force white background on mount
  useEffect(() => {
    if (!initialized.current && canvasRef.current) {
      // Set initial white background using direct DOM manipulation
      const canvasElement = canvasRef.current.querySelector('canvas');
      if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        
        // Ensure canvas is properly positioned for cursor visibility
        if (canvasElement.style) {
          canvasElement.style.position = 'relative';
          canvasElement.style.zIndex = '100'; // Significantly increased z-index for better visibility
        }
      }
      initialized.current = true;
    }
  }, [canvasRef]);

  return (
    <div 
      ref={canvasRef}
      className="border rounded-md overflow-hidden w-full" 
      style={{ 
        height: '200px',
        backgroundColor: '#ffffff', // Explicit white background
        position: 'relative', // For proper canvas positioning
        cursor: 'inherit', // Inherit cursor from children
      }}
      data-testid="canvas-container"
    >
      {/* Add an explicit white background layer with lower z-index */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#ffffff',
          zIndex: 1 // Keep this below the canvas
        }}
      />
    </div>
  );
};

export default CanvasContainer;
