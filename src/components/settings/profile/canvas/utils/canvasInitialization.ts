import { Canvas as FabricCanvas } from "fabric";
import { loadImageToCanvas } from "./canvasImageHandling";

// Initialize canvas and set up initial setup for drawing
export const initializeCanvas = (
  canvasContainer: HTMLDivElement, 
  imageUrl: string | null = null
): FabricCanvas => {
  // Find or create canvas element
  let canvasElement = canvasContainer.querySelector('canvas');
  
  if (!canvasElement) {
    canvasElement = document.createElement('canvas');
    canvasContainer.appendChild(canvasElement);
  }
  
  // Get container dimensions
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  
  // Initialize Fabric Canvas with container size
  const canvas = new FabricCanvas(canvasElement, {
    width: width,
    height: height,
    backgroundColor: '#ffffff', // Start with white background
    preserveObjectStacking: true,
    selection: true, // Enable selection
    renderOnAddRemove: true,
    isDrawingMode: false, // Start with drawing mode off
  });
  
  // Explicitly set canvas element width/height
  canvasElement.width = width;
  canvasElement.height = height;
  
  // Apply explicit white background
  ensureWhiteBackground(canvas);

  // Set up free drawing brush with default settings
  if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = '#000000';
    canvas.freeDrawingBrush.width = 3;
    canvas.freeDrawingBrush.shadow = null;
    canvas.freeDrawingBrush.strokeLineCap = 'round';
    canvas.freeDrawingBrush.strokeLineJoin = 'round';
    
    // Force render to apply brush settings
    canvas.renderAll();
  }

  // Set drawing cursor - using a dark pen cursor icon with better contrast
  canvas.freeDrawingCursor = 'url(data:image/png;base64,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), auto';
 
  // If an image URL is provided, load it to the canvas
  if (imageUrl) {
    loadImageToCanvas(canvas, imageUrl);
  } else {
    // Otherwise, render a blank white canvas
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
  }

  // Setup window resize handler
  const handleResize = () => {
    // Only resize if container dimensions changed
    if (
      canvasContainer.clientWidth !== canvas.getWidth() ||
      canvasContainer.clientHeight !== canvas.getHeight()
    ) {
      canvas.setDimensions({
        width: canvasContainer.clientWidth,
        height: canvasContainer.clientHeight
      });
      
      // Re-ensure white background after resize
      ensureWhiteBackground(canvas);
    }
  };

  window.addEventListener('resize', handleResize);
  
  // Return cleanup function
  const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    canvas.dispose();
  };
  
  // One more explicit white background enforcement after short delay
  setTimeout(() => ensureWhiteBackground(canvas), 100);
  
  return canvas;
};

// Helper function to ensure canvas has white background
export const ensureWhiteBackground = (canvas: FabricCanvas) => {
  // Set explicit white background
  canvas.backgroundColor = '#ffffff';
  
  // Render the canvas
  canvas.renderAll();
  
  // For older browsers, also set the lower-level canvas background
  const ctx = canvas.getElement().getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.getWidth(), canvas.getHeight());
  }
};

// Cleanup function for canvas event listeners
export const cleanupCanvasListeners = (canvas: FabricCanvas) => {
  // Remove all event listeners attached to the canvas
  canvas.dispose();
};

// Canvas resize utility
export const resizeCanvas = (canvas: FabricCanvas, width: number, height: number) => {
  if (canvas) {
    // Set new dimensions
    canvas.setDimensions({ width, height });
    
    // Re-ensure white background after resize
    ensureWhiteBackground(canvas);
    
    // Force a re-render
    canvas.renderAll();
  }
};
