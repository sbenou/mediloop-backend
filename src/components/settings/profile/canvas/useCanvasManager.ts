
import { useState } from 'react';
import { 
  useCanvasInitialization, 
  useCanvasTools, 
  useImageManagement, 
  useLayerManagement,
  useCanvasSize
} from './hooks';
import { stampTemplates } from './utils';

interface UseCanvasManagerProps {
  imageUrl: string | null;
}

export const useCanvasManager = ({ imageUrl }: UseCanvasManagerProps) => {
  // Canvas initialization
  const {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight
  } = useCanvasInitialization({ imageUrl });

  // Canvas tools
  const {
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
    handleResizeCanvas,
    // Get state setters
    setSelectedTool,
    setSelectedShape,
    setIsDrawMode
  } = useCanvasTools({ 
    canvas, 
    templates: stampTemplates 
  });

  // Image management
  const {
    selectedImage,
    filterOptions,
    handleApplyFilter,
    handleExport
  } = useImageManagement({ canvas });

  // Layer management
  const {
    handleBringForward,
    handleSendBackward,
    handleBringToFront,
    handleSendToBack
  } = useLayerManagement({ canvas });

  return {
    canvasContainerRef,
    canvas,
    isDrawMode,
    penColor,
    brushSize,
    showGrid,
    canUndo,
    canRedo,
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
    handleExport,
    handleAddDateField,
    handleAddCheckbox,
    // State setters for UI
    setSelectedTool,
    setSelectedShape,
    setIsDrawMode
  };
};
