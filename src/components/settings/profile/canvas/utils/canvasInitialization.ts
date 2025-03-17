
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

  // Set drawing cursor - using a pen cursor icon
  canvas.freeDrawingCursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5gMIECgQ98ZYggAAA5JJREFUOMudlF1IVEEUx//n7t27rrtrrpprVltGRH4EWVIRQRBREUUPJfkQCD30UG9BL/nQkw/RQxH00EMPBUFBRNBbEUVFH6ZpiZK6peas7tr9uLOzs7PTw41Mt1gj6MDlzNz5/c//zJk5wBrqgv1Q5TzMH6ZX5OfcQw1B4d+Uq/8AUo5d3B5M7TtXkLfhkEPnXgDgnAMACIUTgSdDk90vPk1d8bW1hDBAsSZMB5x/3JBdwLfVlhXsSjd4VJIkMCIgojDOuTIS/DVwpf/jnYm+rrPwdXVjBZQu2HWuIg/by7MKdzJKIYgSSVAkCEEgojDOmPhlYrr/Wt+H221P76+A1wUH0HVqB+tGSXI2KJEIEQgAEQghsCCJEJgISRSYKHDOmPgzGgvc6O+9PuBrbcbQvQcAgKYT+0Hq3NiRkVNWnJ1VTgUiUZGIEEVBEIgoMSICZwwz8WhwsDt0Zyw8cOtsfBDG+vPUTdl5VVlul0cURUl8z7IocUEQmCCKnDMGLsssnkik3NHIzEtfW2MY5sbK16DaEbQYZ2e73QVeSZZFxhhIFEFEIVvKyXS5iuTpUD/nXLVOI+MZOXZU6YZJZZkzSpnGGMvKoE8Ag8O9nrjDYd/BGFOnZiIRY7l1QdWRW1a8dXuaYdBm0Gt3VWQWu4xNKA7PgfMVHx/l1/bWbKQb0vJIhqmMAUQkCALjnIELgtA3Md772N/Zc9nXdh/wev1dxYXoOtUJp8sDk3CiAgJnDLIsK0oqpTw1Zj6PyYn3FBkDYwxUpDDXN4Kz0AFGgGaQaHCYMqOqKUCWZRnvxj8MJRKxMUuZWRqS6REGBw2iCJ0wElUY5+BWAyZlhWk6hSAIICIYTgZvhsO3TWVWhOkAQVUZRF2Hy0gDKINAqdm6lh+zMzTnLQZGd6JBAxXi3Gr/lRklmk58Bd1agJnJCO7ceg/FDAEAEorM399aZVAYUiqWQ9lAGSVdN6BpOpiioKLQiVvXvsJmbF54tAZQU6OALQEhsT9R1UypqgJVkWHoevrvdmC2NizFrLuFqUQUgqJCFAQoqgxVVaGqCnQtPStTa5mSNQHcisEMRUYoXgJKxkFIhgxGDNJ9XhhdGcswCx3JvzdPkTBY4XFMRCJIT1YQ/BqBPCMgKzMLTldWWg+tAJfkX1tHKnI9Gzs0Xx7dYs/e7GJZWWJDyYY4F3NKC0szNhUVC6Z3a/L70JzEo7MuHwQAAAAASUVORK5CYII=), auto';

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
