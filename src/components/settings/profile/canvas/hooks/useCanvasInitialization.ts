
import { useState, useEffect, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { initializeCanvas, cleanupCanvasListeners } from '../utils/canvasInitialization';

interface UseCanvasInitializationProps {
  imageUrl: string | null;
}

export const useCanvasInitialization = ({ imageUrl }: UseCanvasInitializationProps) => {
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(200);
  const [canvasHeight, setCanvasHeight] = useState(200);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Initialize canvas when container is ready
  useEffect(() => {
    if (!canvasContainerRef.current || initialized.current) return;
    
    try {
      // Initialize canvas with the container and image URL
      const fabricCanvas = initializeCanvas(canvasContainerRef.current, imageUrl);
      setCanvas(fabricCanvas);
      
      // Update dimensions state
      setCanvasWidth(fabricCanvas.getWidth());
      setCanvasHeight(fabricCanvas.getHeight());
      
      initialized.current = true;
      
      // Cleanup function
      return () => {
        try {
          // Safely remove all event listeners and dispose canvas
          if (fabricCanvas) {
            // Remove known event listeners first
            fabricCanvas.off('mouse:over');
            fabricCanvas.off('object:added');
            
            // Then use cleanup utility
            cleanupCanvasListeners(fabricCanvas);
          }
        } catch (error) {
          console.error('Error in canvas cleanup:', error);
        } finally {
          // Always set canvas to null to prevent further access attempts
          setCanvas(null);
        }
      };
    } catch (error) {
      console.error('Error initializing canvas:', error);
    }
  }, [imageUrl]);

  // Handle window resize
  useEffect(() => {
    if (!canvas || !canvasContainerRef.current) return;

    const handleResize = () => {
      try {
        if (!canvasContainerRef.current || !canvas) return;
        
        const { clientWidth, clientHeight } = canvasContainerRef.current;
        
        // Only resize if container dimensions have changed
        if (clientWidth !== canvas.getWidth() || clientHeight !== canvas.getHeight()) {
          canvas.setDimensions({
            width: clientWidth,
            height: clientHeight
          });
          
          // Update dimensions state
          setCanvasWidth(clientWidth);
          setCanvasHeight(clientHeight);
          
          // Force a render
          canvas.renderAll();
        }
      } catch (error) {
        console.error('Error handling canvas resize:', error);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvas]);

  return {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight
  };
};
