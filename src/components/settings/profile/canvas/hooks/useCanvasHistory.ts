
import { useState, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { 
  canUndo as canUndoUtil, 
  canRedo as canRedoUtil,
  undoCanvas as undoCanvasUtil,
  redoCanvas as redoCanvasUtil,
  setupUndoRedoHistory
} from '../utils/canvasHistory';

export interface UseCanvasHistoryProps {
  canvas: FabricCanvas | null;
}

export const useCanvasHistory = ({ canvas }: UseCanvasHistoryProps) => {
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);

  // Initialize history system
  useEffect(() => {
    if (!canvas) return;
    
    // Set up history tracking
    setupUndoRedoHistory(canvas);
    
    // Update state initially
    updateUndoRedoState();
    
    // Setup listeners for all canvas changes that should update history state
    const updateHistory = () => {
      updateUndoRedoState();
    };
    
    canvas.on('object:added', updateHistory);
    canvas.on('object:modified', updateHistory);
    canvas.on('object:removed', updateHistory);
    canvas.on('path:created', updateHistory);
    
    return () => {
      canvas.off('object:added', updateHistory);
      canvas.off('object:modified', updateHistory);
      canvas.off('object:removed', updateHistory);
      canvas.off('path:created', updateHistory);
    };
  }, [canvas]);

  // Update undo/redo state
  const updateUndoRedoState = () => {
    setCanUndoState(canUndoUtil());
    setCanRedoState(canRedoUtil());
  };

  // Undo last action
  const handleUndo = () => {
    if (canvas) {
      const success = undoCanvasUtil(canvas);
      if (success) {
        updateUndoRedoState();
      }
    }
  };

  // Redo last undone action
  const handleRedo = () => {
    if (canvas) {
      const success = redoCanvasUtil(canvas);
      if (success) {
        updateUndoRedoState();
      }
    }
  };

  return {
    canUndo: canUndoState,
    canRedo: canRedoState,
    handleUndo,
    handleRedo
  };
};
