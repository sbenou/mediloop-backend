import { Canvas, Line, Circle, Rect, IText, Text } from "fabric";

// Re-export all utilities from the utils folder
export * from './canvasHistory';
export * from './canvasInitialization';
export * from './canvasImageHandling';
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

// Add shape creation utility functions
export const addCircle = (canvas: Canvas, color: string) => {
  if (!canvas) return;
  
  console.log("Adding circle with color:", color);
  
  // Calculate the appropriate size based on canvas dimensions
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  const size = Math.min(canvasWidth, canvasHeight) * 0.25; // 25% of smallest dimension
  
  const circle = new Circle({
    left: canvasWidth / 2 - size / 2,
    top: canvasHeight / 2 - size / 2,
    radius: size / 2,
    fill: 'transparent',
    stroke: color,
    strokeWidth: 2,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    transparentCorners: false,
    cornerColor: '#0066ff',
    cornerSize: 10,
    cornerStyle: 'circle'
  });
  
  canvas.add(circle);
  
  // Force drawing mode off to allow selection
  canvas.isDrawingMode = false;
  
  // Force the control points to be positioned correctly
  circle.setCoords();
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();
  
  console.log("Circle added successfully");
};

export const addRectangle = (canvas: Canvas, color: string) => {
  if (!canvas) return;
  
  console.log("Adding rectangle with color:", color);
  
  // Calculate the appropriate size based on canvas dimensions
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  const width = canvasWidth * 0.3; // 30% of canvas width
  const height = canvasHeight * 0.3; // 30% of canvas height
  
  const rect = new Rect({
    left: canvasWidth / 2 - width / 2,
    top: canvasHeight / 2 - height / 2,
    width: width,
    height: height,
    fill: 'transparent',
    stroke: color,
    strokeWidth: 2,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    transparentCorners: false,
    cornerColor: '#0066ff',
    cornerSize: 10,
    cornerStyle: 'circle'
  });
  
  canvas.add(rect);
  
  // Force drawing mode off to allow selection
  canvas.isDrawingMode = false;
  
  // Force the control points to be positioned correctly
  rect.setCoords();
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();
  
  console.log("Rectangle added successfully");
};

export const addLine = (canvas: Canvas, color: string) => {
  if (!canvas) return;
  
  console.log("Adding line with color:", color);
  
  // Calculate the appropriate size based on canvas dimensions
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  const startX = canvasWidth * 0.25; // 25% from left
  const endX = canvasWidth * 0.75; // 75% from left
  const y = canvasHeight / 2; // Center vertically
  
  const line = new Line([startX, y, endX, y], {
    stroke: color,
    strokeWidth: 2,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    transparentCorners: false,
    cornerColor: '#0066ff',
    cornerSize: 10,
    cornerStyle: 'circle'
  });
  
  canvas.add(line);
  
  // Force drawing mode off to allow selection
  canvas.isDrawingMode = false;
  
  // Force the control points to be positioned correctly
  line.setCoords();
  canvas.setActiveObject(line);
  canvas.requestRenderAll();
  
  console.log("Line added successfully");
};

export const addText = (canvas: Canvas, text: string, color: string) => {
  if (!canvas) return;
  
  console.log("Adding text with color:", color);
  
  const textObj = new Text(text, {
    left: 100,
    top: 100,
    fill: color,
    fontSize: 20,
    fontFamily: 'Arial',
    selectable: true,
    hasControls: true
  });
  
  canvas.add(textObj);
  
  // Force drawing mode off to allow selection
  canvas.isDrawingMode = false;
  
  // Force the control points to be positioned correctly
  textObj.setCoords();
  canvas.setActiveObject(textObj);
  canvas.requestRenderAll();
  
  console.log("Text added successfully");
};

export const addDateField = (canvas: Canvas, color: string) => {
  if (!canvas) return;
  
  console.log("Adding date field with color:", color);
  
  const currentDate = new Date().toLocaleDateString();
  const dateField = new Text(currentDate, {
    left: 100,
    top: 100,
    fill: color,
    fontSize: 16,
    fontFamily: 'Arial',
    selectable: true,
    hasControls: true,
    data: { isDateField: true }
  });
  
  canvas.add(dateField);
  
  // Force drawing mode off to allow selection
  canvas.isDrawingMode = false;
  
  // Force the control points to be positioned correctly
  dateField.setCoords();
  canvas.setActiveObject(dateField);
  canvas.requestRenderAll();
  
  console.log("Date field added successfully");
};

export const addCheckbox = (canvas: Canvas, color: string, checked: boolean = false) => {
  if (!canvas) return;
  
  console.log("Adding checkbox with color:", color, "checked:", checked);
  
  // Create a group for checkbox consisting of a square and optional checkmark
  const boxSize = 20;
  
  // Create the checkbox square
  const box = new Rect({
    width: boxSize,
    height: boxSize,
    fill: 'transparent',
    stroke: color,
    strokeWidth: 2,
    selectable: true,
    hasControls: true,
    left: 100,
    top: 100
  });
  
  // If checked, add a checkmark
  if (checked) {
    // Simple checkmark using a line
    const checkmark1 = new Line([5, 10, 10, 15], {
      stroke: color,
      strokeWidth: 2,
      left: 100,
      top: 100
    });
    
    const checkmark2 = new Line([10, 15, 15, 5], {
      stroke: color,
      strokeWidth: 2,
      left: 100,
      top: 100
    });
    
    // Add both elements to canvas
    canvas.add(box);
    canvas.add(checkmark1);
    canvas.add(checkmark2);
    
    // Position them together
    checkmark1.setCoords();
    checkmark2.setCoords();
  } else {
    // Just add the empty box
    canvas.add(box);
  }
  
  // Force drawing mode off to allow selection
  canvas.isDrawingMode = false;
  
  // Force the control points to be positioned correctly
  box.setCoords();
  canvas.setActiveObject(box);
  canvas.requestRenderAll();
  
  console.log("Checkbox added successfully");
};

export const rotateObject = (canvas: Canvas, angle: number) => {
  if (!canvas) return;
  
  console.log(`Rotating object by ${angle} degrees`);
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  // Get current angle and add the rotation
  const currentAngle = activeObject.angle || 0;
  activeObject.rotate((currentAngle + angle) % 360);
  
  // Force the control points to be positioned correctly
  activeObject.setCoords();
  canvas.requestRenderAll();
  
  console.log("Object rotated successfully");
};
