
import { Canvas as FabricCanvas } from "fabric";

// Setup undo/redo functionality
export interface CanvasHistoryState {
  objects: string; // JSON string of canvas objects
  background: string; // Background color
}

// Add history functionality to the canvas
let canvasHistory: CanvasHistoryState[] = [];
let canvasHistoryIndex = -1;
const maxHistorySteps = 30; // Limit history to prevent memory issues

export const setupUndoRedoHistory = (canvas: FabricCanvas) => {
  // Clear history when setting up a new canvas
  canvasHistory = [];
  canvasHistoryIndex = -1;
  
  // Save initial state (empty canvas)
  saveCanvasState(canvas);
  
  // Set up event listeners for history
  canvas.on('object:added', () => saveCanvasState(canvas));
  canvas.on('object:modified', () => saveCanvasState(canvas));
  canvas.on('object:removed', () => saveCanvasState(canvas));
  canvas.on('path:created', () => saveCanvasState(canvas));
};

export const saveCanvasState = (canvas: FabricCanvas) => {
  // Limit history size by removing oldest entries if needed
  if (canvasHistoryIndex >= maxHistorySteps) {
    canvasHistory.shift(); // Remove oldest state
    canvasHistoryIndex--;
  }
  
  // If we're not at the end of the history (i.e., user has performed undo),
  // remove all future states as they are now invalid
  if (canvasHistoryIndex < canvasHistory.length - 1) {
    canvasHistory = canvasHistory.slice(0, canvasHistoryIndex + 1);
  }
  
  const newState: CanvasHistoryState = {
    objects: JSON.stringify(canvas.toJSON()),
    background: canvas.backgroundColor?.toString() || '#ffffff'
  };
  
  canvasHistory.push(newState);
  canvasHistoryIndex = canvasHistory.length - 1;
};

export const canUndo = (): boolean => {
  return canvasHistoryIndex > 0;
};

export const canRedo = (): boolean => {
  return canvasHistoryIndex < canvasHistory.length - 1;
};

export const undoCanvas = (canvas: FabricCanvas): boolean => {
  if (!canUndo()) return false;
  
  canvasHistoryIndex--;
  loadCanvasState(canvas, canvasHistoryIndex);
  return true;
};

export const redoCanvas = (canvas: FabricCanvas): boolean => {
  if (!canRedo()) return false;
  
  canvasHistoryIndex++;
  loadCanvasState(canvas, canvasHistoryIndex);
  return true;
};

const loadCanvasState = (canvas: FabricCanvas, index: number) => {
  if (index < 0 || index >= canvasHistory.length) return;
  
  const state = canvasHistory[index];
  
  canvas.clear();
  canvas.loadFromJSON(state.objects, () => {
    canvas.backgroundColor = state.background;
    canvas.renderAll();
  });
};
