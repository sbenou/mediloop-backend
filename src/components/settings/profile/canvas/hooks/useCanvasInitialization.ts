
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

  // Initialize canvas
  useEffect(() => {
    if (canvasContainerRef.current && !canvas) {
      const containerWidth = canvasContainerRef.current.clientWidth;
      const containerHeight = canvasContainerRef.current.clientHeight;
      
      setCanvasWidth(containerWidth);
      setCanvasHeight(containerHeight);
      
      try {
        const fabricCanvas = initializeCanvas(canvasContainerRef.current, containerWidth, containerHeight);
        
        // Explicitly set white background immediately
        fabricCanvas.backgroundColor = '#ffffff';
        fabricCanvas.renderAll();
        
        setCanvas(fabricCanvas);
        
        // We'll do just one forced render after a delay, not multiple
        setTimeout(() => {
          setForcedRenderId(id => id + 1);
          if (fabricCanvas) {
            fabricCanvas.backgroundColor = '#ffffff';
            fabricCanvas.renderAll();
          }
        }, 300);
      } catch (error) {
        console.error('Error initializing canvas:', error);
        initAttempts.current++;
        
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
      
      // Force white background after a short delay - just once
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

  // Enhanced force white background effect - with safeguards against recursion
  useEffect(() => {
    if (!canvas) return;
    
    // Force white background on canvas immediately
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    
    // Instead of a frequent interval, use a single timeout
    const timeout = setTimeout(() => {
      if (canvas) {
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      }
    }, 200);
    
    return () => clearTimeout(timeout);
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
