
import { useState, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';

export interface UseDrawingToolsProps {
  canvas: FabricCanvas | null;
}

export const useDrawingTools = ({ canvas }: UseDrawingToolsProps) => {
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [selectedTool, setSelectedTool] = useState<'draw' | 'select' | 'shape' | 'text' | 'date' | 'checkbox'>('draw');
  const [selectedShape, setSelectedShape] = useState<'circle' | 'rectangle' | 'line' | null>(null);

  // Define pen cursor as a constant to ensure consistency
  const penCursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNC0wMy0xOFQxMDo0MDoyMSswMDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiBzdEV2dDp3aGVuPSIyMDI0LTAzLTE4VDEwOjQwOjIxKzAwOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlmfX50AAAOASURBVFiFvZdNbBtFFMd/M7vrXX/E+diNE9cxqFVLVakqSAQKCJA4UCSEeqiqigMSHDhw4AYHJITghhDiA4lDJcSFFokDUksrWoRagsKhTUFtSIljO3HsJE68H157d4fDxHHiOA5JU56U1a5m3r//m/+892ZFNW+HGGKMASkQA4LdrwAyUOt+a8Ch1p4ppXbGACQgAWSBKUAFiO1NVXSN2K6SddxrlIBjwP4AQKnJFg4ZlbzZKpfPue3WnBfoQ4XDUlUUCdBUddKIRPYbsfiLeiS6ADwPnAe2DXkrcBKYHgQSQoQkRJHtnL7Z3Nxc6t10V+hn1XjskB6bcE3HIkkSpdVVufbvlS0sk9lIJKbTewdfVqPx81jWa7iuAdwAFoAa4AkgB5wCjg5YGwO07WazOVP45+IJ0/UeaJScRXPLLIQjhsKBoFhopJuXtW1xvLlnX8YY2NNZq12uLC9Xdu8+6MYmnr4pWytLvncMWO0Fegk4PYJhCngEkGR9vf2bYVTLk3v3HzcS4jcUDxmvHnrIl98tLrb9TnuZ3aSRB84Ac4A9CPTSkHD3fQvAUlWpIqQDsYxc9Q19/2P38JEDgdBejbW6bnY2G4X1f3+MZrMvCCVSeP/9izFgFjgJPA2oQQz0IdOdQoA3QY5qcliuKfH7BZBCoOshNR2+SwECo9GvDmDcM0H4Yd3SgMeHJFpnQdRSKeXlsdY+AuDZtlOpVIxlx9NvTB74/LXS5Lkvyf8SBE4DRbqXmVLhw1E56wGRRKLjBH7Ttm2ZTCbjx9PpzwqhaO6OuBZg0p3UYpTx7jwdIhIlkUir2WgYDjTn60r0jrvg3wvoFPDqqCMFiBCCeDJZXV0pJO1Wa+4iRnPvcfXHIL7jxUBm1HgPKBKJ1G3PnamiUNejM/fGH73lnFuH0IFXRh3vAWmaplUtYzqgU+P//EbANiKZbGmpmuMGQRDow4x3gdR2vXkoEXcbDhNW9bZZcBcKQX8rIwF5VNXLmGa96XnHYhPaT+fZuuPktYLhMdAzVVUbKyvL+0w9Mv/eOZkflbw+VDD0zQBFUer5fEGn0nrYq1b/HreM9dFnIAgCqlULOl79XW/l1rkV7GsB5XLFhWK1ZbYeeJ9eHpf8JnX36vG36/V6Bcu61fzdpv8HfwDWw9k6jVtqLAAAAABJRU5ErkJggg==) 4 4, auto';

  // Ensure brush settings are properly applied whenever relevant props change
  useEffect(() => {
    if (!canvas) return;
    
    try {
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = penColor;
        canvas.freeDrawingBrush.width = brushSize;
        
        // Make sure objects created are visible and interactive
        canvas.freeDrawingBrush.shadow = null;
        canvas.freeDrawingBrush.strokeLineCap = 'round';
        canvas.freeDrawingBrush.strokeLineJoin = 'round';

        // Force a render to ensure settings are applied
        canvas.renderAll();
      }
    } catch (error) {
      console.error("Error applying brush settings:", error);
    }
  }, [canvas, penColor, brushSize]);

  // Apply drawing mode state when it changes
  useEffect(() => {
    if (!canvas) return;
    
    try {
      // Update canvas drawing mode
      canvas.isDrawingMode = isDrawMode;
      
      // Explicitly set cursor based on drawing mode
      if (isDrawMode) {
        // Set cursor on the canvas object
        canvas.freeDrawingCursor = penCursor;
        canvas.hoverCursor = penCursor;
        
        // Apply directly to the HTML element to ensure cursor visibility
        try {
          const canvasElement = canvas.getElement();
          if (canvasElement) {
            canvasElement.style.position = 'absolute'; // Absolute positioning
            canvasElement.style.zIndex = '999999'; // Higher z-index
            canvasElement.style.cursor = penCursor;
            canvasElement.style.top = '0';
            canvasElement.style.left = '0';
            canvasElement.style.width = '100%';
            canvasElement.style.height = '100%';
            
            // Force cursor by adding an inline style with !important
            canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 999999 !important;');
          }
        } catch (elemError) {
          console.error("Error getting canvas element:", elemError);
        }
        
        // Reapply brush settings when entering drawing mode
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = penColor;
          canvas.freeDrawingBrush.width = brushSize;
        }
      } else {
        // Default cursor for selection mode
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'default';
        
        try {
          const canvasElement = canvas.getElement();
          if (canvasElement) {
            canvasElement.style.cursor = 'default';
          }
        } catch (elemError) {
          console.error("Error getting canvas element:", elemError);
        }
      }
      
      // Force a render to apply changes
      canvas.renderAll();
      
      // Apply cursor with a delay to catch any race conditions
      setTimeout(() => {
        try {
          if (canvas && isDrawMode) {
            try {
              const canvasElement = canvas.getElement();
              if (canvasElement) {
                canvasElement.style.cursor = penCursor;
                canvasElement.style.zIndex = '999999'; // Higher z-index
              }
            } catch (elemError) {
              console.error("Error getting canvas element in delayed update:", elemError);
            }
          }
        } catch (e) {
          console.error("Delayed cursor update error:", e);
        }
      }, 100);
    } catch (error) {
      console.error("Error updating drawing mode:", error);
    }
  }, [canvas, isDrawMode, penColor, brushSize, penCursor]);

  // Cleanup effect - important to prevent errors on logout
  useEffect(() => {
    return () => {
      // Safely handle cleanup without trying to access canvas which might not exist anymore
      try {
        if (canvas) {
          // Remove any event listeners that might cause errors on unmount
          canvas.off();
        }
      } catch (error) {
        console.error("Error in canvas cleanup:", error);
      }
    };
  }, [canvas]);

  // Toggle drawing mode
  const toggleDrawMode = () => {
    if (!canvas) return;
    
    try {
      const newMode = !isDrawMode;
      setIsDrawMode(newMode);
      
      // Update canvas drawing mode
      canvas.isDrawingMode = newMode;
      
      if (newMode) {
        // Set cursor for drawing mode
        canvas.freeDrawingCursor = penCursor;
        canvas.hoverCursor = penCursor;
        
        // Apply directly to the HTML element for immediate visibility
        try {
          const canvasElement = canvas.getElement();
          if (canvasElement) {
            canvasElement.style.position = 'absolute';
            canvasElement.style.zIndex = '999999';
            canvasElement.style.cursor = penCursor;
            canvasElement.style.top = '0';
            canvasElement.style.left = '0';
            canvasElement.style.width = '100%';
            canvasElement.style.height = '100%';
            
            // Force cursor by adding !important
            canvasElement.setAttribute('style', canvasElement.getAttribute('style') + ' cursor: ' + penCursor + ' !important; z-index: 999999 !important;');
          }
        } catch (elemError) {
          console.error("Error getting canvas element in toggleDrawMode:", elemError);
        }
        
        // Ensure brush settings are applied
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = penColor;
          canvas.freeDrawingBrush.width = brushSize;
        }
        
        setSelectedTool('draw');
        
        // Force cursor update with a delay
        setTimeout(() => {
          try {
            if (!canvas) return;
            
            try {
              const canvasElement = canvas.getElement();
              if (canvasElement) {
                canvasElement.style.cursor = penCursor;
                canvasElement.style.zIndex = '999999';
              }
            } catch (elemError) {
              console.error("Error getting canvas element in delayed toggle update:", elemError);
            }
          } catch (e) {
            console.error("Delayed toggle cursor update error:", e);
          }
        }, 100);
      } else {
        // Reset to default cursor for selection mode
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'default';
        
        // Apply to HTML element
        try {
          const canvasElement = canvas.getElement();
          if (canvasElement) {
            canvasElement.style.cursor = 'default';
          }
        } catch (elemError) {
          console.error("Error getting canvas element when resetting cursor:", elemError);
        }
        
        setSelectedTool('select');
      }

      // Force a render to ensure cursor and mode changes take effect
      canvas.renderAll();

      // Always ensure background is white regardless of mode change
      if (canvas) {
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      }
    } catch (error) {
      console.error("Error toggling draw mode:", error);
    }
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    setPenColor(color);
    if (!canvas) return;
    
    try {
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color;
        // Force a render after changing brush color
        canvas.renderAll();
      }
      
      // Ensure background stays white when changing colors
      if (canvas) {
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      }
    } catch (error) {
      console.error("Error changing brush color:", error);
    }
  };

  // Handle brush size change
  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    if (!canvas) return;
    
    try {
      if (canvas.freeDrawingBrush) {
        changeBrushSizeUtil(canvas, size);
        // Force a render after changing brush size
        canvas.renderAll();
      }
    } catch (error) {
      console.error("Error changing brush size:", error);
    }
  };

  return {
    isDrawMode,
    penColor,
    brushSize,
    selectedTool,
    selectedShape,
    setSelectedTool,
    setSelectedShape,
    toggleDrawMode,
    handleColorChange,
    handleBrushSizeChange
  };
};

// Import this from utils but declare it here to avoid circular dependencies
const changeBrushSizeUtil = (canvas: FabricCanvas, size: number) => {
  if (!canvas || !canvas.freeDrawingBrush) return;
  
  try {
    canvas.freeDrawingBrush.width = size;
    // Force a render after changing brush size
    canvas.renderAll();
  } catch (error) {
    console.error("Error in changeBrushSizeUtil:", error);
  }
};
