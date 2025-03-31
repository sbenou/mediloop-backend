
import { useRef, useState, useEffect } from 'react';
import { initializeCanvas, cleanupCanvasListeners } from '../utils';
import { loadImageToCanvas } from '../utils/canvasImageHandling';
import { Canvas as FabricCanvas } from 'fabric';

interface UseCanvasInitializationProps {
  imageUrl: string | null;
}

export const useCanvasInitialization = ({ imageUrl }: UseCanvasInitializationProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false);
  
  // Track the previous imageUrl for comparison
  const previousImageUrlRef = useRef<string | null>(null);

  // Initialize canvas and handle container resize
  useEffect(() => {
    // Only initialize if we have a container and no canvas yet
    if (!canvasContainerRef.current || canvas) return;
    
    console.log('Initializing canvas with container');
    
    const containerWidth = canvasContainerRef.current.clientWidth;
    const newWidth = Math.min(600, containerWidth);
    const newHeight = Math.round(newWidth / 2);
    
    setCanvasWidth(newWidth);
    setCanvasHeight(newHeight);
    
    const newCanvas = initializeCanvas(canvasContainerRef.current, {
      width: newWidth,
      height: newHeight
    });
    
    setCanvas(newCanvas);
    setIsCanvasInitialized(true);
    
    // Ensure the cursor is properly set
    if (newCanvas) {
      const penCursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNC0wMy0xOFQxMDo0MDoyMSswMDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiBzdEV2dDp3aGVuPSIyMDI0LTAzLTE4VDEwOjQwOjIxKzAwOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlmfX50AAAOASURBVFiFvZdNbBtFFMd/M7vrXX/E+diNE9cxqFVLVakqSAQKCJA4UCSEeqiqigMSHDhw4AYHJITghhDiA4lDJcSFFokDUksrWoRagsKhTUFtSIljO3HsJE68H157d4fDxHHiOA5JU56U1a5m3r//m/+892ZFNW+HGGKMASkQA4LdrwAyUOt+a8Ch1p4ppXbGACQgAWSBKUAFiO1NVXSN2K6SddxrlIBjwP4AQKnJFg4ZlbzZKpfPue3WnBfoQ4XDUlUUCdBUddKIRPYbsfiLeiS6ADwPnAe2DXkrcBKYHgQSQoQkRJHtnL7Z3Nxc6t10V+hn1XjskB6bcE3HIkkSpdVVufbvlS0sk9lIJKbTewdfVqPx81jWa7iuAdwAFoAa4AkgB5wCjg5YGwO07WazOVP45+IJ0/UeaJScRXPLLIQjhsKBoFhopJuXtW1xvLlnX8YY2NNZq12uLC9Xdu8+6MYmnr4pWytLvncMWO0Fegk4PYJhCngEkGR9vf2bYVTLk3v3HzcS4jcUDxmvHnrIl98tLrb9TnuZ3aSRB84Ac4A9CPTSkHD3fQvAUlWpIqQDsYxc9Q19/2P38JEDgdBejbW6bnY2G4X1f3+MZrMvCCVSeP/9izFgFjgJPA2oQQz0IdOdQoA3QY5qcliuKfH7BZBCoOshNR2+SwECo9GvDmDcM0H4Yd3SgMeHJFpnQdRSKeXlsdY+AuDZtlOpVIxlx9NvTB74/LXS5Lkvyf8SBE4DRbqXmVLhw1E56wGRRKLjBH7Ttm2ZTCbjx9PpzwqhaO6OuBZg0p3UYpTx7jwdIhIlkUir2WgYDjTn60r0jrvg3wvoFPDqqCMFiBCCeDJZXV0pJO1Wa+4iRnPvcfXHIL7jxUBm1HgPKBKJ1G3PnamiUNejM/fGH73lnFuH0IFXRh3vAWmaplUtYzqgU+P//EbANiKZbGmpmuMGQRDow4x3gdR2vXkoEXcbDhNW9bZZcBcKQX8rIwF5VNXLmGa96XnHYhPaT+fZuuPktYLhMdAzVVUbKyvL+0w9Mv/eOZkflbw+VDD0zQBFUer5fEGn0nrYq1b/HreM9dFnIAgCqlULOl79XW/l1rkV7GsB5XLFhWK1ZbYeeJ9eHpf8JnX36vG36/V6Bcu61fzdpv8HfwDWw9k6jVtqLAAAAABJRU5ErkJggg==) 4 4, crosshair';
      newCanvas.defaultCursor = penCursor;
      newCanvas.hoverCursor = penCursor;
      newCanvas.freeDrawingCursor = penCursor;
    
      // Enable drawing mode by default
      newCanvas.isDrawingMode = true;
      
      // Apply cursor directly to DOM element
      const canvasEl = newCanvas.getElement();
      if (canvasEl) {
        canvasEl.style.cursor = penCursor;
      }
    }
    
    // Cleanup function for when component unmounts
    return () => {
      if (newCanvas) {
        try {
          console.log('Cleaning up canvas on unmount');
          // First remove all event listeners
          newCanvas.off();
          
          // Clear any objects on the canvas
          newCanvas.clear();
          
          // Call our enhanced cleanup function
          cleanupCanvasListeners(newCanvas);
          
          // Set canvas to null to avoid any future references
          setCanvas(null);
          setIsCanvasInitialized(false);
        } catch (error) {
          console.error('Error during canvas cleanup:', error);
        }
      }
    };
  }, [canvasContainerRef.current]); // Only depend on container ref - removing canvas from deps to avoid recreation loops

  // Handle loading images when URL changes - separate from canvas initialization
  useEffect(() => {
    if (!canvas || !isCanvasInitialized) return;
    
    const currentImageUrl = imageUrl;
    const previousImageUrl = previousImageUrlRef.current;
    
    // Update the ref for future comparison
    previousImageUrlRef.current = currentImageUrl;
    
    // If the imageUrl changed to null (deleted) and there was a previous URL
    if (previousImageUrl && !currentImageUrl) {
      console.log('Image URL changed to null, clearing canvas');
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      return;
    }
    
    // If we have a valid image URL, load it
    if (currentImageUrl) {
      console.log('Loading image URL to canvas:', currentImageUrl);
      loadImageToCanvas(canvas, currentImageUrl);
    } else {
      // If there's no image at all (initial state), ensure we have a clean canvas
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    }
  }, [canvas, imageUrl, isCanvasInitialized]);

  return {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight
  };
};
