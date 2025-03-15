
import { useState } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { StampTemplate } from '../utils';
import { useDrawingTools } from './useDrawingTools';
import { useCanvasHistory } from './useCanvasHistory';
import { useGridControl } from './useGridControl';
import { useTemplateTools } from './useTemplateTools';
import { useCanvasSize } from './useCanvasSize';
import { useShapeTools } from './useShapeTools';

export interface UseCanvasToolsProps {
  canvas: FabricCanvas | null;
  templates: StampTemplate[];
}

export const useCanvasTools = ({ canvas, templates }: UseCanvasToolsProps) => {
  // Use the drawing tools hook
  const {
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
  } = useDrawingTools({ canvas });

  // Use the canvas history hook
  const {
    canUndo,
    canRedo,
    handleUndo,
    handleRedo
  } = useCanvasHistory({ canvas });

  // Use the grid control hook
  const {
    showGrid,
    handleToggleGrid
  } = useGridControl({ canvas });

  // Use the template tools hook
  const {
    availableTemplates,
    handleApplyTemplate
  } = useTemplateTools({ canvas, templates });

  // Use the canvas size hook
  const {
    handleResizeCanvas
  } = useCanvasSize({ canvas });

  // Use the shape tools hook
  const {
    clearCanvas,
    handleAddShape,
    handleAddText,
    handleAddDateField,
    handleAddCheckbox,
    handleRotate
  } = useShapeTools({ 
    canvas, 
    penColor, 
    setSelectedTool, 
    setSelectedShape, 
    setIsDrawMode: (isDrawing: boolean) => isDrawMode !== isDrawing && toggleDrawMode() 
  });

  return {
    isDrawMode,
    penColor,
    brushSize,
    showGrid,
    canUndo,
    canRedo,
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
    handleAddDateField,
    handleAddCheckbox,
    handleRotate,
    handleApplyTemplate,
    handleResizeCanvas
  };
};
