
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
