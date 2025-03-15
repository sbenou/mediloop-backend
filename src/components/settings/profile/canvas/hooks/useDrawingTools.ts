
import { useState } from 'react';
import { Canvas as FabricCanvas } from 'fabric';

export interface UseDrawingToolsProps {
  canvas: FabricCanvas | null;
}

export const useDrawingTools = ({ canvas }: UseDrawingToolsProps) => {
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [selectedTool, setSelectedTool] = useState<'draw' | 'select' | 'shape' | 'text'>('draw');
  const [selectedShape, setSelectedShape] = useState<'circle' | 'rectangle' | 'line' | null>(null);

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
    handleBrushSizeChange
  };
};

// Import this from utils but declare it here to avoid circular dependencies
const changeBrushSizeUtil = (canvas: FabricCanvas, size: number) => {
  if (!canvas || !canvas.freeDrawingBrush) return;
  
  canvas.freeDrawingBrush.width = size;
};
