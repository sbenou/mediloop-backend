
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
        
        // Fix: Only pass the container, not the width and height
        const fabricCanvas = initializeCanvas(canvasContainerRef.current, imageUrl);
        
        // Explicitly force white background multiple times to ensure it's set
        fabricCanvas.backgroundColor = '#ffffff';
        fabricCanvas.renderAll();
        
        // Force it again after a tiny delay to ensure rendering issues don't cause problems
        setTimeout(() => {
          if (fabricCanvas) {
            fabricCanvas.backgroundColor = '#ffffff';
            fabricCanvas.renderAll();
          }
        }, 50);
        
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
  }, [forcedRenderId, imageUrl]);

  // Apply event listeners to ensure white background
  useEffect(() => {
    if (canvas) {
      // Force white background immediately
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      
      // Then set up ongoing enforcement
      ensureWhiteBackground(canvas);
      
      return () => {
        cleanupCanvasListeners(canvas);
      };
    }
  }, [canvas]);

  // Load image URL if available, or enforce white canvas
  useEffect(() => {
    if (canvas) {
      if (imageUrl) {
        loadImageToCanvas(canvas, imageUrl);
      } else {
        // If no URL but canvas exists, ensure it's white
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      }
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
