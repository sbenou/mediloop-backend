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
const ensureWhiteBackground = (canvas: FabricCanvas) => {
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
