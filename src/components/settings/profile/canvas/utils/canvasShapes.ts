import { Canvas as FabricCanvas, Circle, Rect, Text, Line, Path, Group } from "fabric";
import { saveCanvasState } from "./canvasHistory";

// Add a circle to canvas
export const addCircle = (canvas: FabricCanvas, penColor: string) => {
  if (!canvas) return;
  
  const circle = new Circle({
    radius: 50,
    fill: 'transparent',
    stroke: penColor,
    strokeWidth: 3,
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center'
  });
  
  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Add a rectangle to canvas
export const addRectangle = (canvas: FabricCanvas, penColor: string) => {
  if (!canvas) return;
  
  const rect = new Rect({
    width: 100,
    height: 80,
    fill: 'transparent',
    stroke: penColor,
    strokeWidth: 3,
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center'
  });
  
  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Add a line to canvas
export const addLine = (canvas: FabricCanvas, penColor: string) => {
  if (!canvas) return;
  
  const line = new Line([50, 100, 150, 100], {
    strokeWidth: 3,
    stroke: penColor,
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center'
  });
  
  canvas.add(line);
  canvas.setActiveObject(line);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Add text to canvas
export const addText = (canvas: FabricCanvas, text: string, penColor: string) => {
  if (!canvas) return;
  
  const textSample = new Text(text, {
    fontSize: 20,
    fill: penColor,
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center'
  });
  
  canvas.add(textSample);
  canvas.setActiveObject(textSample);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Rotate object
export const rotateObject = (canvas: FabricCanvas, angle: number) => {
  if (!canvas || !canvas.getActiveObject()) return;
  
  const activeObject = canvas.getActiveObject();
  activeObject.rotate((activeObject.angle || 0) + angle);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Add a date field to canvas
export const addDateField = (canvas: FabricCanvas, penColor: string) => {
  if (!canvas) return;

  const now = new Date();
  const dateString = now.toLocaleDateString();
  
  // Create text object with date
  const dateText = new Text(dateString, {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    fontSize: 16,
    fill: penColor,
    originX: 'center',
    originY: 'center',
    editable: true
  });
  
  canvas.add(dateText);
  canvas.setActiveObject(dateText);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Add a checkbox to canvas
export const addCheckbox = (canvas: FabricCanvas, penColor: string, checked: boolean = false) => {
  if (!canvas) return;
  
  // Create the checkbox square
  const boxSize = 20;
  const checkboxRect = new Rect({
    left: canvas.getWidth() / 2 - boxSize / 2,
    top: canvas.getHeight() / 2 - boxSize / 2,
    width: boxSize,
    height: boxSize,
    fill: 'transparent',
    stroke: penColor,
    strokeWidth: 1,
    rx: 2,
    ry: 2
  });
  
  // If checked, add checkmark inside
  let checkmark;
  if (checked) {
    checkmark = new Path('M 5,10 L 8,15 L 15,5', {
      left: canvas.getWidth() / 2 - boxSize / 2,
      top: canvas.getHeight() / 2 - boxSize / 2,
      stroke: penColor,
      strokeWidth: 2,
      fill: 'transparent',
      strokeLineCap: 'round',
      strokeLineJoin: 'round'
    });
  }
  
  // Add to canvas
  canvas.add(checkboxRect);
  if (checkmark) canvas.add(checkmark);
  
  // Group checkbox and checkmark if needed
  if (checkmark) {
    const checkboxGroup = new Group([checkboxRect, checkmark], {
      left: canvas.getWidth() / 2 - boxSize / 2,
      top: canvas.getHeight() / 2 - boxSize / 2
    });
    canvas.remove(checkboxRect, checkmark);
    canvas.add(checkboxGroup);
    canvas.setActiveObject(checkboxGroup);
  } else {
    canvas.setActiveObject(checkboxRect);
  }
  
  canvas.renderAll();
  saveCanvasState(canvas);
};
