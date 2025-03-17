
import { Canvas, Image as FabricImage, Object as FabricObject } from 'fabric';

export const initializeCanvas = (
  container: HTMLDivElement,
  initialImageUrl: string | null
): Canvas => {
  // Remove any existing canvas elements first
  const existingCanvas = container.querySelector('canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }

  // Create a new canvas
  const canvas = new Canvas();
  
  // Append to container
  container.appendChild(canvas.getElement());
  
  // Configure canvas
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  canvas.setWidth(width);
  canvas.setHeight(height);
  canvas.setDimensions({ width, height });
  
  // Set white background (using the correct property)
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  
  // Apply CSS overrides to ensure visibility
  const canvasEl = canvas.getElement();
  if (canvasEl) {
    canvasEl.style.position = 'absolute';
    canvasEl.style.zIndex = '9999999';
    canvasEl.style.pointerEvents = 'auto';
    canvasEl.style.cursor = 'crosshair';
    
    // Force important flags
    canvasEl.setAttribute('style', canvasEl.getAttribute('style') + 
      ' position: absolute !important; z-index: 9999999 !important; pointer-events: auto !important; cursor: crosshair !important;');
  }
  
  // Force canvas to recalculate object coordinates on added
  canvas.on('object:added', (e) => {
    try {
      const obj = e.target;
      if (obj) {
        obj.setCoords();
        canvas.renderAll();
      }
    } catch (error) {
      console.error('Error in object:added event handler:', error);
    }
  });
  
  // Load initial image if provided
  if (initialImageUrl) {
    try {
      // Use FabricImage instead of fabric.Image
      FabricImage.fromURL(initialImageUrl, {
        crossOrigin: 'anonymous',
      }).then((img) => {
        img.set({
          left: 0,
          top: 0,
          selectable: true
        });
        canvas.add(img);
        canvas.renderAll();
      }).catch(error => {
        console.error('Error loading initial image:', error);
      });
    } catch (error) {
      console.error('Error loading initial image:', error);
    }
  }
  
  // Return the configured canvas
  return canvas;
};

export const cleanupCanvasListeners = (canvas: Canvas | null): void => {
  if (!canvas) return;
  
  try {
    // Remove all event listeners
    canvas.off();
    
    // Dispose objects
    canvas.getObjects().forEach((obj) => {
      try {
        canvas.remove(obj);
      } catch (e) {
        console.error('Error removing object during cleanup:', e);
      }
    });
    
    // Clear canvas
    canvas.clear();
    
    // Remove canvas from DOM
    const canvasEl = canvas.getElement();
    if (canvasEl && canvasEl.parentNode) {
      canvasEl.parentNode.removeChild(canvasEl);
    }
  } catch (error) {
    console.error('Error in canvas cleanup:', error);
  }
};
