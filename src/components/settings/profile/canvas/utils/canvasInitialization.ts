
import { Canvas as FabricCanvas, PencilBrush } from "fabric";
import { saveCanvasState, setupUndoRedoHistory } from "./canvasHistory";

// Initialize a fabric canvas with white background
export const initializeCanvas = (container: HTMLDivElement, width?: number, height?: number): FabricCanvas => {
  // Create a canvas element
  const canvasElement = document.createElement('canvas');
  container.innerHTML = ''; // Clear any existing content
  container.appendChild(canvasElement);
  
  // Set canvas dimensions to match container or use custom dimensions
  const canvasWidth = width || container.clientWidth;
  const canvasHeight = height || container.clientHeight;
  canvasElement.width = canvasWidth;
  canvasElement.height = canvasHeight;
  
  // Initialize fabric canvas with explicitly set white background
  const canvas = new FabricCanvas(canvasElement, {
    backgroundColor: '#ffffff',
    isDrawingMode: false,
  });
  
  // Apply white background immediately
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  
  // Set up drawing brush
  canvas.freeDrawingBrush = new PencilBrush(canvas);
  canvas.freeDrawingBrush.color = '#000000';
  canvas.freeDrawingBrush.width = 3;
  
  // Set up history for undo/redo functionality
  setupUndoRedoHistory(canvas);
  
  return canvas;
};

// Ensure white background on canvas through event listeners - simplified to prevent recursion
export const ensureWhiteBackground = (canvas: FabricCanvas | null) => {
  if (!canvas) return;
  
  // Force white background immediately
  canvas.backgroundColor = '#ffffff';
  
  // A single render is enough
  canvas.renderAll();
  
  // Add safer event handlers that don't cause recursion
  const onObjectChange = () => {
    if (canvas.backgroundColor !== '#ffffff') {
      canvas.backgroundColor = '#ffffff';
      canvas.__renderAll(); // Use the internal method to avoid triggering events
    }
  };
  
  // Apply only essential event handlers
  canvas.on('object:added', onObjectChange);
  canvas.on('object:modified', onObjectChange);
  canvas.on('path:created', onObjectChange);
};

// Clean up canvas event listeners
export const cleanupCanvasListeners = (canvas: FabricCanvas | null) => {
  if (!canvas) return;
  
  canvas.off('object:added');
  canvas.off('object:modified');
  canvas.off('path:created');
};

// Resize canvas dimensions
export const resizeCanvas = (canvas: FabricCanvas, width: number, height: number) => {
  if (!canvas) return;
  
  // Save the current state before resizing
  const originalWidth = canvas.getWidth();
  const originalHeight = canvas.getHeight();
  const scaleFactor = Math.min(width / originalWidth, height / originalHeight);
  
  // Resize the canvas
  canvas.setDimensions({ width, height });
  
  // Ensure white background after resizing
  canvas.backgroundColor = '#ffffff';
  
  // Scale objects if needed
  if (scaleFactor !== 1) {
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      const scaleX = obj.scaleX || 1;
      const scaleY = obj.scaleY || 1;
      const left = obj.left || 0;
      const top = obj.top || 0;
      
      obj.scaleX = scaleX * scaleFactor;
      obj.scaleY = scaleY * scaleFactor;
      obj.left = left * (width / originalWidth);
      obj.top = top * (height / originalHeight);
      obj.setCoords();
    });
  }
  
  canvas.renderAll();
  saveCanvasState(canvas);
};
