
import { Canvas as FabricCanvas, Object as FabricObject } from "fabric";
import { saveCanvasState } from "./canvasHistory";

// Layer management (bring forward, send backward, etc.)
export const bringObjectForward = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  canvas.bringObjectForward(activeObject);
  canvas.renderAll();
  saveCanvasState(canvas);
};

export const sendObjectBackward = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  canvas.sendObjectBackward(activeObject);
  canvas.renderAll();
  saveCanvasState(canvas);
};

export const bringObjectToFront = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  canvas.bringObjectToFront(activeObject);
  canvas.renderAll();
  saveCanvasState(canvas);
};

export const sendObjectToBack = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  canvas.sendObjectToBack(activeObject);
  canvas.renderAll();
  saveCanvasState(canvas);
};
