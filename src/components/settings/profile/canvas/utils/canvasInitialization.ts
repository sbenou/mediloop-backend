
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
  });
  
  // Explicitly set canvas element width/height
  canvasElement.width = width;
  canvasElement.height = height;
  
  // Apply explicit white background
  ensureWhiteBackground(canvas);

  // Customize the drawing cursor to look like a pen
  canvas.freeDrawingCursor = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXBlbiI+PHBhdGggZD0iTTEyIDIwaDkiLz48cGF0aCBkPSJNMTYuNSAzLjVhMi4xMjEgMi4xMjEgMCAwIDEgMyAzTDcgMTlsLTQgMSAxLTQgMTIuNS0xMi41eiIvPjwvc3ZnPg==), auto';

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
