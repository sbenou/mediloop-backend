
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

  // Helper to create and configure the brush
  const createBrush = useCallback((canvas: FabricCanvas) => {
    try {
      console.log("Creating new brush for canvas");
      const brush = new PencilBrush(canvas);
      brush.color = penColor;
      brush.width = brushSize;
      brush.shadow = null;
      brush.strokeLineCap = 'round';
      brush.strokeLineJoin = 'round';
      
      // Use type assertion to access Fabric v6 method
      (canvas as any).setBrush(brush);
      console.log("Brush created and set successfully:", brush);
      return brush;
    } catch (error) {
      console.error("Error creating brush:", error);
      return null;
    }
  }, [penColor, brushSize]);

  // Apply brush settings when canvas is initialized or relevant settings change
  useEffect(() => {
    if (!canvas) return;
    
    try {
      console.log("Applying brush settings to canvas");
      
      // Make sure the drawing mode is properly set first
      canvas.isDrawingMode = isDrawMode;
      
      // Create and apply a new brush using Fabric v6 method
      createBrush(canvas);
      
      // Apply proper cursor based on current drawing mode
      applyCursor(canvas, isDrawMode);
      
      // Ensure background stays white and render once
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      
      // Debug: Verify the brush was created
      setTimeout(() => {
        const currentBrush = (canvas as any).getBrush?.();
        console.log("Current brush after setup:", currentBrush);
        console.log("Drawing mode:", canvas.isDrawingMode);
      }, 200);
    } catch (error) {
      console.error("Error applying brush settings:", error);
    }
  }, [canvas, isDrawMode, createBrush, applyCursor]);

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
      
      // Apply cursor based on new mode
      applyCursor(canvas, newMode);
      
      if (newMode) {
        // Ensure brush is properly created for drawing mode
        createBrush(canvas);
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
  }, [canvas, isDrawMode, applyCursor, createBrush]);

  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    console.log(`Changing pen color to: ${color}`);
    setPenColor(color);
    if (!canvas) return;
    
    try {
      // Get the current brush using Fabric v6 method
      const brush = (canvas as any).getBrush?.();
      if (brush) {
        brush.color = color;
        console.log("Color applied to brush:", brush.color);
      } else {
        console.warn("No brush available to update color");
        // If no brush exists, create one
        createBrush(canvas);
      }
      
      // Set background and render once
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    } catch (error) {
      console.error("Error changing brush color:", error);
    }
  }, [canvas, createBrush]);

  // Handle brush size change
  const handleBrushSizeChange = useCallback((size: number) => {
    console.log(`Changing brush size to: ${size}`);
    setBrushSize(size);
    if (!canvas) return;
    
    try {
      // Get the current brush using Fabric v6 method
      const brush = (canvas as any).getBrush?.();
      if (brush) {
        brush.width = size;
        console.log("Size applied to brush:", brush.width);
      } else {
        console.warn("No brush available to update size");
        // If no brush exists, create one
        createBrush(canvas);
      }
      
      canvas.renderAll();
    } catch (error) {
      console.error("Error changing brush size:", error);
    }
  }, [canvas, createBrush]);

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
