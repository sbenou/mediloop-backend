
import { useState, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { 
  canUndo as canUndoUtil, 
  canRedo as canRedoUtil,
  undoCanvas as undoCanvasUtil,
  redoCanvas as redoCanvasUtil
} from '../utils';

export interface UseCanvasHistoryProps {
  canvas: FabricCanvas | null;
}

export const useCanvasHistory = ({ canvas }: UseCanvasHistoryProps) => {
  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);

  // Update undo/redo state
  useEffect(() => {
    const updateUndoRedoState = () => {
      setCanUndoState(canUndoUtil());
      setCanRedoState(canRedoUtil());
    };
    
    // Check initially and whenever the canvas changes
    updateUndoRedoState();
    
    // Poll for changes every 500ms as a fallback
    const interval = setInterval(updateUndoRedoState, 500);
    return () => clearInterval(interval);
  }, [canvas]);

  // Undo last action
  const handleUndo = () => {
    if (canvas) {
      const success = undoCanvasUtil(canvas);
      if (success) {
        setCanUndoState(canUndoUtil());
        setCanRedoState(canRedoUtil());
      }
    }
  };

  // Redo last undone action
  const handleRedo = () => {
    if (canvas) {
      const success = redoCanvasUtil(canvas);
      if (success) {
        setCanUndoState(canUndoUtil());
        setCanRedoState(canRedoUtil());
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
