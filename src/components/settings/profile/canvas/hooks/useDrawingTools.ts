
import { useState, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';

export interface UseDrawingToolsProps {
  canvas: FabricCanvas | null;
}

export const useDrawingTools = ({ canvas }: UseDrawingToolsProps) => {
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [selectedTool, setSelectedTool] = useState<'draw' | 'select' | 'shape' | 'text' | 'date' | 'checkbox'>('draw');
  const [selectedShape, setSelectedShape] = useState<'circle' | 'rectangle' | 'line' | null>(null);

  // Ensure brush settings are properly applied whenever relevant props change
  useEffect(() => {
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = penColor;
      canvas.freeDrawingBrush.width = brushSize;
      
      // Make sure objects created are visible and interactive
      canvas.freeDrawingBrush.shadow = null;
      canvas.freeDrawingBrush.strokeLineCap = 'round';
      canvas.freeDrawingBrush.strokeLineJoin = 'round';

      // Force a render to ensure settings are applied
      canvas.renderAll();
    }
  }, [canvas, penColor, brushSize]);

  // Apply drawing mode state when it changes
  useEffect(() => {
    if (canvas) {
      canvas.isDrawingMode = isDrawMode;
      if (isDrawMode && canvas.freeDrawingBrush) {
        // Reapply brush settings when entering drawing mode
        canvas.freeDrawingBrush.color = penColor;
        canvas.freeDrawingBrush.width = brushSize;
      }
      canvas.renderAll();
    }
  }, [canvas, isDrawMode, penColor, brushSize]);

  // Toggle drawing mode
  const toggleDrawMode = () => {
    if (!canvas) return;
    
    const newMode = !isDrawMode;
    setIsDrawMode(newMode);
    
    canvas.isDrawingMode = newMode;
    if (newMode) {
      // Ensure brush settings are applied when entering draw mode
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = penColor;
        canvas.freeDrawingBrush.width = brushSize;
      }
      setSelectedTool('draw');
      
      // Force a render to ensure the drawing mode takes effect
      canvas.renderAll();
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
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
      // Force a render after changing brush color
      canvas.renderAll();
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
    if (canvas && canvas.freeDrawingBrush) {
      changeBrushSizeUtil(canvas, size);
      // Force a render after changing brush size
      canvas.renderAll();
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
  // Force a render after changing brush size
  canvas.renderAll();
};
