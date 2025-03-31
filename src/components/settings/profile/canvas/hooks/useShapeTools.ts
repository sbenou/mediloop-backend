
import { Canvas as FabricCanvas } from 'fabric';
import { 
  addCircle as addCircleUtil,
  addRectangle as addRectangleUtil,
  addText as addTextUtil,
  addLine as addLineUtil,
  addDateField as addDateFieldUtil,
  addCheckbox as addCheckboxUtil,
  rotateObject as rotateObjectUtil
} from '../utils';

export interface UseShapeToolsProps {
  canvas: FabricCanvas | null;
  penColor: string;
  setSelectedTool: (tool: 'draw' | 'select' | 'shape' | 'text' | 'date' | 'checkbox') => void;
  setSelectedShape: (shape: 'circle' | 'rectangle' | 'line' | null) => void;
  setIsDrawMode: (isDrawing: boolean) => void;
}

export const useShapeTools = ({ 
  canvas, 
  penColor, 
  setSelectedTool, 
  setSelectedShape,
  setIsDrawMode
}: UseShapeToolsProps) => {
  // Clear the canvas
  const clearCanvas = () => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    }
  };

  // Add a shape to the canvas
  const handleAddShape = (shape: 'circle' | 'rectangle' | 'line') => {
    if (!canvas) return;
    
    setSelectedShape(shape);
    setSelectedTool('shape');
    
    // Force drawing mode off when adding shapes
    if (canvas.isDrawingMode) {
      canvas.isDrawingMode = false;
      setIsDrawMode(false);
    }
    
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
    
    // Ensure the canvas has focus for manipulation
    const canvasEl = canvas.getElement();
    if (canvasEl) {
      canvasEl.focus();
    }
  };

  // Add text to the canvas
  const handleAddText = () => {
    if (!canvas) return;
    
    setSelectedTool('text');
    
    // Force drawing mode off when adding text
    if (canvas.isDrawingMode) {
      canvas.isDrawingMode = false;
      setIsDrawMode(false);
    }
    
    addTextUtil(canvas, 'Text', penColor);
    
    // Ensure the canvas has focus for manipulation
    const canvasEl = canvas.getElement();
    if (canvasEl) {
      canvasEl.focus();
    }
  };

  // Add date field to the canvas
  const handleAddDateField = () => {
    if (!canvas) return;
    
    setSelectedTool('date');
    
    // Force drawing mode off when adding date field
    if (canvas.isDrawingMode) {
      canvas.isDrawingMode = false;
      setIsDrawMode(false);
    }
    
    addDateFieldUtil(canvas, penColor);
    
    // Ensure the canvas has focus for manipulation
    const canvasEl = canvas.getElement();
    if (canvasEl) {
      canvasEl.focus();
    }
  };

  // Add checkbox to the canvas
  const handleAddCheckbox = (checked: boolean = false) => {
    if (!canvas) return;
    
    setSelectedTool('checkbox');
    
    // Force drawing mode off when adding checkbox
    if (canvas.isDrawingMode) {
      canvas.isDrawingMode = false;
      setIsDrawMode(false);
    }
    
    addCheckboxUtil(canvas, penColor, checked);
    
    // Ensure the canvas has focus for manipulation
    const canvasEl = canvas.getElement();
    if (canvasEl) {
      canvasEl.focus();
    }
  };

  // Rotate selected object
  const handleRotate = (angle: number) => {
    if (canvas) {
      rotateObjectUtil(canvas, angle);
    }
  };

  return {
    clearCanvas,
    handleAddShape,
    handleAddText,
    handleAddDateField,
    handleAddCheckbox,
    handleRotate
  };
};
