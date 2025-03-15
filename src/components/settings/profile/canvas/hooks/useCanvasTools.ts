
import { useState, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { 
  canUndo as canUndoUtil, 
  canRedo as canRedoUtil,
  undoCanvas as undoCanvasUtil,
  redoCanvas as redoCanvasUtil,
  changeBrushSize as changeBrushSizeUtil,
  toggleGrid as toggleGridUtil,
  rotateObject as rotateObjectUtil,
  addCircle as addCircleUtil,
  addRectangle as addRectangleUtil,
  addText as addTextUtil,
  addLine as addLineUtil,
  resizeCanvas as resizeCanvasUtil,
  StampTemplate
} from '../utils';

export interface UseCanvasToolsProps {
  canvas: FabricCanvas | null;
  templates: StampTemplate[];
}

export const useCanvasTools = ({ canvas, templates }: UseCanvasToolsProps) => {
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [showGrid, setShowGrid] = useState(false);
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'draw' | 'select' | 'shape' | 'text'>('draw');
  const [selectedShape, setSelectedShape] = useState<'circle' | 'rectangle' | 'line' | null>(null);
  const [availableTemplates] = useState<StampTemplate[]>(templates);

  // Update undo/redo state
  useEffect(() => {
    const updateUndoRedoState = () => {
      setCanUndoState(canUndoUtil());
      setCanRedoState(canRedoUtil());
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
      toggleGridUtil(canvas, showGrid);
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
      changeBrushSizeUtil(canvas, size);
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (canvas) {
      const success = undoCanvasUtil(canvas);
      if (success) {
        setCanUndoState(canUndoUtil());
        setCanRedoState(canRedoUtil());
      }
    }
  };

  // Redo last undone action
  const handleRedo = () => {
    if (canvas) {
      const success = redoCanvasUtil(canvas);
      if (success) {
        setCanUndoState(canUndoUtil());
        setCanRedoState(canRedoUtil());
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
        addCircleUtil(canvas, penColor);
        break;
      case 'rectangle':
        addRectangleUtil(canvas, penColor);
        break;
      case 'line':
        addLineUtil(canvas, penColor);
        break;
    }
  };

  // Add text to the canvas
  const handleAddText = () => {
    if (!canvas) return;
    
    setSelectedTool('text');
    canvas.isDrawingMode = false;
    setIsDrawMode(false);
    
    addTextUtil(canvas, 'Text', penColor);
  };

  // Rotate selected object
  const handleRotate = (angle: number) => {
    if (canvas) {
      rotateObjectUtil(canvas, angle);
    }
  };

  // Apply a template
  const handleApplyTemplate = (templateId: string, doctorName?: string) => {
    if (!canvas) return;
    
    const template = availableTemplates.find(t => t.id === templateId);
    if (template) {
      template.applyTemplate(canvas, doctorName);
    }
  };

  // Canvas resizing
  const handleResizeCanvas = (width: number, height: number) => {
    if (canvas) {
      resizeCanvasUtil(canvas, width, height);
    }
  };

  return {
    isDrawMode,
    penColor,
    brushSize,
    showGrid,
    canUndo: canUndoState,
    canRedo: canRedoState,
    selectedTool,
    selectedShape,
    availableTemplates,
    toggleDrawMode,
    clearCanvas,
    handleColorChange,
    handleBrushSizeChange,
    handleUndo,
    handleRedo,
    handleToggleGrid,
    handleAddShape,
    handleAddText,
    handleRotate,
    handleApplyTemplate,
    handleResizeCanvas
  };
};
