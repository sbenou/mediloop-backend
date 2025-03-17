
import { Canvas as FabricCanvas } from "fabric";
import { loadImageToCanvas } from "./canvasImageHandling";

// Initialize canvas and set up initial setup for drawing
export const initializeCanvas = (
  canvasContainer: HTMLDivElement, 
  imageUrl: string | null = null
): FabricCanvas => {
  // Find or create canvas element
  let canvasElement = canvasContainer.querySelector('canvas');
  
  if (!canvasElement) {
    canvasElement = document.createElement('canvas');
    canvasContainer.appendChild(canvasElement);
  }
  
  // Get container dimensions
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  
  // Initialize Fabric Canvas with container size
  const canvas = new FabricCanvas(canvasElement, {
    width: width,
    height: height,
    backgroundColor: '#ffffff', // Start with white background
    preserveObjectStacking: true,
    selection: true, // Enable selection
    renderOnAddRemove: true,
    isDrawingMode: false, // Start with drawing mode off
  });
  
  // Explicitly set canvas element width/height
  canvasElement.width = width;
  canvasElement.height = height;
  
  // Set canvas element styles for better cursor handling
  canvasElement.style.position = 'absolute'; // Changed to absolute
  canvasElement.style.zIndex = '9999'; // Extremely high z-index for visibility
  canvasElement.style.pointerEvents = 'auto'; // Ensure it captures mouse events
  canvasElement.style.top = '0';
  canvasElement.style.left = '0';
  canvasElement.style.width = '100%';
  canvasElement.style.height = '100%';
  
  // Apply explicit white background
  ensureWhiteBackground(canvas);

  // Set up free drawing brush with default settings
  if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = '#000000';
    canvas.freeDrawingBrush.width = 3;
    canvas.freeDrawingBrush.shadow = null;
    canvas.freeDrawingBrush.strokeLineCap = 'round';
    canvas.freeDrawingBrush.strokeLineJoin = 'round';
    
    // Force render to apply brush settings
    canvas.renderAll();
  }

  // Define high-contrast pen cursor
  const penCursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNC0wMy0xOFQxMDo0MDoyMSswMDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiBzdEV2dDp3aGVuPSIyMDI0LTAzLTE4VDEwOjQwOjIxKzAwOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlmfX50AAAOASURBVFiFvZdNbBtFFMd/M7vrXX/E+diNE9cxqFVLVakqSAQKCJA4UCSEeqiqigMSHDhw4AYHJITghhDiA4lDJcSFFokDUksrWoRagsKhTUFtSIljO3HsJE68H157d4fDxHHiOA5JU56U1a5m3r//m/+892ZFNW+HGGKMASkQA4LdrwAyUOt+a8Ch1p4ppXbGACQgAWSBKUAFiO1NVXSN2K6SddxrlIBjwP4AQKnJFg4ZlbzZKpfPue3WnBfoQ4XDUlUUCdBUddKIRPYbsfiLeiS6ADwPnAe2DXkrcBKYHgQSQoQkRJHtnL7Z3Nxc6t10V+hn1XjskB6bcE3HIkkSpdVVufbvlS0sk9lIJKbTewdfVqPx81jWa7iuAdwAFoAa4AkgB5wCjg5YGwO07WazOVP45+IJ0/UeaJScRXPLLIQjhsKBoFhopJuXtW1xvLlnX8YY2NNZq12uLC9Xdu8+6MYmnr4pWytLvncMWO0Fegk4PYJhCngEkGR9vf2bYVTLk3v3HzcS4jcUDxmvHnrIl98tLrb9TnuZ3aSRB84Ac4A9CPTSkHD3fQvAUlWpIqQDsYxc9Q19/2P38JEDgdBejbW6bnY2G4X1f3+MZrMvCCVSeP/9izFgFjgJPA2oQQz0IdOdQoA3QY5qcliuKfH7BZBCoOshNR2+SwECo9GvDmDcM0H4Yd3SgMeHJFpnQdRSKeXlsdY+AuDZtlOpVIxlx9NvTB74/LXS5Lkvyf8SBE4DRbqXmVLhw1E56wGRRKLjBH7Ttm2ZTCbjx9PpzwqhaO6OuBZg0p3UYpTx7jwdIhIlkUir2WgYDjTn60r0jrvg3wvoFPDqqCMFiBCCeDJZXV0pJO1Wa+4iRnPvcfXHIL7jxUBm1HgPKBKJ1G3PnamiUNejM/fGH73lnFuH0IFXRh3vAWmaplUtYzqgU+P//EbANiKZbGmpmuMGQRDow4x3gdR2vXkoEXcbDhNW9bZZcBcKQX8rIwF5VNXLmGa96XnHYhPaT+fZuuPktYLhMdAzVVUbKyvL+0w9Mv/eOZkflbw+VDD0zQBFUer5fEGn0nrYq1b/HreM9dFnIAgCqlULOl79XW/l1rkV7GsB5XLFhWK1ZbYeeJ9eHpf8JnX36vG36/V6Bcu61fzdpv8HfwDWw9k6jVtqLAAAAABJRU5ErkJggg==) 4 4, auto';

  // Set cursor properties for both canvas object and DOM element
  canvas.defaultCursor = 'default';
  canvas.freeDrawingCursor = penCursor;
  canvas.hoverCursor = penCursor;
  
  // Apply cursor to the DOM element for better visibility
  if (canvasElement) {
    // Add a listener to update cursor when drawing mode changes
    canvas.on('mouse:over', () => {
      if (canvas.isDrawingMode) {
        canvasElement.style.cursor = penCursor;
        canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 9999 !important;');
      } else {
        canvasElement.style.cursor = 'default';
      }
    });
    
    // Initially set cursor based on drawing mode
    canvasElement.style.cursor = canvas.isDrawingMode ? penCursor : 'default';
    
    // Force cursor application with higher z-index
    const updateCursor = () => {
      if (canvas.isDrawingMode) {
        canvasElement.style.cursor = penCursor;
        canvasElement.style.zIndex = '9999'; // Ensure high z-index
        canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 9999 !important;');
      }
    };
    
    // Apply cursor immediately and after a delay to catch any race conditions
    updateCursor();
    setTimeout(updateCursor, 100);
    setTimeout(updateCursor, 500);
  }

  // If an image URL is provided, load it to the canvas
  if (imageUrl) {
    loadImageToCanvas(canvas, imageUrl);
  } else {
    // Otherwise, render a blank white canvas
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
  }

  // Setup window resize handler
  const handleResize = () => {
    // Only resize if container dimensions changed
    if (
      canvasContainer.clientWidth !== canvas.getWidth() ||
      canvasContainer.clientHeight !== canvas.getHeight()
    ) {
      canvas.setDimensions({
        width: canvasContainer.clientWidth,
        height: canvasContainer.clientHeight
      });
      
      // Re-ensure white background after resize
      ensureWhiteBackground(canvas);
      
      // Also re-enforce cursor and z-index after resize
      const canvasEl = canvas.getElement();
      if (canvasEl && canvas.isDrawingMode) {
        canvasEl.style.zIndex = '9999';
        canvasEl.style.cursor = penCursor;
        canvasEl.setAttribute('style', canvasEl.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 9999 !important;');
      }
    }
  };

  window.addEventListener('resize', handleResize);
  
  // Return cleanup function
  const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    canvas.off('mouse:over');
    canvas.dispose();
  };
  
  // One more explicit white background enforcement after short delay
  setTimeout(() => {
    ensureWhiteBackground(canvas);
    
    // Also ensure z-index is high after initial setup
    if (canvasElement) {
      canvasElement.style.zIndex = '9999';
      canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' z-index: 9999 !important;');
    }
  }, 100);
  
  return canvas;
};

// Helper function to ensure canvas has white background
export const ensureWhiteBackground = (canvas: FabricCanvas) => {
  // Set explicit white background
  canvas.backgroundColor = '#ffffff';
  
  // Render the canvas
  canvas.renderAll();
  
  // For older browsers, also set the lower-level canvas background
  const ctx = canvas.getElement()?.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.getWidth(), canvas.getHeight());
  }
};

// Cleanup function for canvas event listeners
export const cleanupCanvasListeners = (canvas: FabricCanvas) => {
  // Remove all event listeners attached to the canvas
  canvas.dispose();
};

// Canvas resize utility
export const resizeCanvas = (canvas: FabricCanvas, width: number, height: number) => {
  if (canvas) {
    // Set new dimensions
    canvas.setDimensions({ width, height });
    
    // Re-ensure white background after resize
    ensureWhiteBackground(canvas);
    
    // Force a re-render
    canvas.renderAll();
  }
};
