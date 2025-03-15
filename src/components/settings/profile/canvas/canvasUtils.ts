import { Canvas as FabricCanvas, PencilBrush, Image as FabricImage, Circle, Rect, Text, Line } from "fabric";

// Initialize a fabric canvas with white background
export const initializeCanvas = (container: HTMLDivElement): FabricCanvas => {
  // Create a canvas element
  const canvasElement = document.createElement('canvas');
  container.innerHTML = ''; // Clear any existing content
  container.appendChild(canvasElement);
  
  // Set canvas dimensions to match container
  canvasElement.width = container.clientWidth;
  canvasElement.height = container.clientHeight;
  
  // Initialize fabric canvas with explicitly set white background
  const canvas = new FabricCanvas(canvasElement, {
    backgroundColor: '#ffffff',
    isDrawingMode: false,
  });
  
  // Set up drawing brush
  canvas.freeDrawingBrush = new PencilBrush(canvas);
  canvas.freeDrawingBrush.color = '#000000';
  canvas.freeDrawingBrush.width = 3;
  
  // Ensure background is white
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  
  // Set up history for undo/redo functionality
  setupUndoRedoHistory(canvas);
  
  return canvas;
};

// Load an image to a canvas
export const loadImageToCanvas = (canvas: FabricCanvas, url: string) => {
  // Set background to white immediately before loading image
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  
  // Use the correct API for Fabric.js v6
  FabricImage.fromURL(url, {
    // Options object
    crossOrigin: 'anonymous',
  }).then((img) => {
    canvas.clear();
    
    // Explicitly set background to white before adding the image
    canvas.backgroundColor = '#ffffff';
    
    // Scale image to fit canvas while maintaining aspect ratio
    const canvasWidth = canvas.getWidth() || 290;
    const canvasHeight = canvas.getHeight() || 200;
    
    const imgWidth = img.width || 100;
    const imgHeight = img.height || 100;
    
    const scale = Math.min(
      canvasWidth / imgWidth,
      canvasHeight / imgHeight
    );
    
    img.scale(scale);
    
    // Center the image on the canvas
    img.set({
      left: (canvasWidth - (imgWidth * scale)) / 2,
      top: (canvasHeight - (imgHeight * scale)) / 2
    });
    
    canvas.add(img);
    
    // Ensure background is white after adding image
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    
    // Save initial state for undo history
    saveCanvasState(canvas);
  }).catch(err => {
    console.error("Error loading image:", err);
    // Even on error, ensure canvas is white
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
  });
};

// Setup undo/redo functionality
interface CanvasHistoryState {
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

// Create a circle on canvas
export const addCircle = (canvas: FabricCanvas, color: string) => {
  if (!canvas) return;
  
  const circle = new Circle({
    radius: 30,
    fill: 'transparent',
    stroke: color,
    strokeWidth: 2,
    left: canvas.getWidth() / 2 - 30,
    top: canvas.getHeight() / 2 - 30
  });
  
  canvas.add(circle);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Create a rectangle on canvas
export const addRectangle = (canvas: FabricCanvas, color: string) => {
  if (!canvas) return;
  
  const rect = new Rect({
    width: 60,
    height: 60,
    fill: 'transparent',
    stroke: color,
    strokeWidth: 2,
    left: canvas.getWidth() / 2 - 30,
    top: canvas.getHeight() / 2 - 30
  });
  
  canvas.add(rect);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Add text to canvas
export const addText = (canvas: FabricCanvas, text: string, color: string) => {
  if (!canvas) return;
  
  const textObj = new Text(text || 'Text', {
    left: canvas.getWidth() / 2 - 25,
    top: canvas.getHeight() / 2 - 10,
    fontSize: 20,
    fill: color
  });
  
  canvas.add(textObj);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Add a line to canvas
export const addLine = (canvas: FabricCanvas, color: string) => {
  if (!canvas) return;
  
  const line = new Line([
    canvas.getWidth() / 2 - 40, 
    canvas.getHeight() / 2,
    canvas.getWidth() / 2 + 40, 
    canvas.getHeight() / 2
  ], {
    stroke: color,
    strokeWidth: 2
  });
  
  canvas.add(line);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Change brush size
export const changeBrushSize = (canvas: FabricCanvas, size: number) => {
  if (!canvas || !canvas.freeDrawingBrush) return;
  
  canvas.freeDrawingBrush.width = size;
};

// Toggle grid display
export const toggleGrid = (canvas: FabricCanvas, showGrid: boolean, gridSize: number = 20) => {
  if (!canvas) return;
  
  // Remove any existing grid first
  const existingGrid = canvas.getObjects().filter(obj => {
    return obj.get('isGrid') === true;
  });
  
  existingGrid.forEach(obj => canvas.remove(obj));
  
  if (!showGrid) {
    canvas.renderAll();
    return;
  }
  
  const width = canvas.getWidth();
  const height = canvas.getHeight();
  
  // Create vertical lines
  for (let i = gridSize; i < width; i += gridSize) {
    const line = new Line([i, 0, i, height], {
      stroke: '#cccccc',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      isGrid: true
    });
    canvas.add(line);
    // Use lower-level API to move grid lines to back
    line.moveTo(0);
  }
  
  // Create horizontal lines
  for (let i = gridSize; i < height; i += gridSize) {
    const line = new Line([0, i, width, i], {
      stroke: '#cccccc',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      isGrid: true
    });
    canvas.add(line);
    // Use lower-level API to move grid lines to back
    line.moveTo(0);
  }
  
  canvas.renderAll();
};

// Rotate selected object
export const rotateObject = (canvas: FabricCanvas, angle: number) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  const currentAngle = activeObject.angle || 0;
  activeObject.rotate(currentAngle + angle);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Ensure white background on canvas through event listeners
export const ensureWhiteBackground = (canvas: FabricCanvas | null) => {
  if (!canvas) return;
  
  // Set initial background color
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  
  // Force rendering with white background
  const forceWhiteBackground = () => {
    if (canvas.backgroundColor !== '#ffffff') {
      console.log('Enforcing white background on canvas');
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    }
  };
  
  // Apply on all relevant events
  canvas.on('mouse:up', forceWhiteBackground);
  canvas.on('mouse:down', forceWhiteBackground);
  canvas.on('mouse:move', forceWhiteBackground);
  canvas.on('path:created', forceWhiteBackground);
  canvas.on('object:added', forceWhiteBackground);
  canvas.on('object:modified', forceWhiteBackground);
  canvas.on('object:removed', forceWhiteBackground);
  canvas.on('before:render', forceWhiteBackground);
  canvas.on('after:render', forceWhiteBackground);
  
  // Also apply every time drawing mode changes
  canvas.on('selection:created', forceWhiteBackground);
  canvas.on('selection:updated', forceWhiteBackground);
  canvas.on('selection:cleared', forceWhiteBackground);
};

// Clean up canvas event listeners
export const cleanupCanvasListeners = (canvas: FabricCanvas | null) => {
  if (!canvas) return;
  
  canvas.off('mouse:up');
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('path:created');
  canvas.off('object:added');
  canvas.off('object:modified');
  canvas.off('object:removed');
  canvas.off('before:render');
  canvas.off('after:render');
  canvas.off('selection:created');
  canvas.off('selection:updated');
  canvas.off('selection:cleared');
};
