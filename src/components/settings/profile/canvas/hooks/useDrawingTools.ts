
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

  // Initialize and update brush when canvas changes or when brush settings change
  useEffect(() => {
    if (!canvas) return;
    
    try {
      console.log("Initializing or updating brush");
      
      // Create a new brush instance
      const brush = new PencilBrush(canvas);
      brush.color = penColor;
      brush.width = brushSize;
      brush.shadow = null;
      brush.strokeLineCap = 'round';
      brush.strokeLineJoin = 'round';
      
      // In Fabric.js v6, we need to set the brush properly
      // Use type assertions to handle the TypeScript errors
      if (typeof (canvas as any).setBrush === 'function') {
        (canvas as any).setBrush(brush);
        console.log("Brush set using canvas.setBrush()");
      } else {
        // Fallback for backward compatibility
        (canvas as any).freeDrawingBrush = brush;
        console.log("Brush set using canvas.freeDrawingBrush fallback");
      }
      
      // Apply drawing mode
      canvas.isDrawingMode = isDrawMode;
      applyCursor(canvas, isDrawMode);
      
      console.log("Brush initialized:", {
        color: brush.color,
        width: brush.width,
        isDrawingMode: canvas.isDrawingMode
      });
      
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
        
        // In Fabric.js v6, use setBrush method if available
        if (typeof (canvas as any).setBrush === 'function') {
          (canvas as any).setBrush(brush);
          console.log("Brush set using canvas.setBrush() during toggle");
        } else {
          // Fallback for backward compatibility
          (canvas as any).freeDrawingBrush = brush;
          console.log("Brush set using canvas.freeDrawingBrush fallback during toggle");
        }
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
      // Get the current brush - use getBrush if available (Fabric v6)
      let brush;
      if (typeof (canvas as any).getBrush === 'function') {
        brush = (canvas as any).getBrush();
        console.log("Got brush using canvas.getBrush()");
      } else {
        // Fallback for backward compatibility
        brush = (canvas as any).freeDrawingBrush;
        console.log("Got brush using canvas.freeDrawingBrush fallback");
      }
      
      // Update the color on the brush
      if (brush) {
        brush.color = color;
        console.log("Color applied to brush:", brush.color);
      } else {
        console.warn("No brush available to update color, creating new one");
        // If no brush exists, create one
        const newBrush = new PencilBrush(canvas);
        newBrush.color = color;
        newBrush.width = brushSize;
        newBrush.shadow = null;
        newBrush.strokeLineCap = 'round';
        newBrush.strokeLineJoin = 'round';
        
        // Set the new brush using the appropriate method
        if (typeof (canvas as any).setBrush === 'function') {
          (canvas as any).setBrush(newBrush);
          console.log("New brush set using canvas.setBrush()");
        } else {
          // Fallback for backward compatibility
          (canvas as any).freeDrawingBrush = newBrush;
          console.log("New brush set using canvas.freeDrawingBrush fallback");
        }
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
      // Get the current brush - use getBrush if available (Fabric v6)
      let brush;
      if (typeof (canvas as any).getBrush === 'function') {
        brush = (canvas as any).getBrush();
        console.log("Got brush using canvas.getBrush()");
      } else {
        // Fallback for backward compatibility
        brush = (canvas as any).freeDrawingBrush;
        console.log("Got brush using canvas.freeDrawingBrush fallback");
      }
      
      // Update the width on the brush
      if (brush) {
        brush.width = size;
        console.log("Size applied to brush:", brush.width);
      } else {
        console.warn("No brush available to update size, creating new one");
        // If no brush exists, create one
        const newBrush = new PencilBrush(canvas);
        newBrush.color = penColor;
        newBrush.width = size;
        newBrush.shadow = null;
        newBrush.strokeLineCap = 'round';
        newBrush.strokeLineJoin = 'round';
        
        // Set the new brush using the appropriate method
        if (typeof (canvas as any).setBrush === 'function') {
          (canvas as any).setBrush(newBrush);
          console.log("New brush set using canvas.setBrush()");
        } else {
          // Fallback for backward compatibility
          (canvas as any).freeDrawingBrush = newBrush;
          console.log("New brush set using canvas.freeDrawingBrush fallback");
        }
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
