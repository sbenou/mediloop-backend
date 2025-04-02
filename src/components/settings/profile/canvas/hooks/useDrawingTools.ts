
import { useState, useEffect, useRef, useCallback } from 'react';
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
    console.log("Canvas reference updated:", !!canvas);
  }, [canvas]);

  // Define pen cursor as a constant to ensure consistency
  const penCursor = 'crosshair'; // Simplified for browser compatibility

  // Helper function to apply cursor based on drawing mode
  const applyCursor = useCallback((canvas: FabricCanvas, isDrawing: boolean) => {
    try {
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
      
      // If wrapperEl isn't available yet, try again after a small delay
      if (!canvas.wrapperEl) {
        setTimeout(() => {
          if (canvas.wrapperEl) {
            canvas.wrapperEl.style.cursor = isDrawing ? penCursor : 'default';
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error applying cursor:", error);
    }
  }, [penCursor]);

  // Initialize freeDrawingBrush when canvas changes or when brush settings change
  useEffect(() => {
    if (!canvas) return;
    
    try {
      console.log("Initializing freeDrawingBrush");
      
      // Create a new brush instance
      const brush = new PencilBrush(canvas);
      brush.color = penColor;
      brush.width = brushSize;
      brush.shadow = null;
      brush.strokeLineCap = 'round';
      brush.strokeLineJoin = 'round';
      
      // Directly assign to freeDrawingBrush
      // Need to use type assertion for TypeScript compatibility
      (canvas as any).freeDrawingBrush = brush;
      
      // Apply drawing mode
      canvas.isDrawingMode = isDrawMode;
      applyCursor(canvas, isDrawMode);
      
      console.log("Brush initialized:", brush);
      
      // Ensure background stays white and render once
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    } catch (error) {
      console.error("Error initializing brush:", error);
    }
  }, [canvas, penColor, brushSize, isDrawMode, applyCursor]);

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
  const toggleDrawMode = useCallback(() => {
    if (!canvas) return;
    
    try {
      const newMode = !isDrawMode;
      console.log(`Toggling draw mode: ${isDrawMode} -> ${newMode}`);
      setIsDrawMode(newMode);
      
      // Update canvas drawing mode
      canvas.isDrawingMode = newMode;
      
      // Create a new brush if needed when entering drawing mode
      if (newMode) {
        const brush = new PencilBrush(canvas);
        brush.color = penColor;
        brush.width = brushSize;
        brush.shadow = null;
        brush.strokeLineCap = 'round';
        brush.strokeLineJoin = 'round';
        
        // Directly assign to freeDrawingBrush
        (canvas as any).freeDrawingBrush = brush;
        setSelectedTool('draw');
      } else {
        setSelectedTool('select');
      }
      
      // Apply cursor based on new mode
      applyCursor(canvas, newMode);
      
      // Set background color and render once
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    } catch (error) {
      console.error("Error toggling draw mode:", error);
    }
  }, [canvas, isDrawMode, penColor, brushSize, applyCursor]);

  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    console.log(`Changing pen color to: ${color}`);
    setPenColor(color);
    if (!canvas) return;
    
    try {
      // Update the color on the freeDrawingBrush directly
      if ((canvas as any).freeDrawingBrush) {
        (canvas as any).freeDrawingBrush.color = color;
        console.log("Color applied to brush:", (canvas as any).freeDrawingBrush.color);
      } else {
        console.warn("No brush available to update color");
        // If no brush exists, create one
        const brush = new PencilBrush(canvas);
        brush.color = color;
        brush.width = brushSize;
        brush.shadow = null;
        brush.strokeLineCap = 'round';
        brush.strokeLineJoin = 'round';
        
        // Directly assign to freeDrawingBrush
        (canvas as any).freeDrawingBrush = brush;
      }
      
      // Set background and render once
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    } catch (error) {
      console.error("Error changing brush color:", error);
    }
  }, [canvas, brushSize]);

  // Handle brush size change
  const handleBrushSizeChange = useCallback((size: number) => {
    console.log(`Changing brush size to: ${size}`);
    setBrushSize(size);
    if (!canvas) return;
    
    try {
      // Update the width on the freeDrawingBrush directly
      if ((canvas as any).freeDrawingBrush) {
        (canvas as any).freeDrawingBrush.width = size;
        console.log("Size applied to brush:", (canvas as any).freeDrawingBrush.width);
      } else {
        console.warn("No brush available to update size");
        // If no brush exists, create one
        const brush = new PencilBrush(canvas);
        brush.color = penColor;
        brush.width = size;
        brush.shadow = null;
        brush.strokeLineCap = 'round';
        brush.strokeLineJoin = 'round';
        
        // Directly assign to freeDrawingBrush
        (canvas as any).freeDrawingBrush = brush;
      }
      
      canvas.renderAll();
    } catch (error) {
      console.error("Error changing brush size:", error);
    }
  }, [canvas, penColor]);

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
