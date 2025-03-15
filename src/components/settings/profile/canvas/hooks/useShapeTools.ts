
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

  // Add date field to the canvas
  const handleAddDateField = () => {
    if (!canvas) return;
    
    setSelectedTool('date');
    canvas.isDrawingMode = false;
    setIsDrawMode(false);
    
    addDateFieldUtil(canvas, penColor);
  };

  // Add checkbox to the canvas
  const handleAddCheckbox = (checked: boolean = false) => {
    if (!canvas) return;
    
    setSelectedTool('checkbox');
    canvas.isDrawingMode = false;
    setIsDrawMode(false);
    
    addCheckboxUtil(canvas, penColor, checked);
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
