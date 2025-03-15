
import React from 'react';

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({ canvasRef }) => {
  return (
    <div 
      ref={canvasRef}
      className="border rounded-md overflow-hidden bg-white w-full" 
      style={{ 
        height: '200px',
        backgroundColor: '#ffffff' // Force white background in the container
      }}
    ></div>
  );
};

export default CanvasContainer;
