
import { Canvas as FabricCanvas, PencilBrush, Image as FabricImage, Circle, Rect, Text, Line, Object as FabricObject, Color } from "fabric";

// Initialize a fabric canvas with white background
export const initializeCanvas = (container: HTMLDivElement, width?: number, height?: number): FabricCanvas => {
  // Create a canvas element
  const canvasElement = document.createElement('canvas');
  container.innerHTML = ''; // Clear any existing content
  container.appendChild(canvasElement);
  
  // Set canvas dimensions to match container or use custom dimensions
  const canvasWidth = width || container.clientWidth;
  const canvasHeight = height || container.clientHeight;
  canvasElement.width = canvasWidth;
  canvasElement.height = canvasHeight;
  
  // Initialize fabric canvas with explicitly set white background
  const canvas = new FabricCanvas(canvasElement, {
    backgroundColor: '#ffffff',
    isDrawingMode: false,
  });
  
  // Set up drawing brush
  canvas.freeDrawingBrush = new PencilBrush(canvas);
  canvas.freeDrawingBrush.color = '#000000';
  canvas.freeDrawingBrush.width = 3;
  
  // Ensure background is white
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  
  // Set up history for undo/redo functionality
  setupUndoRedoHistory(canvas);
  
  return canvas;
};

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

// Setup undo/redo functionality
interface CanvasHistoryState {
  objects: string; // JSON string of canvas objects
  background: string; // Background color
}

// Add history functionality to the canvas
let canvasHistory: CanvasHistoryState[] = [];
let canvasHistoryIndex = -1;
const maxHistorySteps = 30; // Limit history to prevent memory issues

export const setupUndoRedoHistory = (canvas: FabricCanvas) => {
  // Clear history when setting up a new canvas
  canvasHistory = [];
  canvasHistoryIndex = -1;
  
  // Save initial state (empty canvas)
  saveCanvasState(canvas);
  
  // Set up event listeners for history
  canvas.on('object:added', () => saveCanvasState(canvas));
  canvas.on('object:modified', () => saveCanvasState(canvas));
  canvas.on('object:removed', () => saveCanvasState(canvas));
  canvas.on('path:created', () => saveCanvasState(canvas));
};

export const saveCanvasState = (canvas: FabricCanvas) => {
  // Limit history size by removing oldest entries if needed
  if (canvasHistoryIndex >= maxHistorySteps) {
    canvasHistory.shift(); // Remove oldest state
    canvasHistoryIndex--;
  }
  
  // If we're not at the end of the history (i.e., user has performed undo),
  // remove all future states as they are now invalid
  if (canvasHistoryIndex < canvasHistory.length - 1) {
    canvasHistory = canvasHistory.slice(0, canvasHistoryIndex + 1);
  }
  
  const newState: CanvasHistoryState = {
    objects: JSON.stringify(canvas.toJSON()),
    background: canvas.backgroundColor?.toString() || '#ffffff'
  };
  
  canvasHistory.push(newState);
  canvasHistoryIndex = canvasHistory.length - 1;
};

export const canUndo = (): boolean => {
  return canvasHistoryIndex > 0;
};

export const canRedo = (): boolean => {
  return canvasHistoryIndex < canvasHistory.length - 1;
};

export const undoCanvas = (canvas: FabricCanvas): boolean => {
  if (!canUndo()) return false;
  
  canvasHistoryIndex--;
  loadCanvasState(canvas, canvasHistoryIndex);
  return true;
};

export const redoCanvas = (canvas: FabricCanvas): boolean => {
  if (!canRedo()) return false;
  
  canvasHistoryIndex++;
  loadCanvasState(canvas, canvasHistoryIndex);
  return true;
};

const loadCanvasState = (canvas: FabricCanvas, index: number) => {
  if (index < 0 || index >= canvasHistory.length) return;
  
  const state = canvasHistory[index];
  
  canvas.clear();
  canvas.loadFromJSON(state.objects, () => {
    canvas.backgroundColor = state.background;
    canvas.renderAll();
  });
};

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
    // Use sendToBack to move grid lines to back
    canvas.sendObjectToBack(line);
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
    // Use sendToBack to move grid lines to back
    canvas.sendObjectToBack(line);
  }
  
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

