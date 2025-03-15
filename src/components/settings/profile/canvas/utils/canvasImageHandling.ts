
import { Canvas as FabricCanvas, Image as FabricImage, filters } from "fabric";
import { saveCanvasState } from "./canvasHistory";

// Load an image to a canvas
export const loadImageToCanvas = (canvas: FabricCanvas, url: string, applyFilter?: boolean) => {
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
    
    // Apply default filter if requested
    if (applyFilter) {
      applyImageFilter(canvas, img, 'contrast', 0.1);
    }
    
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

// Apply image filters (contrast, brightness, etc.) to an image on the canvas
export const applyImageFilter = (canvas: FabricCanvas, targetObject: FabricImage, filterType: 'brightness' | 'contrast' | 'grayscale' | 'sepia', value: number) => {
  if (!canvas || !targetObject) return;
  
  // Remove any existing filters
  targetObject.filters = [];
  
  // Apply the requested filter
  switch (filterType) {
    case 'brightness':
      targetObject.filters.push(new filters.Brightness({ brightness: value }));
      break;
    case 'contrast':
      targetObject.filters.push(new filters.Contrast({ contrast: value }));
      break;
    case 'grayscale':
      targetObject.filters.push(new filters.Grayscale());
      break;
    case 'sepia':
      targetObject.filters.push(new filters.Sepia());
      break;
  }
  
  // Apply the filters and render
  targetObject.applyFilters();
  
  // Ensure white background after applying filters
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  saveCanvasState(canvas);
};
