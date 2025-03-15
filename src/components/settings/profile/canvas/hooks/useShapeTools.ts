
import { Canvas as FabricCanvas } from 'fabric';
import { 
  addCircle as addCircleUtil,
  addRectangle as addRectangleUtil,
  addText as addTextUtil,
  addLine as addLineUtil,
  rotateObject as rotateObjectUtil
} from '../utils';

export interface UseShapeToolsProps {
  canvas: FabricCanvas | null;
  penColor: string;
  setSelectedTool: (tool: 'draw' | 'select' | 'shape' | 'text') => void;
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
    handleRotate
  };
};
