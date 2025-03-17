
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
          canvasElement.style.position = 'absolute'; // Change to absolute positioning
          canvasElement.style.zIndex = '1000'; // Significantly higher z-index
          canvasElement.style.pointerEvents = 'auto'; // Ensure it captures mouse events
          canvasElement.style.top = '0';
          canvasElement.style.left = '0';
          canvasElement.style.width = '100%';
          canvasElement.style.height = '100%';
          
          // Force cursor to be visible with important flag
          canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' pointer-events: auto !important;');
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
        isolation: 'isolate', // Create stacking context
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
