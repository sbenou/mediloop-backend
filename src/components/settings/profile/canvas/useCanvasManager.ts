
import { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { initializeCanvas, ensureWhiteBackground, cleanupCanvasListeners, loadImageToCanvas } from './canvasUtils';

interface UseCanvasManagerProps {
  imageUrl: string | null;
}

export const useCanvasManager = ({ imageUrl }: UseCanvasManagerProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [penColor, setPenColor] = useState('#000000');

  // Initialize canvas
  useEffect(() => {
    if (canvasContainerRef.current && !canvas) {
      const fabricCanvas = initializeCanvas(canvasContainerRef.current);
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
    ensureWhiteBackground(canvas);
    
    return () => {
      cleanupCanvasListeners(canvas);
    };
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

  // Toggle drawing mode
  const toggleDrawMode = () => {
    if (!canvas) return;
    
    const newMode = !isDrawMode;
    setIsDrawMode(newMode);
    
    canvas.isDrawingMode = newMode;
    if (newMode) {
      canvas.freeDrawingBrush.color = penColor;
      canvas.freeDrawingBrush.width = 3;
    }

    // Always ensure background is white regardless of mode change
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
  };

  // Clear the canvas
  const clearCanvas = () => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    }
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    setPenColor(color);
    if (canvas && canvas.isDrawingMode) {
      canvas.freeDrawingBrush.color = color;
    }
    
    // Ensure background stays white when changing colors
    if (canvas) {
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    }
  };

  return {
    canvasContainerRef,
    canvas,
    isDrawMode,
    penColor,
    toggleDrawMode,
    clearCanvas,
    handleColorChange
  };
};
