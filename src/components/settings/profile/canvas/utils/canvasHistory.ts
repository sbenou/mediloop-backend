
import { Canvas as FabricCanvas } from 'fabric';

// History system state
let canvasHistory: string[] = [];
let currentStateIndex = -1;
let isRedoing = false;
const maxHistoryStates = 20; // Limit history to prevent memory issues

// Initialize the history system
export const setupUndoRedoHistory = (canvas: FabricCanvas) => {
  // Clear existing history
  console.log("Setting up undo/redo history");
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
  
  console.log("Setting up path:created listener");
  
  // Add new listeners
  const saveHistory = () => {
    if (!isRedoing) {
      console.log("Auto-saving canvas state after change");
      saveCanvasState(canvas);
    }
  };
  
  // Throttle the save function to prevent too many history states
  const throttledSave = throttle(saveHistory, 250);
  
  // Listen for canvas changes to save history
  canvas.on('object:added', () => {
    console.log("Object added to canvas - will save state");
    throttledSave();
  });
  
  canvas.on('object:modified', () => {
    console.log("Object modified on canvas - will save state");
    throttledSave();
  });
  
  canvas.on('object:removed', () => {
    console.log("Object removed from canvas - will save state");
    throttledSave();
  });
  
  canvas.on('path:created', () => {
    console.log("Path created on canvas - will save state");
    throttledSave();
  });
};

// Save the current canvas state to history
export const saveCanvasState = (canvas: FabricCanvas) => {
  try {
    // If we're in the middle of the history stack, truncate future states
    if (currentStateIndex < canvasHistory.length - 1 && !isRedoing) {
      canvasHistory = canvasHistory.slice(0, currentStateIndex + 1);
    }
    
    // Make sure no object is currently selected when saving state
    canvas.discardActiveObject();
    
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
    
    console.log(`📌 Canvas state saved. History length: ${canvasHistory.length}, current index: ${currentStateIndex}`);
    return true;
  } catch (error) {
    console.error("Error saving canvas state:", error);
    return false;
  }
};

// Undo the last action
export const undoCanvas = (canvas: FabricCanvas): boolean => {
  if (!canUndo()) return false;
  
  console.log(`Undoing to state: ${currentStateIndex - 1}`);
  currentStateIndex--;
  
  try {
    // Load previous state
    const previousState = canvasHistory[currentStateIndex];
    canvas.loadFromJSON(previousState, () => {
      console.log("Previous state loaded");
      canvas.renderAll();
    });
    
    return true;
  } catch (error) {
    console.error("Error during undo:", error);
    return false;
  }
};

// Redo the last undone action
export const redoCanvas = (canvas: FabricCanvas): boolean => {
  if (!canRedo()) return false;
  
  console.log(`Redoing to state: ${currentStateIndex + 1}`);
  currentStateIndex++;
  
  isRedoing = true;
  
  try {
    // Load next state
    const nextState = canvasHistory[currentStateIndex];
    canvas.loadFromJSON(nextState, () => {
      console.log("Next state loaded");
      canvas.renderAll();
      isRedoing = false;
    });
    
    return true;
  } catch (error) {
    console.error("Error during redo:", error);
    isRedoing = false;
    return false;
  }
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

// Throttle function to limit frequency of function calls
function throttle(fn: Function, wait: number) {
  let time = Date.now();
  return function(...args: any[]) {
    if ((time + wait - Date.now()) < 0) {
      fn(...args);
      time = Date.now();
    }
  };
}
