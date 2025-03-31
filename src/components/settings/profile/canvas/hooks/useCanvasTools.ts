
import { useState, useEffect } from 'react';
import { 
  Canvas as FabricCanvas, 
  PencilBrush, 
  Circle, 
  Rect, 
  Line, 
  IText 
} from 'fabric';
import { StampTemplate } from '../utils';
import { 
  saveCanvasState, 
  undoCanvas, 
  redoCanvas, 
  canUndo, 
  canRedo, 
  setupUndoRedoHistory, 
  clearHistory 
} from '../utils/canvasHistory';

export interface UseCanvasToolsProps {
  canvas: FabricCanvas | null;
  templates?: StampTemplate[];
}

export const useCanvasTools = ({ canvas, templates = [] }: UseCanvasToolsProps) => {
  // Drawing state
  const [isDrawMode, setIsDrawMode] = useState(true);
  const [penColor, setPenColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'draw' | 'select' | 'shape' | 'text' | 'date' | 'checkbox'>('draw');
  const [selectedShape, setSelectedShape] = useState<'circle' | 'rectangle' | 'line' | null>(null);
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Setup undo/redo history when canvas is initialized
  useEffect(() => {
    if (!canvas) return;
    
    // Set up history tracking
    setupUndoRedoHistory(canvas);
    
    // Initial state check
    updateUndoRedoState();
    
  }, [canvas]);

  // Update undo/redo state
  const updateUndoRedoState = () => {
    setCanUndoState(canUndo());
    setCanRedoState(canRedo());
  };

  // Update drawing brush when canvas or brush settings change
  useEffect(() => {
    if (!canvas) return;

    canvas.isDrawingMode = isDrawMode;
    canvas.selection = !isDrawMode;

    // Set appropriate cursor based on mode
    const penCursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNC0wMy0xOFQxMDo0MDoyMSswMDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiBzdEV2dDp3aGVuPSIyMDI0LTAzLTE4VDEwOjQwOjIxKzAwOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlmfX50AAAOASURBVFiFvZdNbBtFFMd/M7vrXX/E+diNE9cxqFVLVakqSAQKCJA4UCSEeqiqigMSHDhw4AYHJITghhDiA4lDJcSFFokDUksrWoRagsKhTUFtSIljO3HsJE68H157d4fDxHHiOA5JU56U1a5m3r//m/+892ZFNW+HGGKMASkQA4LdrwAyUOt+a8Ch1p4ppXbGACQgAWSBKUAFiO1NVXSN2K6SddxrlIBjwP4AQKnJFg4ZlbzZKpfPue3WnBfoQ4XDUlUUCdBUddKIRPYbsfiLeiS6ADwPnAe2DXkrcBKYHgQSQoQkRJHtnL7Z3Nxc6t10V+hn1XjskB6bcE3HIkkSpdVVufbvlS0sk9lIJKbTewdfVqPx81jWa7iuAdwAFoAa4AkgB5wCjg5YGwO07WazOVP45+IJ0/UeaJScRXPLLIQjhsKBoFhopJuXtW1xvLlnX8YY2NNZq12uLC9Xdu8+6MYmnr4pWytLvncMWO0Fegk4PYJhCngEkGR9vf2bYVTLk3v3HzcS4jcUDxmvHnrIl98tLrb9TnuZ3aSRB84Ac4A9CPTSkHD3fQvAUlWpIqQDsYxc9Q19/2P38JEDgdBejbW6bnY2G4X1f3+MZrMvCCVSeP/9izFgFjgJPA2oQQz0IdOdQoA3QY5qcliuKfH7BZBCoOshNR2+SwECo9GvDmDcM0H4Yd3SgMeHJFpnQdRSKeXlsdY+AuDZtlOpVIxlx9NvTB74/LXS5Lkvyf8SBE4DRbqXmVLhw1E56wGRRKLjBH7Ttm2ZTCbjx9PpzwqhaO6OuBZg0p3UYpTx7jwdIhIlkUir2WgYDjTn60r0jrvg3wvoFPDqqCMFiBCCeDJZXV0pJO1Wa+4iRnPvcfXHIL7jxUBm1HgPKBKJ1G3PnamiUNejM/fGH73lnFuH0IFXRh3vAWmaplUtYzqgU+P//EbANiKZbGmpmuMGQRDow4x3gdR2vXkoEXcbDhNW9bZZcBcKQX8rIwF5VNXLmGa96XnHYhPaT+fZuuPktYLhMdAzVVUbKyvL+0w9Mv/eOZkflbw+VDD0zQBFUer5fEGn0nrYq1b/HreM9dFnIAgCqlULOl79XW/l1rkV7GsB5XLFhWK1ZbYeeJ9eHpf8JnX36vG36/V6Bcu61fzdpv8HfwDWw9k6jVtqLAAAAABJRU5ErkJggg==) 4 4, auto';
    
    if (isDrawMode) {
      // Set pen cursor for drawing mode
      canvas.defaultCursor = penCursor;
      canvas.hoverCursor = penCursor;
      
      if (canvas.freeDrawingBrush) {
        // Use existing brush if possible, or create new one
        let brush = canvas.freeDrawingBrush;
        if (!(brush instanceof PencilBrush)) {
          brush = new PencilBrush(canvas);
          canvas.freeDrawingBrush = brush;
        }
        
        brush.color = penColor;
        brush.width = brushSize;
      }
      
      // Apply cursor directly to DOM element for extra reliability
      const canvasEl = canvas.getElement();
      if (canvasEl) {
        canvasEl.style.cursor = penCursor;
      }
    } else {
      // Set default cursor for selection mode
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'default';
      
      // Apply cursor directly to DOM element
      const canvasEl = canvas.getElement();
      if (canvasEl) {
        canvasEl.style.cursor = 'default';
      }
    }

    canvas.renderAll();
  }, [canvas, isDrawMode, penColor, brushSize]);

  // Add an effect to ensure drawings persist after mouse release
  useEffect(() => {
    if (!canvas) return;
    
    const onPathCreated = (e: any) => {
      console.log('Path created event triggered');
      
      if (e.path) {
        e.path.set({
          opacity: 1,
          stroke: penColor,
          fill: 'transparent',
          strokeWidth: brushSize,
          selectable: true,
          evented: true
        });
        
        // Don't auto-select the newly created path
        canvas.discardActiveObject();
        canvas.renderAll();
        
        // Save state for undo/redo
        saveCanvasState(canvas);
        updateUndoRedoState();
        setIsDirty(true);
      }
    };
    
    console.log('Setting up path:created listener');
    canvas.on('path:created', onPathCreated);
    
    // Setup listeners for object modifications to track history
    const updateHistory = () => {
      saveCanvasState(canvas);
      updateUndoRedoState();
      setIsDirty(true);
    };
    
    canvas.on('object:added', updateHistory);
    canvas.on('object:modified', updateHistory);
    canvas.on('object:removed', updateHistory);
    
    return () => {
      console.log('Removing path:created listener');
      canvas.off('path:created', onPathCreated);
      canvas.off('object:added', updateHistory);
      canvas.off('object:modified', updateHistory);
      canvas.off('object:removed', updateHistory);
    };
  }, [canvas, penColor, brushSize]);

  // Toggle between draw and select mode
  const toggleDrawMode = () => {
    setIsDrawMode(prev => !prev);
    setSelectedTool(isDrawMode ? 'select' : 'draw');
    if (isDrawMode) {
      setSelectedShape(null);
    }
  };

  // Clear the canvas
  const clearCanvas = () => {
    if (!canvas) return;
    canvas.getObjects().forEach(obj => canvas.remove(obj));
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    
    // Clear undo/redo history and mark as not dirty
    clearHistory();
    updateUndoRedoState();
    setIsDirty(false);
  };

  // Change pen color
  const handleColorChange = (color: string) => {
    setPenColor(color);
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
      canvas.renderAll();
    }
  };

  // Change brush size
  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = size;
      canvas.renderAll();
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (!canvas) return;
    const success = undoCanvas(canvas);
    if (success) {
      updateUndoRedoState();
    }
  };

  // Redo last undone action
  const handleRedo = () => {
    if (!canvas) return;
    const success = redoCanvas(canvas);
    if (success) {
      updateUndoRedoState();
    }
  };

  // Reset history and dirty state
  const resetHistory = () => {
    clearHistory();
    updateUndoRedoState();
    setIsDirty(false);
  };

  // Toggle grid visibility
  const handleToggleGrid = () => {
    setShowGrid(prev => !prev);
    // Grid implementation would go here
  };

  // Add a shape to the canvas
  const handleAddShape = (shape: 'circle' | 'rectangle' | 'line') => {
    if (!canvas) return;
    
    console.log('Adding shape:', shape);
    
    // Center of canvas
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;

    // Update UI state
    setIsDrawMode(false);
    setSelectedTool('shape');
    setSelectedShape(shape);
    
    // Common properties for all shapes
    const commonProps = {
      stroke: penColor,
      strokeWidth: 2,
      fill: 'transparent',
      opacity: 1,
      left: centerX,
      top: centerY,
      originX: 'center' as const,
      originY: 'center' as const,
      selectable: true,
      evented: true
    };
    
    // Create and add shape based on type
    let shapeObject;
    
    switch (shape) {
      case 'circle':
        shapeObject = new Circle({
          ...commonProps,
          radius: 30
        });
        break;
        
      case 'rectangle':
        shapeObject = new Rect({
          ...commonProps,
          width: 60,
          height: 60
        });
        break;
        
      case 'line':
        shapeObject = new Line([
          centerX - 40, centerY,
          centerX + 40, centerY
        ], {
          stroke: penColor,
          strokeWidth: 2,
          originX: 'center' as const,
          originY: 'center' as const,
          selectable: true,
          evented: true
        });
        break;
    }
    
    if (shapeObject) {
      console.log('Shape object created:', shapeObject);
      canvas.add(shapeObject);
      canvas.setActiveObject(shapeObject);
      canvas.bringObjectToFront(shapeObject);
      
      // Hard render flush
      canvas.requestRenderAll();
      canvas.calcOffset();
      
      saveCanvasState(canvas);
      updateUndoRedoState();
      setIsDirty(true);
    }
  };

  // Add text to the canvas
  const handleAddText = () => {
    if (!canvas) return;
    
    // Update UI state
    setIsDrawMode(false);
    setSelectedTool('text');
    setSelectedShape(null);

    // Create and add text object
    const text = new IText('Edit me', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: penColor,
      stroke: penColor,
      strokeWidth: 0.5,
      originX: 'center' as const,
      originY: 'center' as const,
      editable: true,
      selectable: true,
      evented: true
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.bringObjectToFront(text);
    text.enterEditing();
    text.selectAll();
    canvas.renderAll();
    saveCanvasState(canvas);
    updateUndoRedoState();
    setIsDirty(true);
  };

  // Add a date field to the canvas
  const handleAddDateField = () => {
    if (!canvas) return;
    
    // Update UI state
    setIsDrawMode(false);
    setSelectedTool('date');
    setSelectedShape(null);

    // Create a placeholder for date (could be enhanced with custom date picker)
    const dateText = new IText('DD/MM/YYYY', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontFamily: 'Arial',
      fontSize: 16,
      fill: penColor,
      stroke: penColor,
      strokeWidth: 0.5,
      originX: 'center' as const,
      originY: 'center' as const,
      editable: true,
      underline: true,
      selectable: true,
      evented: true
    });

    canvas.add(dateText);
    canvas.setActiveObject(dateText);
    canvas.bringObjectToFront(dateText);
    canvas.renderAll();
    saveCanvasState(canvas);
    updateUndoRedoState();
    setIsDirty(true);
  };

  // Add a checkbox to the canvas
  const handleAddCheckbox = (checked: boolean = false) => {
    if (!canvas) return;
    
    // Update UI state
    setIsDrawMode(false);
    setSelectedTool('checkbox');
    setSelectedShape(null);

    // Create checkbox (square + optional checkmark)
    const size = 20;
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;
    
    // Create the checkbox square
    const box = new Rect({
      width: size,
      height: size,
      fill: 'transparent',
      stroke: penColor,
      strokeWidth: 2,
      left: centerX,
      top: centerY,
      originX: 'center' as const,
      originY: 'center' as const,
      selectable: true,
      evented: true
    });

    // If checked, add checkmark
    if (checked) {
      // Create a proper checkmark with two separate lines
      // First line of the checkmark (top-left to middle)
      const checkmark1 = new Line([
        centerX - size/4, centerY,
        centerX, centerY + size/4
      ], {
        stroke: penColor,
        strokeWidth: 2,
        fill: 'transparent',
        originX: 'center' as const,
        originY: 'center' as const,
        selectable: true,
        evented: true
      });
      
      // Second line of the checkmark (middle to bottom-right)
      const checkmark2 = new Line([
        centerX, centerY + size/4,
        centerX + size/3, centerY - size/4
      ], {
        stroke: penColor,
        strokeWidth: 2,
        fill: 'transparent',
        originX: 'center' as const,
        originY: 'center' as const,
        selectable: true,
        evented: true
      });
      
      canvas.add(box);
      canvas.add(checkmark1);
      canvas.add(checkmark2);
      
      // Bring elements to front to ensure visibility
      canvas.bringObjectToFront(box);
      canvas.bringObjectToFront(checkmark1);
      canvas.bringObjectToFront(checkmark2);
      
      canvas.renderAll();
    } else {
      canvas.add(box);
      canvas.bringObjectToFront(box);
      canvas.setActiveObject(box);
      canvas.renderAll();
    }
    
    saveCanvasState(canvas);
    updateUndoRedoState();
    setIsDirty(true);
  };

  // Rotate selected object
  const handleRotate = (angle: number) => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      // Get current angle (or default to 0) and add the new angle
      const currentAngle = activeObject.angle || 0;
      activeObject.rotate(currentAngle + angle);
      canvas.renderAll();
      saveCanvasState(canvas);
      updateUndoRedoState();
      setIsDirty(true);
    }
  };

  // Apply a template to the canvas
  const handleApplyTemplate = (templateId: string, doctorName?: string) => {
    if (!canvas) return;
    
    console.log('Applying template:', templateId);
    const template = templates.find(t => t.id === templateId);
    if (template && template.renderTemplate) {
      setIsDrawMode(false);
      // Clear canvas before applying template
      canvas.getObjects().forEach(obj => canvas.remove(obj));
      
      // Apply the template
      template.renderTemplate(canvas, doctorName);
      
      // Ensure all objects are visible and at the front
      console.log('Template objects created:', canvas.getObjects().length);
      canvas.getObjects().forEach(obj => {
        obj.set({
          selectable: true,
          evented: true,
          opacity: 1
        });
        canvas.bringObjectToFront(obj);
      });
      
      canvas.renderAll();
      saveCanvasState(canvas);
      updateUndoRedoState();
      setIsDirty(true);
    }
  };

  // Handle canvas resizing
  const handleResizeCanvas = (width: number, height: number) => {
    if (canvas) {
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.renderAll();
      saveCanvasState(canvas);
      updateUndoRedoState();
    }
  };

  return {
    isDrawMode,
    penColor,
    brushSize,
    showGrid,
    canUndo: canUndoState,
    canRedo: canRedoState,
    isDirty,
    selectedTool,
    selectedShape,
    availableTemplates: templates,
    toggleDrawMode,
    clearCanvas,
    handleColorChange,
    handleBrushSizeChange,
    handleUndo,
    handleRedo,
    resetHistory,
    handleToggleGrid,
    handleAddShape,
    handleAddText,
    handleAddDateField,
    handleAddCheckbox,
    handleRotate,
    handleApplyTemplate,
    handleResizeCanvas,
    // Expose state setters for UI components
    setSelectedTool,
    setSelectedShape,
    setIsDrawMode
  };
};
