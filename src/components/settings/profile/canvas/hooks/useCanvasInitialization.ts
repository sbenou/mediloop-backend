
import { useRef, useState, useEffect } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Image as FabricImage } from 'fabric';

interface UseCanvasInitializationProps {
  imageUrl: string | null;
}

export const useCanvasInitialization = ({ imageUrl }: UseCanvasInitializationProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(500);
  const [canvasHeight, setCanvasHeight] = useState<number>(300);
  const canvasCreated = useRef(false);

  useEffect(() => {
    if (!canvasContainerRef.current || canvasCreated.current) return;

    const canvasEl = document.createElement('canvas');
    canvasEl.id = 'canvas';
    canvasContainerRef.current.appendChild(canvasEl);

    const width = canvasContainerRef.current.clientWidth || 500;
    const height = 300;

    setCanvasWidth(width);
    setCanvasHeight(height);

    const canvasInstance = new FabricCanvas(canvasEl, {
      backgroundColor: '#ffffff',
      width: width,
      height: height,
      isDrawingMode: true,
      selection: true,
      renderOnAddRemove: true
    });

    // Initialize brush properly
    canvasInstance.freeDrawingBrush = new PencilBrush(canvasInstance);
    canvasInstance.freeDrawingBrush.width = 3; 
    canvasInstance.freeDrawingBrush.color = '#000000';

    // Explicitly set background color and render
    canvasInstance.backgroundColor = '#ffffff';
    
    // Set cursor styles to ensure visibility
    const penCursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNC0wMy0xOFQxMDo0MDoyMSswMDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiBzdEV2dDp3aGVuPSIyMDI0LTAzLTE4VDEwOjQwOjIxKzAwOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlmfX50AAAOASURBVFiFvZdNbBtFFMd/M7vrXX/E+diNE9cxqFVLVakqSAQKCJA4UCSEeqiqigMSHDhw4AYHJITghhDiA4lDJcSFFokDUksrWoRagsKhTUFtSIljO3HsJE68H157d4fDxHHiOA5JU56U1a5m3r//m/+892ZFNW+HGGKMASkQA4LdrwAyUOt+a8Ch1p4ppXbGACQgAWSBKUAFiO1NVXSN2K6SddxrlIBjwP4AQKnJFg4ZlbzZKpfPue3WnBfoQ4XDUlUUCdBUddKIRPYbsfiLeiS6ADwPnAe2DXkrcBKYHgQSQoQkRJHtnL7Z3Nxc6t10V+hn1XjskB6bcE3HIkkSpdVVufbvlS0sk9lIJKbTewdfVqPx81jWa7iuAdwAFoAa4AkgB5wCjg5YGwO07WazOVP45+IJ0/UeaJScRXPLLIQjhsKBoFhopJuXtW1xvLlnX8YY2NNZq12uLC9Xdu8+6MYmnr4pWytLvncMWO0Fegk4PYJhCngEkGR9vf2bYVTLk3v3HzcS4jcUDxmvHnrIl98tLrb9TnuZ3aSRB84Ac4A9CPTSkHD3fQvAUlWpIqQDsYxc9Q19/2P38JEDgdBejbW6bnY2G4X1f3+MZrMvCCVSeP/9izFgFjgJPA2oQQz0IdOdQoA3QY5qcliuKfH7BZBCoOshNR2+SwECo9GvDmDcM0H4Yd3SgMeHJFpnQdRSKeXlsdY+AuDZtlOpVIxlx9NvTB74/LXS5Lkvyf8SBE4DRbqXmVLhw1E56wGRRKLjBH7Ttm2ZTCbjx9PpzwqhaO6OuBZg0p3UYpTx7jwdIhIlkUir2WgYDjTn60r0jrvg3wvoFPDqqCMFiBCCeDJZXV0pJO1Wa+4iRnPvcfXHIL7jxUBm1HgPKBKJ1G3PnamiUNejM/fGH73lnFuH0IFXRh3vAWmaplUtYzqgU+P//EbANiKZbGmpmuMGQRDow4x3gdR2vXkoEXcbDhNW9bZZcBcKQX8rIwF5VNXLmGa96XnHYhPaT+fZuuPktYLhMdAzVVUbKyvL+0w9Mv/eOZkflbw+VDD0zQBFUer5fEGn0nrYq1b/HreM9dFnIAgCqlULOl79XW/l1rkV7GsB5XLFhWK1ZbYeeJ9eHpf8JnX36vG36/V6Bcu61fzdpv8HfwDWw9k6jVtqLAAAAABJRU5ErkJggg==) 4 4, crosshair';
    canvasInstance.defaultCursor = penCursor;
    canvasInstance.hoverCursor = penCursor;
    
    // Also apply cursor directly to DOM element
    const canvasElDom = canvasInstance.getElement();
    if (canvasElDom) {
      canvasElDom.style.cursor = penCursor;
    }
    
    // Force hard render
    canvasInstance.renderAll();
    canvasInstance.requestRenderAll();
    canvasInstance.calcOffset();

    console.log('Canvas initialized with dimensions:', width, 'x', height);
    
    // Remove test shapes - we don't need them anymore since canvas is working
    // The test rectangle was only for debugging and is no longer needed
    
    setCanvas(canvasInstance);
    canvasCreated.current = true;

    return () => {
      canvasInstance.dispose();
      canvasCreated.current = false;
    };
  }, []);

  useEffect(() => {
    if (!canvas || !imageUrl) return;

    console.log('Loading image URL to canvas:', imageUrl);
    
    // Use backgroundColor property directly instead of setBackgroundColor method
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    
    // Uncomment image loading code now that canvas visibility is fixed
    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous',
    }).then(img => {
      console.log('Image loaded successfully:', img.width, 'x', img.height);
      
      const canvasAspect = canvas.width! / canvas.height!;
      const imgAspect = img.width! / img.height!;

      let scaleFactor = (canvas.width! * 0.9) / img.width!;
      if (imgAspect <= canvasAspect) {
        scaleFactor = (canvas.height! * 0.9) / img.height!;
      }

      img.scale(scaleFactor);
      img.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        opacity: 1
      });

      // Re-establish white background
      canvas.backgroundColor = '#ffffff';
      
      // FIX: Correctly add the image at the bottom layer
      console.log('Adding image to canvas');
      canvas.add(img);
      canvas.sendObjectToBack(img);
      
      // 🛑 Make absolutely sure the image is behind everything
      img.set({ opacity: 1 });
      canvas.getObjects().forEach(obj => {
        if (obj !== img) {
          // Fix: Using the correct method name for Fabric.js v6
          canvas.bringObjectToFront(obj);
        }
      });
      
      // Additional verification to make sure image stays at back
      setTimeout(() => {
        canvas.sendObjectToBack(img);
        console.log('Canvas objects after image added:', canvas.getObjects().length);
        canvas.renderAll();
      }, 100);
      
      canvas.renderAll();
    }).catch(err => {
      console.error("Error loading image:", err);
    });
    
    // Remove the debug circle - no longer needed for testing
    
  }, [canvas, imageUrl]);

  return {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight
  };
};
