
import React, { useEffect, useRef } from 'react';

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({ canvasRef }) => {
  const initialized = useRef(false);

  // Force white background immediately on mount and when component updates
  useEffect(() => {
    if (!initialized.current && canvasRef.current) {
      // Set initial white background
      const canvasElement = canvasRef.current.querySelector('canvas');
      if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
      }
      initialized.current = true;
    }
    
    // Force white background on any canvas element that appears
    const forceWhiteBackground = () => {
      if (canvasRef.current) {
        const canvasElement = canvasRef.current.querySelector('canvas');
        if (canvasElement) {
          const ctx = canvasElement.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
          }
        }
      }
    };
    
    // Initial call
    forceWhiteBackground();
    
    // Set up a periodic check to ensure white background
    const interval = setInterval(forceWhiteBackground, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [canvasRef]);

  return (
    <div 
      ref={canvasRef}
      className="border rounded-md overflow-hidden bg-white w-full" 
      style={{ 
        height: '200px',
        backgroundColor: '#ffffff', // Force white background in the container
      }}
    ></div>
  );
};

export default CanvasContainer;
