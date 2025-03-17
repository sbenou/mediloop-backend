import { Canvas, Line } from "fabric";

// Re-export all utilities from the utils folder
export * from './canvasHistory';
export * from './canvasInitialization';
export * from './canvasImageHandling';
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

// Add utility function for canvas resizing
export const resizeCanvas = (canvas: Canvas, width: number, height: number) => {
  if (!canvas) return;
  
  canvas.setWidth(width);
  canvas.setHeight(height);
  canvas.setDimensions({ width, height });
  
  // Make sure all objects are still visible in the resized canvas
  canvas.getObjects().forEach(obj => {
    const objWidth = obj.getScaledWidth();
    const objHeight = obj.getScaledHeight();
    const objLeft = obj.left || 0;
    const objTop = obj.top || 0;
    
    // If object extends beyond canvas, adjust its position
    if (objLeft + objWidth > width) {
      obj.set({ left: Math.max(0, width - objWidth) });
    }
    
    if (objTop + objHeight > height) {
      obj.set({ top: Math.max(0, height - objHeight) });
    }
    
    obj.setCoords();
  });
  
  canvas.renderAll();
};
