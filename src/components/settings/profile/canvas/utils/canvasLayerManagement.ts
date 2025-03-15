
import { Canvas as FabricCanvas, Object as FabricObject } from "fabric";
import { saveCanvasState } from "./canvasHistory";

// Layer management (bring forward, send backward, etc.)
export const bringObjectForward = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  // Get all objects and find the active object's index
  const objects = canvas.getObjects();
  const currentIndex = objects.indexOf(activeObject);
  if (currentIndex < objects.length - 1) {
    // Swap with the next object
    const nextObject = objects[currentIndex + 1];
    objects[currentIndex + 1] = activeObject;
    objects[currentIndex] = nextObject;
    // Reapply objects in the new order
    canvas.clear();
    canvas.backgroundColor = '#ffffff'; // Ensure white background
    objects.forEach(obj => canvas.add(obj));
  }
  
  canvas.renderAll();
  saveCanvasState(canvas);
};

export const sendObjectBackward = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  // Get all objects and find the active object's index
  const objects = canvas.getObjects();
  const currentIndex = objects.indexOf(activeObject);
  if (currentIndex > 0) {
    // Swap with the previous object
    const prevObject = objects[currentIndex - 1];
    objects[currentIndex - 1] = activeObject;
    objects[currentIndex] = prevObject;
    // Reapply objects in the new order
    canvas.clear();
    canvas.backgroundColor = '#ffffff'; // Ensure white background
    objects.forEach(obj => canvas.add(obj));
  }
  
  canvas.renderAll();
  saveCanvasState(canvas);
};

export const bringObjectToFront = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  // Get all objects and remove the active object
  const objects = canvas.getObjects();
  const filteredObjects = objects.filter(obj => obj !== activeObject);
  // Add it back at the end (top)
  filteredObjects.push(activeObject);
  
  // Reapply objects in the new order
  canvas.clear();
  canvas.backgroundColor = '#ffffff'; // Ensure white background
  filteredObjects.forEach(obj => canvas.add(obj));
  
  canvas.renderAll();
  saveCanvasState(canvas);
};

export const sendObjectToBack = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  // Get all objects and remove the active object
  const objects = canvas.getObjects();
  const filteredObjects = objects.filter(obj => obj !== activeObject);
  // Add it back at the beginning (bottom)
  filteredObjects.unshift(activeObject);
  
  // Reapply objects in the new order
  canvas.clear();
  canvas.backgroundColor = '#ffffff'; // Ensure white background
  filteredObjects.forEach(obj => canvas.add(obj));
  
  canvas.renderAll();
  saveCanvasState(canvas);
};
