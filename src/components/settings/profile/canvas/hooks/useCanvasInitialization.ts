
import { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { 
  initializeCanvas, 
  ensureWhiteBackground, 
  cleanupCanvasListeners,
  loadImageToCanvas
} from '../utils';

export interface UseCanvasInitializationProps {
  imageUrl: string | null;
}

export const useCanvasInitialization = ({ imageUrl }: UseCanvasInitializationProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);

  // Initialize canvas
  useEffect(() => {
    if (canvasContainerRef.current && !canvas) {
      const containerWidth = canvasContainerRef.current.clientWidth;
      const containerHeight = canvasContainerRef.current.clientHeight;
      
      setCanvasWidth(containerWidth);
      setCanvasHeight(containerHeight);
      
      const fabricCanvas = initializeCanvas(canvasContainerRef.current, containerWidth, containerHeight);
      // Force white background
      fabricCanvas.backgroundColor = '#ffffff';
      fabricCanvas.renderAll();
      setCanvas(fabricCanvas);
    }
    
    return () => {
      if (canvas) {
        cleanupCanvasListeners(canvas);
        canvas.dispose();
      }
    };
  }, []);

  // Apply event listeners to ensure white background
  useEffect(() => {
    if (canvas) {
      ensureWhiteBackground(canvas);
      
      // Force white background after a short delay
      const timer = setTimeout(() => {
        if (canvas) {
          canvas.backgroundColor = '#ffffff';
          canvas.renderAll();
        }
      }, 50);
      
      return () => {
        clearTimeout(timer);
        cleanupCanvasListeners(canvas);
      };
    }
  }, [canvas]);

  // Load image URL if available
  useEffect(() => {
    if (canvas && imageUrl) {
      loadImageToCanvas(canvas, imageUrl);
    } else if (canvas) {
      // If no URL but canvas exists, ensure it's white
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    }
  }, [canvas, imageUrl]);

  // Additional effect to force white background when component mounts or rerenders
  useEffect(() => {
    // Force white background on canvas after a short delay
    const timer = setTimeout(() => {
      if (canvas) {
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [canvas]);

  // Force white background periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (canvas) {
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [canvas]);

  return {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight,
    setCanvasWidth,
    setCanvasHeight
  };
};