// Ensure white background on canvas through event listeners
export const ensureWhiteBackground = (canvas: FabricCanvas | null) => {
  if (!canvas) return;
  
  // Set initial background color
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  
  // Force rendering with white background
  const forceWhiteBackground = () => {
    if (canvas.backgroundColor !== '#ffffff') {
      console.log('Enforcing white background on canvas');
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    }
  };
  
  // Apply on all relevant events
  canvas.on('mouse:up', forceWhiteBackground);
  canvas.on('mouse:down', forceWhiteBackground);
  canvas.on('mouse:move', forceWhiteBackground);
  canvas.on('path:created', forceWhiteBackground);
  canvas.on('object:added', forceWhiteBackground);
  canvas.on('object:modified', forceWhiteBackground);
  canvas.on('object:removed', forceWhiteBackground);
  canvas.on('before:render', forceWhiteBackground);
  canvas.on('after:render', forceWhiteBackground);
  
  // Also apply every time drawing mode changes
  canvas.on('selection:created', forceWhiteBackground);
  canvas.on('selection:updated', forceWhiteBackground);
  canvas.on('selection:cleared', forceWhiteBackground);
};

// Clean up canvas event listeners
export const cleanupCanvasListeners = (canvas: FabricCanvas | null) => {
  if (!canvas) return;
  
  canvas.off('mouse:up');
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('path:created');
  canvas.off('object:added');
  canvas.off('object:modified');
  canvas.off('object:removed');
  canvas.off('before:render');
  canvas.off('after:render');
  canvas.off('selection:created');
  canvas.off('selection:updated');
  canvas.off('selection:cleared');
};

// NEW FEATURES

// Templates for stamps and signatures
export interface StampTemplate {
  id: string;
  name: string;
  applyTemplate: (canvas: FabricCanvas, doctorName?: string) => void;
  thumbnail: string;
}

// Predefined templates
export const stampTemplates: StampTemplate[] = [
  {
    id: 'circular',
    name: 'Circular Stamp',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5ET0NUT1I8L3RleHQ+PC9zdmc+',
    applyTemplate: (canvas, doctorName) => {
      canvas.clear();
      
      // Outer circle
      const outerCircle = new Circle({
        radius: Math.min(canvas.getWidth(), canvas.getHeight()) * 0.4,
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2
      });
      
      // Inner circle
      const innerCircle = new Circle({
        radius: Math.min(canvas.getWidth(), canvas.getHeight()) * 0.35,
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 1
      });
      
      // Text for doctor name
      const nameText = new Text(doctorName || 'Dr. Name', {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2 - 15,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#000000',
        originX: 'center',
        originY: 'center'
      });
      
      // Text for "M.D."
      const designationText = new Text('M.D.', {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2 + 15,
        fontSize: 12,
        fill: '#000000',
        originX: 'center',
        originY: 'center'
      });
      
      canvas.add(outerCircle);
      canvas.add(innerCircle);
      canvas.add(nameText);
      canvas.add(designationText);
      canvas.renderAll();
      saveCanvasState(canvas);
    }
  },
  {
    id: 'rectangular',
    name: 'Rectangular Stamp',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI2MCIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5ET0NUT1I8L3RleHQ+PC9zdmc+',
    applyTemplate: (canvas, doctorName) => {
      canvas.clear();
      
      // Rectangle
      const rect = new Rect({
        width: canvas.getWidth() * 0.8,
        height: canvas.getHeight() * 0.6,
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2
      });
      
      // Line separator
      const line = new Line([
        canvas.getWidth() * 0.2, 
        canvas.getHeight() / 2,
        canvas.getWidth() * 0.8, 
        canvas.getHeight() / 2
      ], {
        stroke: '#000000',
        strokeWidth: 1
      });
      
      // Text for doctor name
      const nameText = new Text(doctorName || 'Dr. Name', {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2 - 20,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#000000',
        originX: 'center',
        originY: 'center'
      });
      
      // Text for license
      const licenseText = new Text('License #: 12345', {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2 + 20,
        fontSize: 12,
        fill: '#000000',
        originX: 'center',
        originY: 'center'
      });
      
      canvas.add(rect);
      canvas.add(line);
      canvas.add(nameText);
      canvas.add(licenseText);
      canvas.renderAll();
      saveCanvasState(canvas);
    }
  },
  {
    id: 'signature',
    name: 'Signature Template',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCwyNSBDMjAsMTAgNDAsMTAgNTAsMjUgQzYwLDQwIDgwLDQwIDkwLDI1IiBzdHJva2U9IiMwMDAiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
    applyTemplate: (canvas, doctorName) => {
      canvas.clear();
      
      // Signature line
      const line = new Line([
        canvas.getWidth() * 0.2, 
        canvas.getHeight() * 0.7,
        canvas.getWidth() * 0.8, 
        canvas.getHeight() * 0.7
      ], {
        stroke: '#000000',
        strokeWidth: 1
      });
      
      // Text for doctor name
      const nameText = new Text(doctorName || 'Dr. Name', {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() * 0.85,
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#000000',
        originX: 'center',
        originY: 'center'
      });
      
      canvas.add(line);
      canvas.add(nameText);
      canvas.renderAll();
      saveCanvasState(canvas);
    }
  }
];

