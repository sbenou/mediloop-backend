
import { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { 
  initializeCanvas, 
  ensureWhiteBackground, 
  cleanupCanvasListeners, 
  loadImageToCanvas,
  undoCanvas,
  redoCanvas,
  canUndo,
  canRedo,
  addCircle,
  addRectangle,
  addText,
  addLine,
  changeBrushSize,
  toggleGrid,
  rotateObject
} from './canvasUtils';

interface UseCanvasManagerProps {
  imageUrl: string | null;
}

export const useCanvasManager = ({ imageUrl }: UseCanvasManagerProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [showGrid, setShowGrid] = useState(false);
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'draw' | 'select' | 'shape' | 'text'>('draw');
  const [selectedShape, setSelectedShape] = useState<'circle' | 'rectangle' | 'line' | null>(null);

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

  // Update undo/redo state
  useEffect(() => {
    const updateUndoRedoState = () => {
      setCanUndoState(canUndo());
      setCanRedoState(canRedo());
    };
    
    // Check initially and whenever the canvas changes
    updateUndoRedoState();
    
    // Poll for changes every 500ms as a fallback
    const interval = setInterval(updateUndoRedoState, 500);
    return () => clearInterval(interval);
  }, [canvas]);

  // Update grid when toggle changes
  useEffect(() => {
    if (canvas) {
      toggleGrid(canvas, showGrid);
    }
  }, [canvas, showGrid]);

  // Toggle drawing mode
  const toggleDrawMode = () => {
    if (!canvas) return;
    
    const newMode = !isDrawMode;
    setIsDrawMode(newMode);
    
    canvas.isDrawingMode = newMode;
    if (newMode) {
      canvas.freeDrawingBrush.color = penColor;
      canvas.freeDrawingBrush.width = brushSize;
      setSelectedTool('draw');
    } else {
      setSelectedTool('select');
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

  // Handle brush size change
  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    if (canvas) {
      changeBrushSize(canvas, size);
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (canvas) {
      const success = undoCanvas(canvas);
      if (success) {
        setCanUndoState(canUndo());
        setCanRedoState(canRedo());
      }
    }
  };

  // Redo last undone action
  const handleRedo = () => {
    if (canvas) {
      const success = redoCanvas(canvas);
      if (success) {
        setCanUndoState(canUndo());
        setCanRedoState(canRedo());
      }
    }
  };

  // Toggle grid visibility
  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
  };

  // Add a shape to the canvas
  const handleAddShape = (shape: 'circle' | 'rectangle' | 'line') => {
    if (!canvas) return;
    
    setSelectedShape(shape);
    setSelectedTool('shape');
    canvas.isDrawingMode = false;
    setIsDrawMode(false);
    
    switch (shape) {
      case 'circle':
        addCircle(canvas, penColor);
        break;
      case 'rectangle':
        addRectangle(canvas, penColor);
        break;
      case 'line':
        addLine(canvas, penColor);
        break;
    }
  };

  // Add text to the canvas
  const handleAddText = () => {
    if (!canvas) return;
    
    setSelectedTool('text');
    canvas.isDrawingMode = false;
    setIsDrawMode(false);
    
    addText(canvas, 'Text', penColor);
  };

  // Rotate selected object
  const handleRotate = (angle: number) => {
    if (canvas) {
      rotateObject(canvas, angle);
    }
  };

  return {
    canvasContainerRef,
    canvas,
    isDrawMode,
    penColor,
    brushSize,
    showGrid,
    canUndo: canUndoState,
    canRedo: canRedoState,
    selectedTool,
    selectedShape,
    toggleDrawMode,
    clearCanvas,
    handleColorChange,
    handleBrushSizeChange,
    handleUndo,
    handleRedo,
    handleToggleGrid,
    handleAddShape,
    handleAddText,
    handleRotate
  };
};
