
import { Canvas as FabricCanvas, Circle, Rect, Text, Line } from "fabric";
import { saveCanvasState } from "./canvasHistory";

// Create a circle on canvas
export const addCircle = (canvas: FabricCanvas, color: string) => {
  if (!canvas) return;
  
  const circle = new Circle({
    radius: 30,
    fill: 'transparent',
    stroke: color,
    strokeWidth: 2,
    left: canvas.getWidth() / 2 - 30,
    top: canvas.getHeight() / 2 - 30
  });
  
  canvas.add(circle);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Create a rectangle on canvas
export const addRectangle = (canvas: FabricCanvas, color: string) => {
  if (!canvas) return;
  
  const rect = new Rect({
    width: 60,
    height: 60,
    fill: 'transparent',
    stroke: color,
    strokeWidth: 2,
    left: canvas.getWidth() / 2 - 30,
    top: canvas.getHeight() / 2 - 30
  });
  
  canvas.add(rect);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Add text to canvas
export const addText = (canvas: FabricCanvas, text: string, color: string) => {
  if (!canvas) return;
  
  const textObj = new Text(text || 'Text', {
    left: canvas.getWidth() / 2 - 25,
    top: canvas.getHeight() / 2 - 10,
    fontSize: 20,
    fill: color
  });
  
  canvas.add(textObj);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Add a line to canvas
export const addLine = (canvas: FabricCanvas, color: string) => {
  if (!canvas) return;
  
  const line = new Line([
    canvas.getWidth() / 2 - 40, 
    canvas.getHeight() / 2,
    canvas.getWidth() / 2 + 40, 
    canvas.getHeight() / 2
  ], {
    stroke: color,
    strokeWidth: 2
  });
  
  canvas.add(line);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Change brush size
export const changeBrushSize = (canvas: FabricCanvas, size: number) => {
  if (!canvas || !canvas.freeDrawingBrush) return;
  
  canvas.freeDrawingBrush.width = size;
};

// Toggle grid display
export const toggleGrid = (canvas: FabricCanvas, showGrid: boolean, gridSize: number = 20) => {
  if (!canvas) return;
  
  // Remove any existing grid first
  const existingGrid = canvas.getObjects().filter(obj => {
    return obj.get('isGrid') === true;
  });
  
  existingGrid.forEach(obj => canvas.remove(obj));
  
  if (!showGrid) {
    // Ensure background is white after removing grid
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    return;
  }
  
  const width = canvas.getWidth();
  const height = canvas.getHeight();
  
  // Create vertical lines
  for (let i = gridSize; i < width; i += gridSize) {
    const line = new Line([i, 0, i, height], {
      stroke: '#cccccc',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      isGrid: true
    });
    canvas.add(line);
    // Move grid lines to back
    const objects = canvas.getObjects();
    const index = objects.indexOf(line);
    if (index > 0) {
      objects.splice(index, 1);
      objects.unshift(line);
      canvas.renderAll();
    }
  }
  
  // Create horizontal lines
  for (let i = gridSize; i < height; i += gridSize) {
    const line = new Line([0, i, width, i], {
      stroke: '#cccccc',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      isGrid: true
    });
    canvas.add(line);
    // Move grid lines to back
    const objects = canvas.getObjects();
    const index = objects.indexOf(line);
    if (index > 0) {
      objects.splice(index, 1);
      objects.unshift(line);
      canvas.renderAll();
    }
  }
  
  // Ensure background is white after adding grid
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
};

// Rotate selected object
export const rotateObject = (canvas: FabricCanvas, angle: number) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  const currentAngle = activeObject.angle || 0;
  activeObject.rotate(currentAngle + angle);
  canvas.renderAll();
  saveCanvasState(canvas);
};
