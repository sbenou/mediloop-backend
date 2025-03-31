import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  useCanvasInitialization, 
  useCanvasTools, 
  useImageManagement, 
  useLayerManagement,
  useCanvasSize
} from './hooks';
import { useUnsavedChangesWarning } from './hooks/useUnsavedChangesWarning';
import { stampTemplates } from './utils';

interface UseCanvasManagerProps {
  imageUrl: string | null;
}

export const useCanvasManager = ({ imageUrl }: UseCanvasManagerProps) => {
  // Track if we have warned the user about unsaved changes
  const [hasShownWarning, setHasShownWarning] = useState(false);

  // Canvas initialization
  const {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight
  } = useCanvasInitialization({ imageUrl });

  // Canvas tools with drawing, shapes, and text functionality
  const {
    isDrawMode,
    penColor,
    brushSize,
    showGrid,
    canUndo,
    canRedo,
    isDirty,
    selectedTool,
    selectedShape,
    availableTemplates,
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
    setSelectedTool,
    setSelectedShape,
    setIsDrawMode
  } = useCanvasTools({ 
    canvas, 
    templates: stampTemplates 
  });

  // Image management for filters and export
  const {
    selectedImage,
    filterOptions,
    handleApplyFilter,
    handleExport
  } = useImageManagement({ canvas });

  // Layer management for object ordering
  const {
    handleBringForward,
    handleSendBackward,
    handleBringToFront,
    handleSendToBack
  } = useLayerManagement({ canvas });

  // Handle save action that will be passed to the unsaved changes warning
  const handleSave = async () => {
    console.log('Saving canvas...');
    // This will be implemented by the component that uses this hook
    // But we mark the canvas as clean
    resetHistory();
    setHasShownWarning(false);
    return Promise.resolve();
  };

  // Handle discard action
  const handleDiscard = () => {
    console.log('Discarding changes...');
    resetHistory();
    setHasShownWarning(false);
  };

  // Setup unsaved changes warning
  const { 
    showWarningToast, 
    showWarningModal, 
    showModal, 
    handleSaveAndLeave, 
    handleDiscardAndLeave, 
    handleCancelNavigation 
  } = useUnsavedChangesWarning({
    isDirty,
    onSave: handleSave,
    onDiscard: handleDiscard
  });

  // Show warning when navigating away with unsaved changes
  useEffect(() => {
    if (isDirty && !hasShownWarning) {
      // We'll trigger this when component is about to unmount
      return () => {
        if (isDirty && !hasShownWarning) {
          showWarningToast();
          setHasShownWarning(true);
        }
      };
    }
  }, [isDirty, hasShownWarning, showWarningToast]);

  return {
    canvasContainerRef,
    canvas,
    isDrawMode,
    penColor,
    brushSize,
    showGrid,
    canUndo,
    canRedo,
    isDirty,
    selectedTool,
    selectedShape,
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
    showWarningToast,
    showWarningModal,
    showModal,
    handleSaveAndLeave,
    handleDiscardAndLeave,
    handleCancelNavigation,
    // State setters for UI
    setSelectedTool,
    setSelectedShape,
    setIsDrawMode
  };
};
