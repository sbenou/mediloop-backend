
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
  const [forcedRenderId, setForcedRenderId] = useState(0);
  const initAttempts = useRef(0);
  const renderAttemptRef = useRef(0);
  const isInitializing = useRef(false);

  // Initialize canvas
  useEffect(() => {
    if (canvasContainerRef.current && !canvas && !isInitializing.current) {
      isInitializing.current = true;
      
      try {
        const containerWidth = canvasContainerRef.current.clientWidth;
        const containerHeight = canvasContainerRef.current.clientHeight;
        
        setCanvasWidth(containerWidth);
        setCanvasHeight(containerHeight);
        
        const fabricCanvas = initializeCanvas(canvasContainerRef.current, containerWidth, containerHeight);
        
        // Explicitly set white background immediately
        fabricCanvas.backgroundColor = '#ffffff';
        fabricCanvas.renderAll();
        
        setCanvas(fabricCanvas);
        isInitializing.current = false;
      } catch (error) {
        console.error('Error initializing canvas:', error);
        initAttempts.current++;
        isInitializing.current = false;
        
        // If we've tried too many times, stop trying
        if (initAttempts.current < 3) {
          // Try again in a moment
          setTimeout(() => {
            setForcedRenderId(id => id + 1);
          }, 500);
        }
      }
    }
    
    return () => {
      if (canvas) {
        cleanupCanvasListeners(canvas);
        canvas.dispose();
      }
    };
  }, [forcedRenderId]);

  // Apply event listeners to ensure white background - with recursion safeguard
  useEffect(() => {
    if (canvas) {
      ensureWhiteBackground(canvas);
      
      return () => {
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

  return {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight,
    setCanvasWidth,
    setCanvasHeight
  };
};
