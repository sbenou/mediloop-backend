
import { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { 
  initializeCanvas, 
  ensureWhiteBackground, 
  cleanupCanvasListeners,
  loadImageToCanvas
} from '../utils';

export interface UseCanvasInitializationProps {
  imageUrl: string | null;
}

export const useCanvasInitialization = ({ imageUrl }: UseCanvasInitializationProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [forcedRenderId, setForcedRenderId] = useState(0);
  const initAttempts = useRef(0);
  const isInitializing = useRef(false);
  const isUnmounted = useRef(false);

  // Track mount status to prevent operations after unmount
  useEffect(() => {
    isUnmounted.current = false;
    return () => {
      isUnmounted.current = true;
    };
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (canvasContainerRef.current && !canvas && !isInitializing.current && !isUnmounted.current) {
      isInitializing.current = true;
      
      try {
        const containerWidth = canvasContainerRef.current.clientWidth;
        const containerHeight = canvasContainerRef.current.clientHeight;
        
        setCanvasWidth(containerWidth);
        setCanvasHeight(containerHeight);
        
        // Create the Fabric canvas
        const fabricCanvas = initializeCanvas(canvasContainerRef.current, imageUrl);
        
        // Explicitly force white background
        fabricCanvas.backgroundColor = '#ffffff';
        fabricCanvas.renderAll();
        
        // Define the pen cursor
        const penCursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNC0wMy0xOFQxMDo0MDoyMSswMDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiBzdEV2dDp3aGVuPSIyMDI0LTAzLTE4VDEwOjQwOjIxKzAwOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlmfX50AAAOASURBVFiFvZdNbBtFFMd/M7vrXX/E+diNE9cxqFVLVakqSAQKCJA4UCSEeqiqigMSHDhw4AYHJITghhDiA4lDJcSFFokDUksrWoRagsKhTUFtSIljO3HsJE68H157d4fDxHHiOA5JU56U1a5m3r//m/+892ZFNW+HGGKMASkQA4LdrwAyUOt+a8Ch1p4ppXbGACQgAWSBKUAFiO1NVXSN2K6SddxrlIBjwP4AQKnJFg4ZlbzZKpfPue3WnBfoQ4XDUlUUCdBUddKIRPYbsfiLeiS6ADwPnAe2DXkrcBKYHgQSQoQkRJHtnL7Z3Nxc6t10V+hn1XjskB6bcE3HIkkSpdVVufbvlS0sk9lIJKbTewdfVqPx81jWa7iuAdwAFoAa4AkgB5wCjg5YGwO07WazOVP45+IJ0/UeaJScRXPLLIQjhsKBoFhopJuXtW1xvLlnX8YY2NNZq12uLC9Xdu8+6MYmnr4pWytLvncMWO0Fegk4PYJhCngEkGR9vf2bYVTLk3v3HzcS4jcUDxmvHnrIl98tLrb9TnuZ3aSRB84Ac4A9CPTSkHD3fQvAUlWpIqQDsYxc9Q19/2P38JEDgdBejbW6bnY2G4X1f3+MZrMvCCVSeP/9izFgFjgJPA2oQQz0IdOdQoA3QY5qcliuKfH7BZBCoOshNR2+SwECo9GvDmDcM0H4Yd3SgMeHJFpnQdRSKeXlsdY+AuDZtlOpVIxlx9NvTB74/LXS5Lkvyf8SBE4DRbqXmVLhw1E56wGRRKLjBH7Ttm2ZTCbjx9PpzwqhaO6OuBZg0p3UYpTx7jwdIhIlkUir2WgYDjTn60r0jrvg3wvoFPDqqCMFiBCCeDJZXV0pJO1Wa+4iRnPvcfXHIL7jxUBm1HgPKBKJ1G3PnamiUNejM/fGH73lnFuH0IFXRh3vAWmaplUtYzqgU+P//EbANiKZbGmpmuMGQRDow4x3gdR2vXkoEXcbDhNW9bZZcBcKQX8rIwF5VNXLmGa96XnHYhPaT+fZuuPktYLhMdAzVVUbKyvL+0w9Mv/eOZkflbw+VDD0zQBFUer5fEGn0nrYq1b/HreM9dFnIAgCqlULOl79XW/l1rkV7GsB5XLFhWK1ZbYeeJ9eHpf8JnX36vG36/V6Bcu61fzdpv8HfwDWw9k6jVtqLAAAAABJRU5ErkJggg==) 4 4, auto';
        
        // Set cursor explicitly for both canvas object and DOM element
        fabricCanvas.freeDrawingCursor = penCursor;
        fabricCanvas.hoverCursor = fabricCanvas.isDrawingMode ? penCursor : 'default';
        
        // Apply cursor directly to HTML element for better visibility
        const canvasElement = fabricCanvas.getElement();
        if (canvasElement) {
          canvasElement.style.position = 'absolute'; // Absolute positioning
          canvasElement.style.zIndex = '9999'; // Even higher z-index to ensure visibility
          canvasElement.style.pointerEvents = 'auto'; // Ensure it captures mouse events
          canvasElement.style.cursor = fabricCanvas.isDrawingMode ? penCursor : 'default';
          canvasElement.style.top = '0';
          canvasElement.style.left = '0';
          canvasElement.style.width = '100%';
          canvasElement.style.height = '100%';
          
          // Apply cursor style separately using inline stylesheet
          const style = document.createElement('style');
          style.innerHTML = `
            #${canvasElement.id} {
              cursor: ${fabricCanvas.isDrawingMode ? penCursor : 'default'} !important;
              z-index: 9999 !important;
            }
          `;
          document.head.appendChild(style);
          
          // Force cursor with !important flag directly
          canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' cursor: ' + (fabricCanvas.isDrawingMode ? penCursor : 'default') + ' !important; z-index: 9999 !important;');
        }
        
        // Force another render to ensure settings are applied
        setTimeout(() => {
          if (fabricCanvas && !isUnmounted.current) {
            try {
              fabricCanvas.backgroundColor = '#ffffff';
              
              // Reapply cursor settings
              const canvasElement = fabricCanvas.getElement();
              if (canvasElement && fabricCanvas.isDrawingMode) {
                canvasElement.style.cursor = penCursor;
                // Force cursor with priority
                canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 9999 !important;');
              }
              
              fabricCanvas.renderAll();
            } catch (err) {
              console.error("Error in post-init render:", err);
            }
          }
        }, 50);
        
        if (!isUnmounted.current) {
          setCanvas(fabricCanvas);
          isInitializing.current = false;
        }
        
        // Set up additional cursor enforcement for both drawing and non-drawing modes
        const enforceCursor = () => {
          if (fabricCanvas && !isUnmounted.current) {
            try {
              const canvasEl = fabricCanvas.getElement();
              if (canvasEl) {
                // Make sure cursor is showing by force-applying it
                if (fabricCanvas.isDrawingMode) {
                  canvasEl.style.cursor = penCursor;
                  canvasEl.setAttribute('style', canvasEl.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 9999 !important;');
                }
              }
            } catch (err) {
              console.error("Error enforcing cursor:", err);
            }
          }
        };
        
        // Apply multiple times to ensure it catches any race conditions
        if (!isUnmounted.current) {
          setTimeout(enforceCursor, 100);
          setTimeout(enforceCursor, 500);
        }
        
      } catch (error) {
        console.error('Error initializing canvas:', error);
        initAttempts.current++;
        isInitializing.current = false;
        
        // If we've tried too many times, stop trying
        if (initAttempts.current < 3 && !isUnmounted.current) {
          // Try again in a moment
          setTimeout(() => {
            setForcedRenderId(id => id + 1);
          }, 500);
        }
      }
    }
    
    return () => {
      if (canvas) {
        try {
          cleanupCanvasListeners(canvas);
          canvas.dispose();
        } catch (error) {
          console.error("Error cleaning up canvas:", error);
        }
      }
    };
  }, [forcedRenderId, imageUrl, canvas]);

  // Apply event listeners to ensure white background and proper cursor
  useEffect(() => {
    if (!canvas || isUnmounted.current) return;
    
    try {
      // Force white background immediately
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      
      // Set up ongoing enforcement of background
      ensureWhiteBackground(canvas);
      
      // Define pen cursor for consistent application
      const penCursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNC0wMy0xOFQxMDo0MDoyMSswMDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiBzdEV2dDp3aGVuPSIyMDI0LTAzLTE4VDEwOjQwOjIxKzAwOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlmfX50AAAOASURBVFiFvZdNbBtFFMd/M7vrXX/E+diNE9cxqFVLVakqSAQKCJA4UCSEeqiqigMSHDhw4AYHJITghhDiA4lDJcSFFokDUksrWoRagsKhTUFtSIljO3HsJE68H157d4fDxHHiOA5JU56U1a5m3r//m/+892ZFNW+HGGKMASkQA4LdrwAyUOt+a8Ch1p4ppXbGACQgAWSBKUAFiO1NVXSN2K6SddxrlIBjwP4AQKnJFg4ZlbzZKpfPue3WnBfoQ4XDUlUUCdBUddKIRPYbsfiLeiS6ADwPnAe2DXkrcBKYHgQSQoQkRJHtnL7Z3Nxc6t10V+hn1XjskB6bcE3HIkkSpdVVufbvlS0sk9lIJKbTewdfVqPx81jWa7iuAdwAFoAa4AkgB5wCjg5YGwO07WazOVP45+IJ0/UeaJScRXPLLIQjhsKBoFhopJuXtW1xvLlnX8YY2NNZq12uLC9Xdu8+6MYmnr4pWytLvncMWO0Fegk4PYJhCngEkGR9vf2bYVTLk3v3HzcS4jcUDxmvHnrIl98tLrb9TnuZ3aSRB84Ac4A9CPTSkHD3fQvAUlWpIqQDsYxc9Q19/2P38JEDgdBejbW6bnY2G4X1f3+MZrMvCCVSeP/9izFgFjgJPA2oQQz0IdOdQoA3QY5qcliuKfH7BZBCoOshNR2+SwECo9GvDmDcM0H4Yd3SgMeHJFpnQdRSKeXlsdY+AuDZtlOpVIxlx9NvTB74/LXS5Lkvyf8SBE4DRbqXmVLhw1E56wGRRKLjBH7Ttm2ZTCbjx9PpzwqhaO6OuBZg0p3UYpTx7jwdIhIlkUir2WgYDjTn60r0jrvg3wvoFPDqqCMFiBCCeDJZXV0pJO1Wa+4iRnPvcfXHIL7jxUBm1HgPKBKJ1G3PnamiUNejM/fGH73lnFuH0IFXRh3vAWmaplUtYzqgU+P//EbANiKZbGmpmuMGQRDow4x3gdR2vXkoEXcbDhNW9bZZcBcKQX8rIwF5VNXLmGa96XnHYhPaT+fZuuPktYLhMdAzVVUbKyvL+0w9Mv/eOZkflbw+VDD0zQBFUer5fEGn0nrYq1b/HreM9dFnIAgCqlULOl79XW/l1rkV7GsB5XLFhWK1ZbYeeJ9eHpf8JnX36vG36/V6Bcu61fzdpv8HfwDWw9k6jVtqLAAAAABJRU5ErkJggg==) 4 4, auto';
      
      // Add a mouse:over event to ensure cursor is visible, with null checks
      const mouseOverHandler = () => {
        try {
          if (!canvas || isUnmounted.current) return;
          
          const canvasElement = canvas.getElement();
          if (!canvasElement) return;
          
          if (canvas.isDrawingMode) {
            canvasElement.style.position = 'absolute';
            canvasElement.style.zIndex = '9999'; // Increased z-index for visibility
            canvasElement.style.cursor = penCursor;
            
            // Add !important to cursor style
            canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 9999 !important;');
            
            // Also add a class to force cursor visibility
            canvasElement.classList.add('pen-cursor-active');
            
            // Add a direct style element for this specific canvas
            if (canvasElement.id) {
              const existingStyle = document.getElementById(`style-${canvasElement.id}`);
              if (!existingStyle) {
                const style = document.createElement('style');
                style.id = `style-${canvasElement.id}`;
                style.innerHTML = `
                  #${canvasElement.id} {
                    cursor: ${penCursor} !important;
                    z-index: 9999 !important;
                    position: absolute !important;
                  }
                  .pen-cursor-active {
                    cursor: ${penCursor} !important;
                  }
                `;
                document.head.appendChild(style);
              }
            }
          }
        } catch (err) {
          console.error("Error in mouse:over handler:", err);
        }
      };
      
      canvas.on('mouse:over', mouseOverHandler);
      
      // Handle pointer/touch events for mobile 
      const mouseDownHandler = () => {
        try {
          if (!canvas || isUnmounted.current) return;
          
          // This runs for both mouse and touch events
          const canvasElement = canvas.getElement();
          if (!canvasElement) return;
          
          if (canvas.isDrawingMode) {
            canvasElement.style.cursor = penCursor;
            canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 9999 !important;');
          }
        } catch (err) {
          console.error("Error in mouse:down handler:", err);
        }
      };
      
      const mouseMoveHandler = () => {
        try {
          if (!canvas || isUnmounted.current) return;
          
          // This runs during both mouse moves and touch drags
          const canvasElement = canvas.getElement();
          if (!canvasElement) return;
          
          if (canvas.isDrawingMode) {
            canvasElement.style.cursor = penCursor;
            canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 9999 !important;');
            
            // Ensure z-index is high
            canvasElement.style.zIndex = '9999';
          }
        } catch (err) {
          console.error("Error in mouse:move handler:", err);
        }
      };
      
      canvas.on('mouse:down', mouseDownHandler);
      canvas.on('mouse:move', mouseMoveHandler);
      
      // Ensure canvas position and z-index
      const canvasElement = canvas.getElement();
      if (canvasElement) {
        canvasElement.style.position = 'absolute';
        canvasElement.style.zIndex = '9999'; // Increased z-index
        canvasElement.style.top = '0';
        canvasElement.style.left = '0';
        canvasElement.style.width = '100%'; 
        canvasElement.style.height = '100%';
        
        // Apply a unique ID if not already present
        if (!canvasElement.id) {
          canvasElement.id = `canvas-${Date.now()}`;
        }
        
        // Add a style tag specific to this canvas element to ensure cursor visibility
        const style = document.createElement('style');
        style.id = `style-${canvasElement.id}`;
        style.innerHTML = `
          #${canvasElement.id} {
            cursor: ${canvas.isDrawingMode ? penCursor : 'default'} !important;
            z-index: 9999 !important;
            position: absolute !important;
            pointer-events: auto !important;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Set up cursor enforcement on a timer
      const cursorEnforcementInterval = setInterval(() => {
        try {
          if (!canvas || isUnmounted.current) {
            clearInterval(cursorEnforcementInterval);
            return;
          }
          
          if (canvas.isDrawingMode) {
            const canvasEl = canvas.getElement();
            if (canvasEl) {
              canvasEl.style.cursor = penCursor;
              canvasEl.style.zIndex = '9999';
              
              // Force cursor with !important
              canvasEl.setAttribute('style', canvasEl.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 9999 !important;');
            }
          }
        } catch (err) {
          console.error("Error in cursor enforcement interval:", err);
          clearInterval(cursorEnforcementInterval);
        }
      }, 300); // More frequent enforcement
      
      // Clean up event listeners
      return () => {
        try {
          // Clear the interval to prevent references to disposed canvas
          clearInterval(cursorEnforcementInterval);
          
          if (canvas) {
            try {
              // Safely remove event handlers
              canvas.off('mouse:over', mouseOverHandler);
              canvas.off('mouse:down', mouseDownHandler);
              canvas.off('mouse:move', mouseMoveHandler);
              
              // Clean up canvas resources
              cleanupCanvasListeners(canvas);
            } catch (err) {
              console.error("Error removing canvas event listeners:", err);
            }
          }
          
          // Clean up any style elements we created
          const canvasEl = canvas?.getElement();
          if (canvasEl && canvasEl.id) {
            const styleElement = document.getElementById(`style-${canvasEl.id}`);
            if (styleElement) {
              styleElement.remove();
            }
          }
        } catch (err) {
          console.error("Error in canvas cleanup:", err);
        }
      };
    } catch (error) {
      console.error("Error in canvas event setup:", error);
      return () => {}; // Return empty cleanup to prevent errors
    }
  }, [canvas]);

  // Load image URL if available, or enforce white canvas
  useEffect(() => {
    if (!canvas || isUnmounted.current) return;
    
    try {
      if (imageUrl) {
        loadImageToCanvas(canvas, imageUrl);
      } else {
        // If no URL but canvas exists, ensure it's white
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      }
    } catch (error) {
      console.error("Error loading image to canvas:", error);
    }
  }, [canvas, imageUrl]);

  return {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight,
    setCanvasWidth,
    setCanvasHeight
  };
};
