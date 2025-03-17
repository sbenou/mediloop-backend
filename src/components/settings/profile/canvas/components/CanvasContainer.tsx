
import React, { useEffect, useRef } from 'react';

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({ canvasRef }) => {
  const initialized = useRef(false);

  // Force white background on mount
  useEffect(() => {
    if (!initialized.current && canvasRef.current) {
      try {
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
            canvasElement.style.position = 'absolute !important'; // Force absolute positioning
            canvasElement.style.zIndex = '9999999 !important'; // Extremely high z-index
            canvasElement.style.pointerEvents = 'auto !important'; // Force pointer events
            canvasElement.style.top = '0';
            canvasElement.style.left = '0';
            canvasElement.style.width = '100%';
            canvasElement.style.height = '100%';
            canvasElement.style.cursor = 'crosshair !important'; // Force cursor
            
            // Apply styles directly to the DOM element
            canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' pointer-events: auto !important; z-index: 9999999 !important; cursor: crosshair !important;');
          }
        }
        
        // Add a global CSS rule for canvas elements to ensure visibility
        const styleSheet = document.createElement('style');
        styleSheet.id = 'canvas-visibility-fix';
        styleSheet.textContent = `
          canvas {
            position: absolute !important;
            z-index: 9999999 !important;
            pointer-events: auto !important;
            cursor: crosshair !important;
          }
        `;
        if (!document.getElementById('canvas-visibility-fix')) {
          document.head.appendChild(styleSheet);
        }
        
        initialized.current = true;
      } catch (error) {
        console.error('Error initializing canvas:', error);
      }
    }
    
    return () => {
      // Cleanup global styles when component unmounts
      try {
        const styleElement = document.getElementById('canvas-visibility-fix');
        if (styleElement) {
          styleElement.remove();
        }
      } catch (error) {
        console.error('Error cleaning up canvas styles:', error);
      }
    };
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
