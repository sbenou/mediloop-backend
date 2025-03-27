
import { useRef, useState, useEffect } from 'react';
import { Canvas as FabricCanvas, Image as FabricImage } from 'fabric';

interface UseCanvasInitializationProps {
  imageUrl: string | null;
}

export const useCanvasInitialization = ({ imageUrl }: UseCanvasInitializationProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(400);
  const [canvasHeight, setCanvasHeight] = useState(200);
  const canvasCreated = useRef(false);
  
  // Initialize canvas
  useEffect(() => {
    // Don't re-initialize if canvas already exists
    if (canvasCreated.current || !canvasContainerRef.current) {
      return;
    }
    
    try {
      console.log("Creating new fabric canvas instance");
      
      // Create the canvas element if it doesn't exist
      let canvasElement = document.getElementById('canvas') as HTMLCanvasElement | null;
      if (!canvasElement) {
        canvasElement = document.createElement('canvas');
        canvasElement.id = 'canvas';
        canvasContainerRef.current.appendChild(canvasElement);
      }
      
      const canvasInstance = new FabricCanvas('canvas', {
        backgroundColor: '#ffffff',
        width: canvasWidth,
        height: canvasHeight,
        selection: true,
        preserveObjectStacking: true,
        isDrawingMode: true, // ✅ Enable drawing mode by default
        renderOnAddRemove: true
      });
      
      // Set the canvas instance to state
      setCanvas(canvasInstance);
      canvasCreated.current = true;
      
      // Set white background
      canvasInstance.backgroundColor = '#ffffff';
      canvasInstance.renderAll();
      
      console.log("Canvas initialized successfully");
      
      // Clean up when component unmounts
      return () => {
        console.log("Disposing canvas");
        canvasInstance.dispose();
        canvasCreated.current = false;
      };
    } catch (error) {
      console.error("Error initializing canvas:", error);
    }
  }, [canvasWidth, canvasHeight, canvasContainerRef]);
  
  // Handle loading image from URL if provided
  useEffect(() => {
    if (!canvas || !imageUrl) return;
    
    console.log("Loading image from URL:", imageUrl);
    
    // Clear existing canvas content first
    try {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      
      // In Fabric.js v6, we need to use the FabricImage.fromURL method with the correct syntax
      FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })
        .then((img) => {
          console.log("Image loaded from URL:", img);
          
          // Resize image to fit within canvas while maintaining aspect ratio
          const canvasAspect = canvas.width! / canvas.height!;
          const imgAspect = img.width! / img.height!;
          
          let scaleFactor;
          if (imgAspect > canvasAspect) {
            // Image is wider than canvas
            scaleFactor = (canvas.width! * 0.9) / img.width!;
          } else {
            // Image is taller than canvas
            scaleFactor = (canvas.height! * 0.9) / img.height!;
          }
          
          img.scale(scaleFactor);
          
          // Center the image on the canvas
          img.set({
            left: canvas.width! / 2,
            top: canvas.height! / 2,
            originX: 'center',
            originY: 'center',
            selectable: false, // ✅ Make image non-selectable so it works as background
            evented: false     // ✅ Don't capture mouse events
          });
          
          canvas.add(img);
          canvas.renderAll();
          
          console.log("Image added to canvas");
        })
        .catch(error => {
          console.error("Error loading image:", error);
        });
    } catch (error) {
      console.error("Error loading image to canvas:", error);
    }
  }, [canvas, imageUrl]);
  
  // Watch for container size changes and resize canvas
  useEffect(() => {
    if (!canvas || !canvasContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const newWidth = entries[0].contentRect.width;
      // Don't change height based on container width for now
      // const newHeight = entries[0].contentRect.height;
      
      // Only resize if the change is substantial (> 5px)
      if (Math.abs(newWidth - canvasWidth) > 5) {
        setCanvasWidth(newWidth);
        canvas.setWidth(newWidth);
        canvas.renderAll();
      }
    });
    
    resizeObserver.observe(canvasContainerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [canvas, canvasWidth, canvasHeight, canvasContainerRef]);

  return {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight
  };
};
