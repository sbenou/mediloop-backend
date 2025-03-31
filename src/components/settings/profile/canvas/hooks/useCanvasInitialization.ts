
import { useRef, useState, useEffect } from 'react';
import { initializeCanvas, cleanupCanvasListeners } from '../utils';
import { loadImageToCanvas } from '../utils/canvasImageHandling';
import { Canvas as FabricCanvas } from 'fabric';

interface UseCanvasInitializationProps {
  imageUrl: string | null;
}

export const useCanvasInitialization = ({ imageUrl }: UseCanvasInitializationProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false);
  
  // Track the previous imageUrl for comparison
  const previousImageUrlRef = useRef<string | null>(null);

  // Initialize canvas and handle container resize
  useEffect(() => {
    if (!canvasContainerRef.current || canvas !== null) return;
    
    const containerWidth = canvasContainerRef.current.clientWidth;
    const newWidth = Math.min(600, containerWidth);
    const newHeight = Math.round(newWidth / 2);
    
    setCanvasWidth(newWidth);
    setCanvasHeight(newHeight);
    
    const newCanvas = initializeCanvas(canvasContainerRef.current, {
      width: newWidth,
      height: newHeight
    });
    
    setCanvas(newCanvas);
    setIsCanvasInitialized(true);
    
    // Cleanup function for when component unmounts or when effect reruns
    return () => {
      if (newCanvas) {
        try {
          console.log('Cleaning up canvas on unmount');
          // First remove all event listeners
          newCanvas.off();
          
          // Clear any objects on the canvas
          newCanvas.clear();
          
          // Call our enhanced cleanup function
          cleanupCanvasListeners(newCanvas);
          
          // Set canvas to null to avoid any future references
          setCanvas(null);
        } catch (error) {
          console.error('Error during canvas cleanup:', error);
        }
      }
    };
  }, [canvasContainerRef, canvas]);

  // Handle loading images when URL changes
  useEffect(() => {
    if (!canvas || !isCanvasInitialized) return;
    
    const currentImageUrl = imageUrl;
    const previousImageUrl = previousImageUrlRef.current;
    
    // Update the ref for future comparison
    previousImageUrlRef.current = currentImageUrl;
    
    // If the imageUrl changed to null (deleted) and there was a previous URL
    if (previousImageUrl && !currentImageUrl) {
      console.log('Image URL changed to null, clearing canvas');
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      return;
    }
    
    // If we have a valid image URL, load it
    if (currentImageUrl) {
      console.log('Loading image URL to canvas:', currentImageUrl);
      loadImageToCanvas(canvas, currentImageUrl);
    } else {
      // If there's no image at all (initial state), ensure we have a clean canvas
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    }
  }, [canvas, imageUrl, isCanvasInitialized]);

  return {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight
  };
};
