
import { useState, useEffect, useRef } from 'react';
import { Canvas as FabricCanvas, PencilBrush } from 'fabric';

export interface UseDrawingToolsProps {
  canvas: FabricCanvas | null;
}

export const useDrawingTools = ({ canvas }: UseDrawingToolsProps) => {
  const [isDrawMode, setIsDrawMode] = useState(true); // Start in draw mode by default
  const [penColor, setPenColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [selectedTool, setSelectedTool] = useState<'draw' | 'select' | 'shape' | 'text' | 'date' | 'checkbox'>('draw');
  const [selectedShape, setSelectedShape] = useState<'circle' | 'rectangle' | 'line' | null>(null);
  
  // Use a ref to track the current canvas to avoid stale closures in event handlers
  const canvasRef = useRef<FabricCanvas | null>(null);
  
  // Update the ref when canvas changes
  useEffect(() => {
    canvasRef.current = canvas;
  }, [canvas]);

  // Define pen cursor
  const penCursor = 'crosshair'; // Simplified for browser compatibility

  // Helper function to apply cursor based on drawing mode
  const applyCursor = (canvas: FabricCanvas, isDrawing: boolean) => {
    if (isDrawing) {
      canvas.defaultCursor = penCursor;
      canvas.hoverCursor = penCursor;
      canvas.freeDrawingCursor = penCursor;
      
      // Apply cursor directly to the wrapper element for immediate visibility
      if (canvas.wrapperEl) {
        canvas.wrapperEl.style.cursor = penCursor;
      }
    } else {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'default';
      
      // Apply cursor directly to the wrapper element for immediate visibility
      if (canvas.wrapperEl) {
        canvas.wrapperEl.style.cursor = 'default';
      }
    }
  };

  // Apply brush settings when canvas is initialized or relevant settings change
  useEffect(() => {
    if (!canvas) return;
    
    try {
      // Make sure the drawing mode is properly set first
      canvas.isDrawingMode = isDrawMode;
      
      // Initialize the freeDrawingBrush if needed
      if (!canvas.freeDrawingBrush) {
        console.log("Creating new free drawing brush");
        // Use PencilBrush directly
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      
      if (canvas.freeDrawingBrush) {
        // Configure brush settings
        canvas.freeDrawingBrush.color = penColor;
        canvas.freeDrawingBrush.width = brushSize;
        
        // Make sure objects created are visible and interactive
        canvas.freeDrawingBrush.shadow = null;
        canvas.freeDrawingBrush.strokeLineCap = 'round';
        canvas.freeDrawingBrush.strokeLineJoin = 'round';
      }
      
      // Apply proper cursor based on current drawing mode
      applyCursor(canvas, isDrawMode);
      
      // Ensure background stays white and render once
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    } catch (error) {
      console.error("Error applying brush settings:", error);
    }
  }, [canvas, isDrawMode, penColor, brushSize]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      try {
        const currentCanvas = canvasRef.current;
        if (currentCanvas) {
          // Remove any event listeners that might cause errors on unmount
          currentCanvas.off();
        }
      } catch (error) {
        console.error("Error in canvas cleanup:", error);
      }
    };
  }, []);

  // Toggle drawing mode
  const toggleDrawMode = () => {
    if (!canvas) return;
    
    try {
      const newMode = !isDrawMode;
      setIsDrawMode(newMode);
      
      // Update canvas drawing mode
      canvas.isDrawingMode = newMode;
      
      // Apply cursor based on new mode
      applyCursor(canvas, newMode);
      
      if (newMode) {
        // Ensure brush settings are applied
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = penColor;
          canvas.freeDrawingBrush.width = brushSize;
        }
        
        setSelectedTool('draw');
      } else {
        setSelectedTool('select');
      }

      // Set background color and render once
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    } catch (error) {
      console.error("Error toggling draw mode:", error);
    }
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    setPenColor(color);
    if (!canvas) return;
    
    try {
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color;
      }
      
      // Set background and render once
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    } catch (error) {
      console.error("Error changing brush color:", error);
    }
  };

  // Handle brush size change
  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    if (!canvas) return;
    
    try {
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = size;
        canvas.renderAll();
      }
    } catch (error) {
      console.error("Error changing brush size:", error);
    }
  };

  return {
    isDrawMode,
    penColor,
    brushSize,
    selectedTool,
    selectedShape,
    setSelectedTool,
    setSelectedShape,
    toggleDrawMode,
    handleColorChange,
    handleBrushSizeChange,
    setIsDrawMode
  };
};