// Apply image filters (contrast, brightness, etc.) to an image on the canvas
export const applyImageFilter = (canvas: FabricCanvas, targetObject: FabricImage, filterType: 'brightness' | 'contrast' | 'grayscale' | 'sepia', value: number) => {
  if (!canvas || !targetObject) return;
  
  // Remove any existing filters
  targetObject.filters = [];
  
  // Apply the requested filter
  switch (filterType) {
    case 'brightness':
      targetObject.filters.push(new fabric.Image.filters.Brightness({ brightness: value }));
      break;
    case 'contrast':
      targetObject.filters.push(new fabric.Image.filters.Contrast({ contrast: value }));
      break;
    case 'grayscale':
      targetObject.filters.push(new fabric.Image.filters.Grayscale());
      break;
    case 'sepia':
      targetObject.filters.push(new fabric.Image.filters.Sepia());
      break;
  }
  
  // Apply the filters and render
  targetObject.applyFilters();
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Layer management (bring forward, send backward, etc.)
export const bringObjectForward = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  canvas.bringForward(activeObject);
  canvas.renderAll();
  saveCanvasState(canvas);
};

export const sendObjectBackward = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  canvas.sendBackwards(activeObject);
  canvas.renderAll();
  saveCanvasState(canvas);
};

export const bringObjectToFront = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  canvas.bringToFront(activeObject);
  canvas.renderAll();
  saveCanvasState(canvas);
};

export const sendObjectToBack = (canvas: FabricCanvas) => {
  if (!canvas) return;
  
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  canvas.sendToBack(activeObject);
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Resize canvas dimensions
export const resizeCanvas = (canvas: FabricCanvas, width: number, height: number) => {
  if (!canvas) return;
  
  // Save the current state before resizing
  const originalWidth = canvas.getWidth();
  const originalHeight = canvas.getHeight();
  const scaleFactor = Math.min(width / originalWidth, height / originalHeight);
  
  // Resize the canvas
  canvas.setDimensions({ width, height });
  
  // Scale objects if needed
  if (scaleFactor !== 1) {
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      const scaleX = obj.scaleX || 1;
      const scaleY = obj.scaleY || 1;
      const left = obj.left || 0;
      const top = obj.top || 0;
      
      obj.scaleX = scaleX * scaleFactor;
      obj.scaleY = scaleY * scaleFactor;
      obj.left = left * (width / originalWidth);
      obj.top = top * (height / originalHeight);
      obj.setCoords();
    });
  }
  
  canvas.renderAll();
  saveCanvasState(canvas);
};

// Export canvas to different formats
export const exportCanvas = (canvas: FabricCanvas, format: 'png' | 'jpeg' | 'svg' | 'pdf'): string | Blob | null => {
  if (!canvas) return null;
  
  switch (format) {
    case 'png':
      return canvas.toDataURL({ format: 'png', quality: 1 });
    case 'jpeg':
      return canvas.toDataURL({ format: 'jpeg', quality: 0.9 });
    case 'svg':
      const svgData = canvas.toSVG();
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      return blob;
    case 'pdf':
      // Simple PDF generation using canvas data URL
      // For production use, consider using a library like jsPDF
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1 });
      
      // Create a link to download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'stamp-or-signature.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      return dataUrl;
    default:
      return null;
  }
};
