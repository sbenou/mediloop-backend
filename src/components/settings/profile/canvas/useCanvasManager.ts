import { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas, Image as FabricImage } from 'fabric';
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
  rotateObject,
  StampTemplate,
  stampTemplates,
  applyImageFilter,
  bringObjectForward,
  sendObjectBackward,
  bringObjectToFront,
  sendObjectToBack,
  resizeCanvas,
  exportCanvas
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
  
  // New state variables for added features
  const [availableTemplates] = useState<StampTemplate[]>(stampTemplates);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [selectedImage, setSelectedImage] = useState<FabricImage | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    brightness: 0,
    contrast: 0,
    grayscale: false,
    sepia: false
  });

  // Initialize canvas
  useEffect(() => {
    if (canvasContainerRef.current && !canvas) {
      const containerWidth = canvasContainerRef.current.clientWidth;
      const containerHeight = canvasContainerRef.current.clientHeight;
      
      setCanvasWidth(containerWidth);
      setCanvasHeight(containerHeight);
      
      const fabricCanvas = initializeCanvas(canvasContainerRef.current, containerWidth, containerHeight);
      // Force white background
      fabricCanvas.backgroundColor = '#ffffff';
      fabricCanvas.renderAll();
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
    if (canvas) {
      ensureWhiteBackground(canvas);
      
      // Force white background after a short delay
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

  // Force white background periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (canvas) {
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      }
    }, 500);
    
    return () => clearInterval(interval);
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

  // Track selected image on the canvas
  useEffect(() => {
    if (!canvas) return;
    
    const handleSelectionCreated = (e: any) => {
      const selectedObject = e.selected?.[0];
      if (selectedObject && selectedObject.type === 'image') {
        setSelectedImage(selectedObject as FabricImage);
      } else {
        setSelectedImage(null);
      }
    };
    
    const handleSelectionCleared = () => {
      setSelectedImage(null);
    };
    
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated);
    canvas.on('selection:cleared', handleSelectionCleared);
    
    return () => {
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionCreated);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [canvas]);

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

  // NEW FEATURE HANDLERS

  // Apply a template
  const handleApplyTemplate = (templateId: string, doctorName?: string) => {
    if (!canvas) return;
    
    const template = availableTemplates.find(t => t.id === templateId);
    if (template) {
      template.applyTemplate(canvas, doctorName);
    }
  };

  // Apply image filter
  const handleApplyFilter = (filterType: 'brightness' | 'contrast' | 'grayscale' | 'sepia', value: number) => {
    if (!canvas || !selectedImage) return;
    
    applyImageFilter(canvas, selectedImage, filterType, value);
    
    // Update filter options state
    setFilterOptions(prev => ({
      ...prev,
      [filterType]: filterType === 'grayscale' || filterType === 'sepia' ? true : value
    }));
  };

  // Layer management
  const handleBringForward = () => {
    if (canvas) {
      bringObjectForward(canvas);
    }
  };
  
  const handleSendBackward = () => {
    if (canvas) {
      sendObjectBackward(canvas);
    }
  };
  
  const handleBringToFront = () => {
    if (canvas) {
      bringObjectToFront(canvas);
    }
  };
  
  const handleSendToBack = () => {
    if (canvas) {
      sendObjectToBack(canvas);
    }
  };

  // Canvas resizing
  const handleResizeCanvas = (width: number, height: number) => {
    if (canvas) {
      resizeCanvas(canvas, width, height);
      setCanvasWidth(width);
      setCanvasHeight(height);
    }
  };

  // Export to different formats
  const handleExport = (format: 'png' | 'jpeg' | 'svg' | 'pdf') => {
    if (canvas) {
      return exportCanvas(canvas, format);
    }
    return null;
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
    handleRotate,
    // New functionality
    availableTemplates,
    handleApplyTemplate,
    canvasWidth,
    canvasHeight,
    handleResizeCanvas,
    selectedImage,
    filterOptions,
    handleApplyFilter,
    handleBringForward,
    handleSendBackward,
    handleBringToFront,
    handleSendToBack,
    handleExport
  };
};
