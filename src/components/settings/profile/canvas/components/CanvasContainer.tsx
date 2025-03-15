
import React, { useEffect, useRef } from 'react';

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({ canvasRef }) => {
  const initialized = useRef(false);
  const lastAppliedTime = useRef(0);

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
    
    // Force white background - only once after mount
    const applyWhiteBackground = () => {
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
    applyWhiteBackground();
    
    // Instead of an interval that could cause recursion, use a single timeout
    const timeout = setTimeout(applyWhiteBackground, 150);
    
    return () => {
      clearTimeout(timeout);
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
