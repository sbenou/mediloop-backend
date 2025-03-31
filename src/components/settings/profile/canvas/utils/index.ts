
import { Canvas, Line } from "fabric";

// Import and re-export specific functions to avoid naming conflicts
export { initializeCanvas, cleanupCanvasListeners } from './canvasInitialization';
export * from './canvasHistory';
// Export canvasImageHandling functions but not the one that conflicts
export { applyImageFilter } from './canvasImageHandling';
export * from './canvasShapes';
export * from './canvasLayerManagement';
export * from './canvasTemplates';
export * from './canvasExportOptions';

// Add grid utility function
export const toggleGrid = (canvas: Canvas, showGrid: boolean) => {
  // Remove any existing grid
  // In Fabric.js v6, we need to use object.get() for custom properties
  const existingGrid = canvas.getObjects().filter(obj => {
    // Check if the object has a "isGrid" custom data property
    return obj.get('data')?.isGrid === true;
  });
  
  existingGrid.forEach(obj => canvas.remove(obj));
  
  if (showGrid) {
    const gridSize = 20;
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    
    // Create vertical lines
    for (let i = 0; i <= width; i += gridSize) {
      const line = new Line([i, 0, i, height], {
        stroke: '#ccc',
        selectable: false,
        evented: false,
        data: { isGrid: true }
      });
      canvas.add(line);
      // In Fabric.js v6, use the canvas item positioning methods
      canvas.getObjects().forEach(obj => {
        if (obj !== line && obj.get('data')?.isGrid !== true) {
          // Move non-grid objects to the front instead of sending grid lines to back
          canvas.bringObjectToFront(obj);
        }
      });
    }
    
    // Create horizontal lines
    for (let i = 0; i <= height; i += gridSize) {
      const line = new Line([0, i, width, i], {
        stroke: '#ccc',
        selectable: false,
        evented: false,
        data: { isGrid: true }
      });
      canvas.add(line);
      // In Fabric.js v6, use the canvas item positioning methods
      canvas.getObjects().forEach(obj => {
        if (obj !== line && obj.get('data')?.isGrid !== true) {
          // Move non-grid objects to the front instead of sending grid lines to back
          canvas.bringObjectToFront(obj);
        }
      });
    }
  }
  
  canvas.renderAll();
};
