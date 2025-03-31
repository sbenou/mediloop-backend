
import { Canvas as FabricCanvas } from 'fabric';

// History system state
let canvasHistory: string[] = [];
let currentStateIndex = -1;
let isRedoing = false;
const maxHistoryStates = 20; // Limit history to prevent memory issues

// Initialize the history system
export const setupUndoRedoHistory = (canvas: FabricCanvas) => {
  // Clear existing history
  canvasHistory = [];
  currentStateIndex = -1;
  isRedoing = false;
  
  // Save initial state
  saveCanvasState(canvas);
  
  // Setup event listeners for auto-saving state
  setupHistoryEventListeners(canvas);
};

// Setup canvas event listeners to track history
const setupHistoryEventListeners = (canvas: FabricCanvas) => {
  // Remove any existing listeners to prevent duplicates
  canvas.off('object:added');
  canvas.off('object:modified');
  canvas.off('object:removed');
  canvas.off('path:created');
  
  // Add new listeners
  const saveHistory = () => {
    if (!isRedoing) {
      saveCanvasState(canvas);
    }
  };
  
  // Listen for canvas changes to save history
  canvas.on('object:added', saveHistory);
  canvas.on('object:modified', saveHistory);
  canvas.on('object:removed', saveHistory);
  canvas.on('path:created', saveHistory);
};

// Save the current canvas state to history
export const saveCanvasState = (canvas: FabricCanvas) => {
  // If we're in the middle of the history stack, truncate future states
  if (currentStateIndex < canvasHistory.length - 1 && !isRedoing) {
    canvasHistory = canvasHistory.slice(0, currentStateIndex + 1);
  }
  
  // Save current state as JSON
  // Updated for Fabric.js v6 - no longer passing arguments to toJSON()
  const json = canvas.toJSON();
  const jsonString = JSON.stringify(json);
  
  // Add state to history
  canvasHistory.push(jsonString);
  currentStateIndex = canvasHistory.length - 1;
  
  // Limit history size
  if (canvasHistory.length > maxHistoryStates) {
    canvasHistory.shift();
    currentStateIndex--;
  }
  
  console.log(`Canvas state saved. History: ${currentStateIndex + 1}/${canvasHistory.length}`);
  return true;
};

// Undo the last action
export const undoCanvas = (canvas: FabricCanvas): boolean => {
  if (!canUndo()) return false;
  
  console.log(`Undoing to state: ${currentStateIndex - 1}`);
  currentStateIndex--;
  
  // Load previous state
  const previousState = canvasHistory[currentStateIndex];
  canvas.loadFromJSON(previousState, () => {
    canvas.renderAll();
  });
  
  return true;
};

// Redo the last undone action
export const redoCanvas = (canvas: FabricCanvas): boolean => {
  if (!canRedo()) return false;
  
  console.log(`Redoing to state: ${currentStateIndex + 1}`);
  currentStateIndex++;
  
  isRedoing = true;
  
  // Load next state
  const nextState = canvasHistory[currentStateIndex];
  canvas.loadFromJSON(nextState, () => {
    canvas.renderAll();
    isRedoing = false;
  });
  
  return true;
};

// Clear history
export const clearHistory = () => {
  canvasHistory = [];
  currentStateIndex = -1;
};

// Check if undo is available
export const canUndo = (): boolean => {
  return currentStateIndex > 0;
};

// Check if redo is available
export const canRedo = (): boolean => {
  return currentStateIndex < canvasHistory.length - 1;
};
