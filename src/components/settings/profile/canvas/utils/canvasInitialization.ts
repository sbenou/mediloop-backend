
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
  
  // Force background to white immediately after initialization
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  
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

// Ensure white background on canvas through event listeners
export const ensureWhiteBackground = (canvas: FabricCanvas | null) => {
  if (!canvas) return;
  
  // Force white background immediately
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  
  // Force rendering with white background
  const forceWhiteBackground = () => {
    if (!canvas || canvas.backgroundColor !== '#ffffff') {
      console.log('Enforcing white background on canvas');
      if (canvas) {
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      }
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
  
  // Force white background once more after a short delay
  setTimeout(forceWhiteBackground, 100);
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
