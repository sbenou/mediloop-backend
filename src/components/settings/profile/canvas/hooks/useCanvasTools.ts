
import { useState, useEffect } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, Line, IText } from 'fabric';
import { StampTemplate } from '../utils';
import { saveCanvasState } from '../utils/canvasHistory';

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

  // Update drawing brush when canvas or brush settings change
  useEffect(() => {
    if (!canvas) return;

    canvas.isDrawingMode = isDrawMode;
    canvas.selection = !isDrawMode;

    if (isDrawMode && canvas.freeDrawingBrush) {
      // Use existing brush if possible, or create new one
      let brush = canvas.freeDrawingBrush;
      if (!(brush instanceof PencilBrush)) {
        brush = new PencilBrush(canvas);
        canvas.freeDrawingBrush = brush;
      }
      
      brush.color = penColor;
      brush.width = brushSize;
    }

    canvas.renderAll();
  }, [canvas, isDrawMode, penColor, brushSize]);

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
    saveCanvasState(canvas);
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
    const objects = canvas.getObjects();
    if (objects.length > 0) {
      const lastObject = objects[objects.length - 1];
      canvas.remove(lastObject);
      canvas.renderAll();
      saveCanvasState(canvas);
    }
  };

  // Currently a placeholder as we need to implement a history stack
  const handleRedo = () => {
    // Implementation requires history stack
  };

  // Toggle grid visibility
  const handleToggleGrid = () => {
    setShowGrid(prev => !prev);
    // Grid implementation would go here
  };

  // Add a shape to the canvas
  const handleAddShape = (shape: 'circle' | 'rectangle' | 'line') => {
    if (!canvas) return;
    
    // Center of canvas
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;

    // Update UI state
    setIsDrawMode(false);
    setSelectedTool('shape');
    setSelectedShape(shape);
    
    // Create and add shape based on type
    let shapeObject;
    
    switch (shape) {
      case 'circle':
        shapeObject = new Circle({
          radius: 30,
          fill: 'transparent',
          stroke: penColor,
          strokeWidth: 2,
          left: centerX,
          top: centerY,
          originX: 'center',
          originY: 'center'
        });
        break;
        
      case 'rectangle':
        shapeObject = new Rect({
          width: 60,
          height: 60,
          fill: 'transparent',
          stroke: penColor,
          strokeWidth: 2,
          left: centerX,
          top: centerY,
          originX: 'center',
          originY: 'center'
        });
        break;
        
      case 'line':
        shapeObject = new Line([
          centerX - 40, centerY,
          centerX + 40, centerY
        ], {
          stroke: penColor,
          strokeWidth: 2,
          originX: 'center',
          originY: 'center'
        });
        break;
    }
    
    if (shapeObject) {
      canvas.add(shapeObject);
      canvas.setActiveObject(shapeObject);
      shapeObject.bringToFront?.(); // Ensure shape is visible on top
      canvas.renderAll();
      saveCanvasState(canvas);
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
      originX: 'center',
      originY: 'center',
      editable: true
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.bringToFront?.(); // Ensure text is visible on top
    text.enterEditing();
    text.selectAll();
    canvas.renderAll();
    saveCanvasState(canvas);
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
      originX: 'center',
      originY: 'center',
      editable: true,
      underline: true
    });

    canvas.add(dateText);
    canvas.setActiveObject(dateText);
    dateText.bringToFront?.(); // Ensure date field is visible on top
    canvas.renderAll();
    saveCanvasState(canvas);
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
      originX: 'center',
      originY: 'center'
    });

    // If checked, add checkmark
    if (checked) {
      // Fix: Create a proper checkmark with two separate lines
      // First line of the checkmark (top-left to middle)
      const checkmark1 = new Line([
        centerX - size/4, centerY,
        centerX, centerY + size/4
      ], {
        stroke: penColor,
        strokeWidth: 2,
        fill: 'transparent',
        originX: 'center',
        originY: 'center'
      });
      
      // Second line of the checkmark (middle to bottom-right)
      const checkmark2 = new Line([
        centerX, centerY + size/4,
        centerX + size/3, centerY - size/4
      ], {
        stroke: penColor,
        strokeWidth: 2,
        fill: 'transparent',
        originX: 'center',
        originY: 'center'
      });
      
      canvas.add(box);
      canvas.add(checkmark1);
      canvas.add(checkmark2);
      
      // Bring elements to front to ensure visibility
      box.bringToFront?.();
      checkmark1.bringToFront?.();
      checkmark2.bringToFront?.();
      
      canvas.renderAll();
    } else {
      canvas.add(box);
      box.bringToFront?.(); // Ensure checkbox is visible on top
      canvas.setActiveObject(box);
      canvas.renderAll();
    }
    
    saveCanvasState(canvas);
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
    }
  };

  // Apply a template to the canvas
  const handleApplyTemplate = (templateId: string, doctorName?: string) => {
    if (!canvas) return;
    
    const template = templates.find(t => t.id === templateId);
    if (template && template.renderTemplate) {
      setIsDrawMode(false);
      template.renderTemplate(canvas, doctorName);
      
      // Ensure all template objects are visible
      canvas.getObjects().forEach(obj => {
        obj.bringToFront?.();
      });
      
      canvas.renderAll();
      saveCanvasState(canvas);
    }
  };

  // Handle canvas resizing
  const handleResizeCanvas = (width: number, height: number) => {
    if (canvas) {
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.renderAll();
      saveCanvasState(canvas);
    }
  };

  return {
    isDrawMode,
    penColor,
    brushSize,
    showGrid,
    canUndo: canvas ? canvas.getObjects().length > 0 : false,
    canRedo: false, // Will be true when redo is implemented
    selectedTool,
    selectedShape,
    availableTemplates: templates,
    toggleDrawMode,
    clearCanvas,
    handleColorChange,
    handleBrushSizeChange,
    handleUndo,
    handleRedo,
    handleToggleGrid,
    handleAddShape,
    handleAddText,
    handleAddDateField,
    handleAddCheckbox,
    handleRotate,
    handleApplyTemplate,
    handleResizeCanvas
  };
};
