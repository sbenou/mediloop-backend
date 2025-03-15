
// Re-export all utilities from the utils folder
export * from './canvasHistory';
export * from './canvasInitialization';
export * from './canvasImageHandling';
export * from './canvasShapes';
export * from './canvasLayerManagement';
export * from './canvasTemplates';
export * from './canvasExportOptions';

// Add grid utility function
export const toggleGrid = (canvas: fabric.Canvas, showGrid: boolean) => {
  // Remove any existing grid
  const existingGrid = canvas.getObjects().filter(obj => obj.data?.isGrid);
  existingGrid.forEach(obj => canvas.remove(obj));
  
  if (showGrid) {
    const gridSize = 20;
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    
    // Create vertical lines
    for (let i = 0; i <= width; i += gridSize) {
      const line = new fabric.Line([i, 0, i, height], {
        stroke: '#ccc',
        selectable: false,
        evented: false,
        data: { isGrid: true }
      });
      canvas.add(line);
      canvas.sendToBack(line);
    }
    
    // Create horizontal lines
    for (let i = 0; i <= height; i += gridSize) {
      const line = new fabric.Line([0, i, width, i], {
        stroke: '#ccc',
        selectable: false,
        evented: false,
        data: { isGrid: true }
      });
      canvas.add(line);
      canvas.sendToBack(line);
    }
  }
  
  canvas.renderAll();
};
